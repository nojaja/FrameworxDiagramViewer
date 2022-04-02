
import OrgChart from 'orgchart';
////npm install choices.js
//import 'choices.js/public/assets/styles/choices.css';
import 'orgchart/dist/css/jquery.orgchart.min.css'
import '../css/style.css'
import '@fortawesome/fontawesome-free/js/fontawesome';
import '@fortawesome/fontawesome-free/js/solid';
import '@fortawesome/fontawesome-free/js/regular';
import _Handlebars from "handlebars";
import promisedHandlebars from "promised-handlebars";
import Dao from "./dao.js";
import DefaultSetting from "../assets/default_setting.json";
//import * as Choices from 'choices.js'
        
const Handlebars = promisedHandlebars(require('handlebars'), { Promise: Promise })
const pageCache = {}
let filters = {}

/*
const filterItems = [
  { value: 'Market', label: 'Market Sales Domain', customProperties: {category:'domain'},selected:false},
  { value: 'Product', label: 'Product Domain', customProperties: {category:'domain'},selected:false},
  { value: 'Customer', label: 'Customer Domain', customProperties: {category:'domain'},selected:false},
  { value: 'Service', label: 'Service Domain', customProperties: {category:'domain'},selected:false},
  { value: 'Resource', label: 'Resource Domain', customProperties: {category:'domain'},selected:false},
  { value: 'Partner', label: 'Business Partner Domain', customProperties: {category:'domain'},selected:false},
  { value: 'Enterprise', label: 'Enterprise Domain', customProperties: {category:'domain'},selected:false},
  { value: 'Common', label: 'Common Domain', customProperties: {category:'domain'},selected:false},
  { value: 'Integration', label: 'Integration Domain', customProperties: {category:'domain'},selected:false},
  { value: 'Cross', label: 'Cross Domain', customProperties: {category:'domain'},selected:false},

  
  { value: 'Strategy', label: 'Strategy Management', customProperties: {category:'category'},selected:false},
  { value: 'Capability', label: 'Capability Delivery', customProperties: {category:'category'},selected:false},
  { value: 'Lifecycle', label: 'Lifecycle Management', customProperties: {category:'category'},selected:false},
  { value: 'Readiness', label: 'Operations Readiness & Support', customProperties: {category:'category'},selected:false},
  { value: 'Fulfillment', label: 'Fulfillment', customProperties: {category:'category'},selected:false},
  { value: 'Assurance', label: 'Assurance', customProperties: {category:'category'},selected:false},
  { value: 'Billing', label: 'Billing & Revenue Management', customProperties: {category:'category'},selected:false},
]
*/

