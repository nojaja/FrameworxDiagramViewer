
import OrgChart from 'orgchart';
import 'orgchart/dist/css/jquery.orgchart.min.css'
import '../css/style.css'
import initSqlJs from "sql.js";

/**
 * GB929F_Functional_Framework_Functional_Decomposition_v21.0.0.xlsx
 * GB921_Business_Process_Framework_Processes_v21.0.0.xlsx
 * https://docs.google.com/spreadsheets/d/1P4WQxQnO-gbPkVZ2d85T9I0dClw9Lm3rQ_cvSmyYz88/edit#gid=0
 * 
 * DDL：
 * CREATE TABLE TAM (ID PRIMARY KEY, LEVEL integer, PARENT , NAME , TYPE , ORIGINAL_ID , DESCRIPTION , FUNCTION , BRIEF_DESCRIPTION , DOMAIN , CATEGORY , MATURITY_LEVEL , FRAMEWORX_STATUS );
 * CREATE TABLE ETOM (ID PRIMARY KEY, LEVEL integer, PARENT , NAME , TYPE , ORIGINAL_ID , DESCRIPTION , FUNCTION , BRIEF_DESCRIPTION , DOMAIN , CATEGORY , MATURITY_LEVEL , FRAMEWORX_STATUS );
 * 
 * FRAMEWORX_STATUS INT from "Frameworx Status" val => "Released":1 other:2
 * ID TEXT from "Application Identifier" 
 * DOMAIN from "Application Identifier" level1 val => "3.2": 3
 * PARENT from  "Application Identifier" level1 val => "3.2.1": "3.2"
 * 
 * DML sample:
 * INSERT INTO ETOM VALUES ('1.1.1','2','1.1','Market Strategy & Policy','(2) eTOM Process Type','1.2.1.1','Market Strategy & Policy processes enable the development of a strategic view of an enterprise’s existing and desired market-place, activities and aims. Market segmentation and analysis is performed, to determine an enterprise’s target and addressable markets, along with the development of marketing strategies for each market segment or set of target customers. The decision is made as to which markets the enterprise wants or needs to be in, and how it plans to enter or grow in these markets and market segments. This will be achieved through multiple inputs: including Enterprise Strategies, Market Research, Market Analysis.','null','Enable the development of a strategic view of an enterprise’s existing and desired market-place','Market Sales Domain','Strategy Management','4','Released');
 * INSERT INTO TAM VALUES ('3.2','1','3','Sales Aids','(1) TAM Application Type','null','The Sales Aids Application provides access to methods and procedures as well as product information and other collateral that can be used to assist in making a sale.','','null','Market Sales Domain','null','4','1');
 */

//SQLiteの設定
const config = {
  // Required to load the wasm binary asynchronously. Of course, you can host it wherever you want
  // You can omit locateFile completely when running in node
  //locateFile: file => `https://sql.js.org/dist/${file}`
  //locateFile: filename => `/dist/${filename}`
  locateFile: file => './sql-wasm.wasm'
}

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

//SQLiteの読み込み
// return {Promise} db
// ex. await db
const db = async function () {
  const sqlPromise = initSqlJs(config);
  const dataPromise = fetch("/assets/Frameworx_DB_Model_21.0.db").then(res => res.arrayBuffer());
  const [SQL, buf] = await Promise.all([sqlPromise, dataPromise])
  return new SQL.Database(new Uint8Array(buf));
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
    'createNode': function($node, data) {
      //各ノードのクリックイベントのハンドリング
      $node.on('click', function() {
        //ノードのID表示用のURLをhistoryに追加して、再描画
        const type = getParam()["type"] || '0'
        window.history.pushState( {}, document.title, `${window.location.origin}${window.location.pathname}?q=${data.name}&type=${type}`)
        pageGen(type,data.name);
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
  pageGen(type,id);
});

// ページ移動 イベントをハンドリング
window.addEventListener('popstate', (event) => {
  //移動先のパラメータで再描画
  const id = getParam()["q"] || '3.2'
  const type = getParam()["type"] || '0'
  pageGen(type,id);
});

//ページの描画処理
let pageGen = async function (type,id) {
  const table = ['TAM','ETOM'][type]
  const data = await getData(table,id)
  document.getElementById("name").innerText = data.name+' '+data.title
  document.getElementById("category").innerText = `Category: ${data.category}`
  document.getElementById("maturity_level").innerText = `Maturity Level: ${data.maturity}`
  document.getElementById("parent").innerHTML = `Parent : <a id="parentlink" data-id="${data.parent}" >${data.parent}</a>`
  document.getElementById("parentlink").onclick = (event) => {
    //ノードのID表示用のURLをhistoryに追加して、再描画
    const id = event.target.attributes['data-id'].nodeValue
    window.history.pushState( {}, document.title, `${window.location.origin}${window.location.pathname}?q=${id}&type=${type}`)
    pageGen(type,id);
  }
  document.getElementById("description").innerText = data.overview
  document.getElementById("functionality").innerText = data.functionality
  oc.init({ 'data': data });
}

//ページのデータ取得
let getData = async function (table,id) {
  let db1 = await db
  // Prepare an sql statement
  const stmt = db1.prepare(`SELECT ID as name, NAME as title, DESCRIPTION as overview, MATURITY_LEVEL as maturity, FUNCTION as functionality, PARENT as parent, TYPE as category FROM ${table} WHERE ID=$id`);

  // Bind values to the parameters and fetch the results of the query
  //const result = stmt.getAsObject({'$id' : id});
  // Bind new values
  stmt.bind({ $id: id });
  let datascource = {}
  if (stmt.step()) { //primary keyで検索するので結果行は1:0
    datascource = stmt.getAsObject();
    datascource.children = await getChildData(table,id) //紐づく子供の取得
  }
  return datascource
}

//ページのに関連する子要素の取得
let getChildData = async function (table,id) {
  let db1 = await db
  // Prepare an sql statement
  const stmt = db1.prepare(`SELECT ID as name, NAME as title FROM ${table} WHERE PARENT=$id`);

  // Bind values to the parameters and fetch the results of the query
  //const result = stmt.getAsObject({'$id' : id});
  // Bind new values
  stmt.bind({ $id: id });
  let children = [];
  while (stmt.step()) { //
    children.push(stmt.getAsObject())
  }
  return children
}
