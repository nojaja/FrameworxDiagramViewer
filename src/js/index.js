
import OrgChart from 'orgchart';
import 'orgchart/dist/css/jquery.orgchart.min.css'
import '../css/style.css'
import Handlebars from "handlebars";
import Dao from "./dao.js";

const dao = new Dao()

//GETパラメータの取得
const getParam = function () {
  const arg = new Object();
  const pair = location.search.substring(1).split("&");
  for (let i = 0; pair[i]; i++) {
    let kv = pair[i].split("=");
    arg[kv[0]] = kv[1];
  }
  return arg
}


let oc; //階層チャート
//View///////////////////////////////////////////////////
//コンテンツロード完了イベントのハンドリング
document.addEventListener('DOMContentLoaded', function () {
  //階層チャートの初回描画
  oc = $('#chart-container').orgchart({
    'data': {},
    //'depth': 2,
    //'toggleSiblingsResp': false,
    'nodeContent': 'title',
    'parentNodeSymbol': '',
    'createNode': function ($node, data) {
      //各ノードのクリックイベントのハンドリング
      $node.on('click', function () {
        //ノードのID表示用のURLをhistoryに追加して、再描画
        const type = getParam()["type"] || '0'
        $node.attr('data-q',data.name)
        $node.attr('data-type',type)
        window.history.pushState({}, document.title, `${window.location.origin}${window.location.pathname}?q=${data.name}&type=${type}`)
        pageGen(type, data.name);
      });
      $node.find('.leftEdge').removeClass('leftEdge');
      $node.find('.rightEdge').removeClass('rightEdge');
      $node.find('.topEdge').removeClass('topEdge');
      $node.find('.bottomEdge').removeClass('bottomEdge');
    }
  });
});

// ページの読み込み完了イベントのハンドリング
window.addEventListener('load', async (event) => {
  //初回表示時の描画
  const id = getParam()["q"] || '3.2'
  const type = getParam()["type"] || '0'
  pageGen(type, id);
});

// ページ移動 イベントをハンドリング
window.addEventListener('popstate', (event) => {
  //移動先のパラメータで再描画
  const id = getParam()["q"] || '3.2'
  const type = getParam()["type"] || '0'
  pageGen(type, id);
});

const pageCache = {}

//ページの描画処理
let pageGen = async function (table, id) {
  let getPageTemplate = async function (table) {
    if(dao.checkTable(table)) throw new Error(table + ' TABLES not exist')
    //table単位でページテンプレートを読み込み
    if (!pageCache[table]) {
      const response = await (await fetch("./assets/" + table + ".tmp", { method: "get" })).text();
      pageCache[table] = Handlebars.compile(response);
    }
    return pageCache[table]
  }

  const data = await dao.getData(table, id)
  const template = await getPageTemplate(table)
  document.getElementById("content_body").innerHTML = template({ data: data })

  //リンクイベント作成
  const parentlink_elements = document.getElementsByClassName("parentlink")
  for (let i = 0; i < parentlink_elements.length; i++) {
    parentlink_elements[i].onclick = function (parentlink_element) {
      return (event) => {
        //ノードのID表示用のURLをhistoryに追加して、再描画
        const id = parentlink_element.dataset.id
        const type = parentlink_element.dataset.type
        window.history.pushState({}, document.title, `${window.location.origin}${window.location.pathname}?q=${id}&type=${type}`)
        pageGen(type, id);
      }
    } (parentlink_elements[i])
  }


  //組織図のクリックイベント作成
  const node_elements = document.getElementsByClassName("node")
  for (let i = 0; i < node_elements.length; i++) {
    node_elements[i].onclick = function (node_element) {
      return (event) => {
        //ノードのID表示用のURLをhistoryに追加して、再描画
        const id = node_element.dataset.id
        const type = node_element.dataset.type
        window.history.pushState({}, document.title, `${window.location.origin}${window.location.pathname}?q=${id}&type=${type}`)
        pageGen(type, id);
      }
    } (node_elements[i])
  }
}

Handlebars.registerHelper("oc", function(context, options) {
  const chartContainer = oc.init({ 
    'data': context ,
    'createNode': function ($node, data) {
        $node.attr('data-id',data.name)
        $node.attr('data-type',data.table)
      }
    }).$chartContainer[0]
  return new Handlebars.SafeString(chartContainer.outerHTML)
});