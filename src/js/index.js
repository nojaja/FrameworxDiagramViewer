
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
let pageGen = async function (type, id) {
  const table = dao.TABLES[type]

  let getPageTemplate = async function (table) {
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
  data.chartContainer = oc.init({ 'data': data }).$chartContainer[0]
  document.getElementById("chart-container").appendChild(data.chartContainer)
  const elements = document.getElementsByClassName("parentlink")
  for (let i = 0; i < elements.length; i++) {
    elements[i].onclick = (event) => {
      //ノードのID表示用のURLをhistoryに追加して、再描画
      console.log('onclick', data.parent, event.target.attributes['data-id'])
      //const id = event.target.attributes['data-id'].nodeValue
      window.history.pushState({}, document.title, `${window.location.origin}${window.location.pathname}?q=${data.parent}&type=${type}`)
      pageGen(type, data.parent);
    }
  }
}
