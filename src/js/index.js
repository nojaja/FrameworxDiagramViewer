
import OrgChart from 'orgchart';
import 'orgchart/dist/css/jquery.orgchart.min.css'
import '../css/style.css'
import Handlebars from "handlebars";
import Dao from "./dao.js";

const pageCache = {}


//setting loader
let setting = null
const getSetting = async function () {
  if(!setting){
    await fetch("./assets/setting.json", {
      method: "get"
    }).then(async (response) => {
      if (response.status === 200) {
        console.log(response); // => "OK"
        setting = await response.json()
        console.log(setting)
        return setting
      } else {
        console.log(response.statusText); // => Error Message
        return {}
      }
    }).catch((response) => {
      console.log(response); // => "TypeError: ~"
      return {}
    });
  }
  return setting
}

//GETパラメータの取得
const getParam = async function (key) {
  const arg = new Object();
  const pair = location.search.substring(1).split("&");
  for (let i = 0; pair[i]; i++) {
    let kv = pair[i].split("=");
    if(key==kv[0]) return kv[1]
    //arg[kv[0]] = kv[1];
  }
  return (await getSetting()).default[key]
}

const language_promise = async function(){
  const language = (window.navigator.languages && window.navigator.languages[0]) ||
  window.navigator.language ||
  window.navigator.userLanguage ||
  window.navigator.browserLanguage;
  const languages = (await getSetting()).languages
  return (languages.indexOf(language) != -1)? language :"en"
}()

const dao_promise = async function () {
  const language = await language_promise
  const dbconf = (await getSetting()).database[language]
  console.log("dbconf",dbconf)
  return new Dao(dbconf.url,dbconf.tables,dbconf.prepares)
}()

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
        const type = getParam("type")
        $node.attr('data-q',data.name)
        $node.attr('data-type',type)
        $node.attr('data-domain',data.domain)
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
  const id = await getParam("q")
  const type = await getParam("type")
  pageGen(type, id);
});

// ページ移動 イベントをハンドリング
window.addEventListener('popstate', async (event) => {
  //移動先のパラメータで再描画
  const id = await getParam("q")
  const type = await getParam("type")
  pageGen(type, id);
});

//ページの描画処理
let pageGen = async function (table, id) {
  const dao = await dao_promise
  const language = await language_promise
  
  let getPageTemplate = async function (table) {
    if(!dao.tableExists(table)) throw new Error(table + ' TABLES not exist')
    //table単位でページテンプレートを読み込み
    if (!pageCache[table]) {
      const response = await (await fetch("./assets/" + table + "_" + language + ".tmp", { method: "get" })).text();
      pageCache[table] = Handlebars.compile(response);
    }
    return pageCache[table]
  }

  const data = await dao.getPageData(table, id)
  const template = await getPageTemplate(table)
  document.getElementById("content_body").innerHTML = template({ data: data })

  //リンクイベント作成
  const elementlinks = document.getElementsByClassName("elementlink")
  for (let i = 0; i < elementlinks.length; i++) {
    elementlinks[i].onclick = function (parentlink_element) {
      return (event) => {
        //ノードのID表示用のURLをhistoryに追加して、再描画
        const id = parentlink_element.dataset.id
        const type = parentlink_element.dataset.type
        window.history.pushState({}, document.title, `${window.location.origin}${window.location.pathname}?q=${id}&type=${type}`)
        pageGen(type, id);
      }
    } (elementlinks[i])
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
        $node.attr('data-domain',data.domain)
      }
    }).$chartContainer[0]
  return new Handlebars.SafeString(chartContainer.outerHTML)
});

Handlebars.registerHelper("breaklines", function(text) {
  text = Handlebars.Utils.escapeExpression(text);
  text = text.replace(/(\r\n|\n|\r)/gm, "<br />");
  return new Handlebars.SafeString(text);
});