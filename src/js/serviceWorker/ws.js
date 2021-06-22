import initSqlJs from "sql.js";
import Handlebars from "handlebars";

/* ===========================================================
 * docsify sw.js
 * ===========================================================
 * Copyright 2016 @huxpro
 * Licensed under Apache 2.0
 * Register service worker.
 * ========================================================== */

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

const RUNTIME = 'docsify'
const HOSTNAME_WHITELIST = [
  self.location.hostname,
  'fonts.gstatic.com',
  'fonts.googleapis.com',
  'cdn.jsdelivr.net'
]

// The Util Function to hack URLs of intercepted requests
const getFixedUrl = (req) => {
  var now = Date.now()
  var url = new URL(req.url)

  // 1. fixed http URL
  // Just keep syncing with location.protocol
  // fetch(httpURL) belongs to active mixed content.
  // And fetch(httpRequest) is not supported yet.
  url.protocol = self.location.protocol

  // 2. add query for caching-busting.
  // Github Pages served with Cache-Control: max-age=600
  // max-age on mutable content is error-prone, with SW life of bugs can even extend.
  // Until cache mode of Fetch API landed, we have to workaround cache-busting with query string.
  // Cache-Control-Bug: https://bugs.chromium.org/p/chromium/issues/detail?id=453190
  if (url.hostname === self.location.hostname) {
    url.search += (url.search ? '&' : '?') + 'cache-bust=' + now
  }
  return url.href
}

/**
 *  @Lifecycle Activate
 *  New one activated when old isnt being used.
 *
 *  waitUntil(): activating ====> activated
 */
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim())
})

/**
 *  @Functional Fetch
 *  All network requests are being intercepted here.
 *
 *  void respondWith(Promise<Response> r)
 */
self.addEventListener('fetch', event => {
  // Skip some of cross-origin requests, like those for Google Analytics.
  const url = new URL(event.request.url);
  if (HOSTNAME_WHITELIST.indexOf(url.hostname) > -1) {
    
    
    if(url.pathname=='/TAM.md'){
      //event.respondWith(response);
      event.respondWith(async function() {
        console.log(url)
        const id = getParam(url)["q"] || '3.2'
        const type = getParam(url)["type"] || '0'
        const content = await pageGen(type, id)
        const response = new Response(content)
        return response
      }());
    } else {
      // Stale-while-revalidate
      // similar to HTTP's stale-while-revalidate: https://www.mnot.net/blog/2007/12/12/stale
      // Upgrade from Jake's to Surma's: https://gist.github.com/surma/eb441223daaedf880801ad80006389f1
      const cached = caches.match(event.request)
      const fixedUrl = getFixedUrl(event.request)
      const fetched = fetch(fixedUrl, { cache: 'no-store' })
      const fetchedCopy = fetched.then(resp => resp.clone())
  
      // Call respondWith() with whatever we get first.
      // If the fetch fails (e.g disconnected), wait for the cache.
      // If there’s nothing in cache, wait for the fetch.
      // If neither yields a response, return offline pages.
      event.respondWith(
        Promise.race([fetched.catch(_ => cached), cached])
          .then(resp => resp || fetched)
          .catch(_ => { /* eat any errors */ })
      )
  
      // Update the cache with the version we fetched (only for ok status)
      event.waitUntil(
        Promise.all([fetchedCopy, caches.open(RUNTIME)])
          .then(([response, cache]) => response.ok && cache.put(event.request, response))
          .catch(_ => { /* eat any errors */ })
      )
    }

  }
})

//GETパラメータの取得
const getParam = function (url) {
  const _url = url || location
  const arg = new Object();
  const pair = _url.search.substring(1).split("&");
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
  const dataPromise = fetch("./assets/Frameworx_DB_Model_21.0.db").then(res => res.arrayBuffer());
  const [SQL, buf] = await Promise.all([sqlPromise, dataPromise])
  return new SQL.Database(new Uint8Array(buf));
}()


const TABLES = ['TAM', 'ETOM', 'ODA_Functional_Blocks']
const pageCache = {}

//ページの描画処理
let pageGen = async function (type, id) {
  const table = TABLES[type]
  let getPageTemplate = async function (table) {
    //table単位でページテンプレートを読み込み
    if (!pageCache[table]) {
      const response = await (await fetch("./assets/" + table + ".tmp", { method: "get" })).text();
      pageCache[table] = Handlebars.compile(response);
    }
    return pageCache[table]
  }
  const data = await getData(table, id)
  const template = await getPageTemplate(table)
  return await template({ data: data })
}


//ページのデータ取得
let getData = async function (table, id) {
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
    datascource.children = await getChildData(table, id) //紐づく子供の取得
    //datascource.relationData = {}
    //for (const relationTable of TABLES) {
    //  datascource.relationData[relationTable] = await getRelationData(relationTable,id)
    //}
    datascource.relationData = await getRelationData(table, id)
  }
  datascource.json = JSON.stringify(datascource)
  return datascource
}

//ページのに関連する子要素の取得
let getChildData = async function (table, id) {
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

//ページのに関連する子要素の取得
let getRelationData = async function (table, id) {
  const result = {}
  for (const relationTable of TABLES) {
    if (table == relationTable) continue
    const children = await getRelationChildData(table, id, relationTable)
    if (children.length > 0)
      result[relationTable] = children
  }
  return result
}

//ページのに関連する子要素の取得
let getRelationChildData = async function (fromtable, fromid, totable) {
  let db1 = await db
  // Prepare an sql statement
  const stmt = db1.prepare(`
  SELECT ID as name, NAME as title FROM ${totable} WHERE ID IN(
    SELECT TO_KEY as key FROM MAPPING WHERE TO_TABLE == $totable AND FROM_KEY == $id AND FROM_TABLE == $fromtable
    UNION
    SELECT FROM_KEY as key FROM MAPPING WHERE FROM_TABLE == $totable AND TO_KEY == $id AND TO_TABLE == $fromtable
    )
  `);

  // Bind values to the parameters and fetch the results of the query
  //const result = stmt.getAsObject({'$id' : id});
  // Bind new values
  stmt.bind({ $fromtable: fromtable, $id: fromid, $totable: totable });
  let children = [];
  while (stmt.step()) { //
    children.push(stmt.getAsObject())
  }
  return children
}