//setting loader
let setting = null
const getSetting = async function () {
  if(!setting){
    await fetch("./setting.json", {
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
const getParam = function (key) {
  const arg = new Object();
  const pair = location.search.substring(1).split("&");
  for (let i = 0; pair[i]; i++) {
    let kv = pair[i].split("=");
    if(key==kv[0]) return decodeURI(kv[1])
    //arg[kv[0]] = kv[1];
  }
  return DefaultSetting.default[key]
}

const language = function(){
  const language = (window.navigator.languages && window.navigator.languages[0]) ||
  window.navigator.language ||
  window.navigator.userLanguage ||
  window.navigator.browserLanguage;
  const languages = DefaultSetting.languages
  console.log(languages)
  return (languages.indexOf(language) != -1)? language :"en"
}()

const dao_promise = async function () {
  const _setting = await getSetting()
  console.log("dao_promise_setting",_setting)
  const dbconf = _setting.database[language]
  console.log("dao_promise_dbconf",dbconf)
  return new Dao(dbconf.url,dbconf.tables,dbconf.prepares)
}()

let oc; //階層チャート
//let choices; //フィルタ選択

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

  /*
  const choiceselement = document.getElementById('task_member_ids');

  choices = new Choices(choiceselement,{
    delimiter: ',',
    removeItemButton: true,
    editItems: true,
    DuplicateItemsAllowed: false,
    shouldSort: false
  });

  choiceselement.addEventListener(
    'change',
    function(event) {
      const newFilters = {}
      const valueArray = choices.getValue()
      for (let index = 0; index < valueArray.length; index++) {
        const choiceValue = valueArray[index];
        const category = choiceValue.customProperties.category || 'default'
        if(!newFilters[category]) newFilters[category] = {};
        newFilters[category][choiceValue.value]=true
      }
      //Object.assign(filters, newFilters);
      filters = newFilters
      updateFilter()
    },
    false,
  );
  */
});

// ページの読み込み完了イベントのハンドリング
window.addEventListener('load', async (event) => {
  
  const footer = await (await fetch("./assets/footer_" + language + ".tmp", { method: "get" })).text();
  Handlebars.registerPartial('footer', footer);
  

  //初回表示時の描画
  const id = await getParam("q")
  const type = await getParam("type")
  const serialized_filter = await getParam("f")
  const addfilters = (serialized_filter)? JSON.parse(atob(serialized_filter)) : {}
  Object.assign(filters, addfilters);

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
let pageGen = async function (table, id, scroll) {
  const dao = await dao_promise
  const _setting = await getSetting()

  let getPageTemplate = async function (table) {
    //if(!dao.tableExists(table)) throw new Error(table + ' TABLES not exist')
    //table単位でページテンプレートを読み込み
    if (!pageCache[table]) {
      const tableName = (dao.getTableInfo(table))? dao.getTableInfo(table).tableName : table;
      const response = await (await fetch("./assets/" + tableName + "_" + language + ".tmp", { method: "get" })).text();
      pageCache[table] = Handlebars.compile(response);
    }
    return pageCache[table]
  }
  //表示ロジックの取得
  const logic = (dao.getTableInfo(table))? dao.getTableInfo(table).logic : "";
  const data = (logic == "getPageData")? await dao.getPageData(table, id) : {}

  /*filter処理*/
  console.log('data',data)
  console.log('data.relationData',data.relationData)
  console.log('filters',filters)

  /**
   * リストからの重複排除
   * dataList
   * keylist: ['key',,,]
   * override: (old,new) => {return true}
   */
  const unique_filter_logic = (dataList,keylist,override) => {
    // uniqueになるkey文字列作成
    const keyjoin = (data,keylist,delimiter) => {
      return keylist.reduce((resultArray, key, index) => {
        resultArray[index] = data[key] || ""
        return resultArray;
      }, []).join(delimiter)
    }
    const map = new Map()
    for (let index = 0; index < dataList.length; index++) {
      const currentData = dataList[index];
      const uniqueKey=keyjoin(currentData,keylist)
      if(map.has(uniqueKey)){//上書き
        if(override && override(map.get(uniqueKey),currentData)) map.set(uniqueKey,currentData)
      }else{
        map.set(uniqueKey,currentData)
      }
    }
    return Array.from(map.values())
  }

  const filter_logic = function (dataList){
    const result = dataList.filter(data => {
      for (const [filter_category, filter] of Object.entries(filters)) {
        let hit_count = 0
        let filters_count = 0
        for (const [filter_id, value] of Object.entries(filter)) {
          if(filter_category=="LEVEL"){
            if(data["table"]==filter_id.toLowerCase()){
              if(data[filter_category]!=value)return false;//filterに不一致
            }
          }else{
            if(value && data[filter_category]) {
              filters_count++;
              if(data[filter_category].indexOf(filter_id) > -1 )hit_count++;//filterに一致
            }
          }
        }
        if(filters_count > 0 && hit_count == 0 )return false //フィルタカテゴリ内で1つも一致しない場合は除外する
      }
      return true
    });
    return result
  }
  //data.relationDataに対してfilter_logicを適用
  for (const [dataset, record] of Object.entries(data.relationData)) {
    const recordtmp = unique_filter_logic(record.children,["title"],(oldrecord,newrecord)=>{return newrecord.basefromid==newrecord.fromid})
    data.relationData[dataset].children=filter_logic(recordtmp)
  }
  //data.childrenに対してfilter_logicを適用
  console.log('data.children',data.children)
  data.children=filter_logic(data.children)

  const template = await getPageTemplate(table)
  document.getElementById("content_body").innerHTML = await template({ data: data })
  //画面遷移したら上部に移動
  if(scroll != false){
    document.getElementById("content").scroll({
      top: 0,
      behavior: "instant"
    });
  }
  //リンクイベント作成
  const elementlinks = document.getElementsByClassName("elementlink")
  createDataset2ClickEvent(elementlinks)

  //組織図のクリックイベント作成
  const node_elements = document.getElementsByClassName("node")
  createDataset2ClickEvent(node_elements)
  
  //SVGリンクイベント作成
  const atags = document.querySelectorAll("svg a")
  createSVGATag2ClickEvent(atags)

  console.log("pageGen filters",filters)
  createSelectStepper("selectstepper", (target,value) => {
    console.log("selectstepper onchange",target.category,target.name,value)
    setFilter(target.category,target.name,value)
    updateFilter()
  }).setValues(filters)

  createFilter("filter-list", (target,value) => {
    console.log("filter onchange",target.category,target.name,value)
    setFilter(target.category,target.name,value)
    updateFilter()
  }).setValues(filters)
}

function createSelectStepper(classname, onChange){
  
  const stepper = {
    classname:classname,
    elements:document.getElementsByClassName(classname),
    datas:{}
  }
  
  const stepper_elements = stepper.elements
  for (let i = 0; i < stepper_elements.length; i++) {
    
    
    const stepper_element = stepper_elements[i]
    const stepper_category = stepper_element.dataset.category
    const stepper_datas = stepper.datas[stepper_category]?
          stepper.datas[stepper_category]:stepper.datas[stepper_category]={element:{}}
    
    const select_element = stepper_element.querySelector("select")
    const stepper_name = select_element.name || select_element.id
    stepper_datas.element[stepper_name]=select_element
    stepper_datas[stepper_name]=select_element.value
    
      select_element.previousElementSibling.onclick = function (node_element) {
        const min = 0
        const max = select_element.length
        const value = select_element.selectedIndex
        if (value > min) {
          select_element.value = select_element.item(select_element.selectedIndex-1).value 
          if(onChange)onChange({category:stepper_category,name:stepper_name,element:select_element},select_element.value,value)
          stepper_datas[stepper_name]=select_element.value
        }
      }// Down
      select_element.nextElementSibling.onclick = function (node_element) { 
          const max = select_element.length-1
          const value = select_element.selectedIndex
          if (value < max) {
          select_element.value = select_element.item(select_element.selectedIndex+1).value
          if(onChange)onChange({category:stepper_category,name:stepper_name,element:select_element},select_element.value,value)
          stepper_datas[stepper_name]=select_element.value
          }
        }// Up
  }

  stepper.getAllValue = function(){
    return stepper.datas
  }
  stepper.getCategoryValue = function(category){
    return stepper.getAllValue()[category]
  }
  stepper.getValue = function(category,name){
    return stepper.getCategoryValue(category)[name]
  }
  //状態を更新
  stepper.setValueByCategory = function(category,name,status){
    if(!stepper.datas[category])return false
    stepper.datas[category][name]=status
    const select_element = stepper.datas[category].element[name]
    if(select_element)select_element.value=status
  }
    
  stepper.setValuesByCategory = function(category,statusList){
    for (const [name, status] of Object.entries(statusList)) {
      stepper.setValueByCategory(category, name, status)
    }
  }

  stepper.setValues = function(datas){
    for (const [category, statusList] of Object.entries(datas)) {
      stepper.setValuesByCategory(category, statusList)
    }
  }
  return stepper
}

function createFilter(classname, onChange){
  const filter = {
    classname:classname,
    elements:document.getElementsByClassName(classname),
    datas:{}
  }
  const filter_elements = filter.elements
  for (let i = 0; i < filter_elements.length; i++) {
    const filter_element = filter_elements[i]
    const filter_category = filter_element.dataset.category
    const filter_datas = filter.datas[filter_category]?
          filter.datas[filter_category]:filter.datas[filter_category]={}
    filter_datas.elements = filter_element.getElementsByTagName("input")
    const input_elements = filter_datas.elements
    for (let j = 0; j < input_elements.length; j++) {
      const input_element = input_elements[j]
      filter_datas[input_element.name]=input_element.checked
      input_element.onclick = function (event) {
        filter_datas[input_element.name]=input_element.checked
        if(onChange)onChange({category:filter_category,name:input_element.name,element:input_element},(input_element.checked==true),!(input_element.checked==true))
    }
   }
 }

  filter.getAllValue = function(){
    return filter.datas
  }
  filter.getCategoryValue = function(category){
    return filter.getAllValue()[category]
  }
  filter.getValue = function(category,name){
    return filter.getCategoryValue(category)[name]
  }
  //状態を更新
  filter.setValueByCategory = function(category,name,status){
    if(!filter.datas[category])return false
    filter.datas[category][name]=status
    const input_elements = filter.datas[category].elements
    for (let i = 0; i < input_elements.length; i++) {
      if(input_elements[i].name==name)input_elements[i].checked = status
    }
  }
    
  filter.setValuesByCategory = function(category,statusList){
    for (const [name, status] of Object.entries(statusList)) {
      filter.setValueByCategory(category, name, status)
    }
  }

  filter.setValues = function(datas){
    for (const [category, statusList] of Object.entries(datas)) {
      filter.setValuesByCategory(category, statusList)
    }
  }
  return filter
}

function createSVGATag2ClickEvent(elements){
  for (let i = 0; i < elements.length; i++) {
    elements[i].onclick = function (node_element) {
      return (event) => {
        //ノードのID表示用のURLをhistoryに追加して、再描画
        const url = new URL(node_element.href.baseVal,window.location)
        let param = new Object;
        let pair=url.search.substring(1).split('&');
        for(let i=0;pair[i];i++) {
            let kv = pair[i].split('=');
            param[kv[0]]=kv[1];
        }

        const id = param['q']
        const type = param['type']

        window.history.pushState({}, document.title, `${window.location.origin}${window.location.pathname}?q=${id}&type=${type}`)
        pageGen(type, id);
        return false
      }
    } (elements[i])
  }
}
function createDataset2ClickEvent(elements){
  for (let i = 0; i < elements.length; i++) {
    elements[i].onclick = function (node_element) {
      return (event) => {
        //ノードのID表示用のURLをhistoryに追加して、再描画
        const id = node_element.dataset.id
        const type = node_element.dataset.type
        window.history.pushState({}, document.title, `${window.location.origin}${window.location.pathname}?q=${id}&type=${type}`)
        pageGen(type, id);
        return  false
      }
    } (elements[i])
  }
}

//ノードのID表示用のURLをhistoryに追加して、再描画
async function setFilter (filter_category,filter_id,status){
  //delete出来るようにMapにする
  const filter = new Map(Object.entries(filters[filter_category]||{}));
  if(status){
    filter.set(filter_id,status)
  }else{
    filter.delete(filter_id)
  }
  //serialize出来るようにobjectにする
  filters[filter_category] = [...filter].reduce((l,[k,v]) => Object.assign(l, {[k]:v}), {})
  console.log("setFilter",filters)
  const serialized_filter = btoa(JSON.stringify(filters));    
  const id = await getParam("q")
  const type = await getParam("type")
  window.history.replaceState({}, document.title, `${window.location.origin}${window.location.pathname}?q=${id}&type=${type}&f=${serialized_filter}`)

  return  true
}

//フィルタ設定のURLをhistoryに追加して、再描画
async function updateFilter (){
    const serialized_filter = btoa(JSON.stringify(filters));    
    const id = await getParam("q")
    const type = await getParam("type")

    window.history.replaceState({}, document.title, `${window.location.origin}${window.location.pathname}?q=${id}&type=${type}&f=${serialized_filter}`)
    pageGen(type, id, false);

    return  true
}

//tree表示する
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

// 改行をBRに変換する
Handlebars.registerHelper("breaklines", function(text) {
  text = Handlebars.Utils.escapeExpression(text);
  text = text.replace(/(\r\n|\n|\r)/gm, "<br />");
  return new Handlebars.SafeString(text);
});

//SVGファイルを埋め込み表示する
Handlebars.registerHelper("svg", async function(svgfilepath) {
  svgfilepath = Handlebars.Utils.escapeExpression(svgfilepath);
  if(svgfilepath.lastIndexOf('.svg')==-1)svgfilepath=svgfilepath+'.svg';
  const response = await (await fetch("./assets/" + svgfilepath, { method: "get" })).text();
  return new Handlebars.SafeString(response);
});

//bpmnsvgファイルを埋め込み表示する、editorへのリンクを作成する
Handlebars.registerHelper("bpmnsvg", async function(svgfilepath) {
  const _setting = await getSetting()
  svgfilepath = Handlebars.Utils.escapeExpression(svgfilepath);
  if(svgfilepath.lastIndexOf('.bpmn.svg')==-1)svgfilepath=svgfilepath+'.bpmn.svg';

  const api_call = await fetch("./assets/" + svgfilepath, { method: "get" });
  const response = (api_call.status !== 200)? 'no image': await api_call.text() 
    + "<br /><a href='"+_setting.default['bpmn-modeler-url']+window.location.href.split('?')[0]+"assets/"+svgfilepath+"' target='_blank'>open BPMN-Modeler</a>"
  //const response = await (await fetch("./assets/" + svgfilepath, { method: "get" })).text();
  return new Handlebars.SafeString(response);
});

Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

//settingのpreparesに定義されたクエリを実行する
Handlebars.registerHelper("sql", async function(querName,parameters, options) {
  const id = await getParam("q")
  const type = await getParam("type")

  const dao = await dao_promise
  const _parameters = parameters || {}
  _parameters['$id'] = id
  _parameters['$type'] = type
  return await dao.getResult(querName,_parameters,options.fn)
});

Handlebars.registerHelper('log', function(arg1, arg2, options) {
  console.log(arg1, arg2, options);
  return
});


