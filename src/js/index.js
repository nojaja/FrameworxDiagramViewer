
import OrgChart from 'orgchart';
import 'orgchart/dist/css/jquery.orgchart.min.css'
import '../css/style.css'
import '@fortawesome/fontawesome-free/js/fontawesome';
import '@fortawesome/fontawesome-free/js/solid';
import '@fortawesome/fontawesome-free/js/regular';
import CustomHandlebarsFactory from "./custom-handlebars-factory.js";
import Dao from "./dao.js";
import DefaultSetting from "../assets/default_setting.json";
import SelectStepper from "./select-stepper.js";
import SelectCheckbox from "./select-checkbox.js";
import Filter from "./filter.js";

const Handlebars = CustomHandlebarsFactory.getInstance()
const filter = new Filter();
let pagedata = {}
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
  if (!setting) {
    await fetch("./setting.json", {
      method: "get"
    }).then(async (response) => {
      if (response.status === 200) {
        //console.log(response); // => "OK"
        setting = await response.json()
        //console.log(setting)
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

//GET????????????????????????
const getParam = function (key) {
  const arg = new Object();
  const pair = location.search.substring(1).split("&");
  for (let i = 0; pair[i]; i++) {
    let kv = pair[i].split("=");
    if (key == kv[0]) return decodeURI(kv[1])
    //arg[kv[0]] = kv[1];
  }
  return DefaultSetting.default[key]
}

const language = function () {
  const language = (window.navigator.languages && window.navigator.languages[0]) ||
    window.navigator.language ||
    window.navigator.userLanguage ||
    window.navigator.browserLanguage;
  const languages = DefaultSetting.languages
  console.log(languages)
  return (languages.indexOf(language) != -1) ? language : "en"
}()

const dao_promise = async function () {
  const _setting = await getSetting()
  //console.log("dao_promise_setting",_setting)
  const dbconf = _setting.database[language]
  //console.log("dao_promise_dbconf",dbconf)
  return new Dao(dbconf.url, dbconf.tables, dbconf.prepares)
}()

let oc; //??????????????????

//View///////////////////////////////////////////////////
//???????????????????????????????????????????????????????????????
document.addEventListener('DOMContentLoaded', function () {
  //?????????????????????????????????
  oc = $('#chart-container').orgchart({
    'data': {},
    //'depth': 2,
    //'toggleSiblingsResp': false,
    'nodeContent': 'title',
    'parentNodeSymbol': '',
    'createNode': function ($node, data) {
      //????????????????????????????????????????????????????????????
      $node.on('click', function () {
        //????????????ID????????????URL???history???????????????????????????
        const type = getParam("type")
        $node.attr('data-q', data.name)
        $node.attr('data-type', type)
        $node.attr('data-domain', data.domain)
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

// ???????????????????????????????????????????????????????????????
window.addEventListener('load', async (event) => {
  const footer = await (await fetch("./assets/footer_" + language + ".tmp", { method: "get" })).text();
  Handlebars.registerPartial('footer', footer);

  //????????????????????????
  const id = await getParam("q")
  const type = await getParam("type")
  const serialized_filter = await getParam("f")
  const addfilters = (serialized_filter) ? JSON.parse(atob(serialized_filter)) : {}
  filter.setFilters(addfilters);

  pageGen(type, id);
});

// ??????????????? ?????????????????????????????????
window.addEventListener('popstate', async (event) => {
  //???????????????????????????????????????
  const id = await getParam("q")
  const type = await getParam("type")
  pageGen(type, id);
});

//????????????????????????
let pageGen = async function (table, id, scroll) {
  const dao = await dao_promise
  const _setting = await getSetting()

  //???????????????????????????
  const logic = (dao.getTableInfo(table)) ? dao.getTableInfo(table).logic : "";
  //????????????????????????
  const data = (logic == "getPageData") ? await dao.getPageData(table, id) : {}

  /*filter??????*/
  console.log('data', data)
  console.log('data.relationData', data.relationData)
  console.log('data.children', data.children)
  console.log('filters', filter.getFilters())

  //data.relationData????????????filter_logic?????????
  for (const [dataset, record] of Object.entries(data.relationData)) {
    const recordtmp = filter.unique_filter_logic(record.children, ["title"], (oldrecord, newrecord) => { return newrecord.basefromid == newrecord.fromid /*basefromid??????????????????????????????*/ })
    data.relationData[dataset].children = filter.filter_logic(recordtmp)
  }
  //data.children????????????filter_logic?????????
  data.children_org = data.children
  data.children = filter.filter_logic2(data.children)
  pagedata = data;

  const tableName = (dao.getTableInfo(table)) ? dao.getTableInfo(table).tableName : table;
  const url = "./assets/" + tableName + "_" + language + ".tmp";
  const template = await Handlebars.getPageTemplate(url)
  document.getElementById("content_body").innerHTML = await template({ data: data })
  //????????????????????????????????????
  if (scroll != false) {
    document.getElementById("content").scroll({
      top: 0,
      behavior: "instant"
    });
  }
  //???????????????????????????
  const elementlinks = document.getElementsByClassName("elementlink")
  createDataset2ClickEvent(elementlinks)

  //??????????????????????????????????????????
  const node_elements = document.getElementsByClassName("node")
  createDataset2ClickEvent(node_elements)

  //SVG???????????????????????????
  const atags = document.querySelectorAll("svg a")
  createSVGATag2ClickEvent(atags)

  const selectStepper = new SelectStepper("selectstepper", (target, value) => {
    filter.setFilter(target.category, target.name, value)
    updateFilter()
  })
  selectStepper.setValues(filter.getFilters())

  const selectCheckbox = new SelectCheckbox("filter-list", (target, value) => {
    filter.setFilter(target.category, target.name, value)
    updateFilter()
  })
  selectCheckbox.setValues(filter.getFilters())
}

//SVG???????????????????????????
function createSVGATag2ClickEvent(elements) {
  for (let i = 0; i < elements.length; i++) {
    elements[i].onclick = function (node_element) {
      return (event) => {
        //????????????ID????????????URL???history???????????????????????????
        const url = new URL(node_element.href.baseVal, window.location)
        let param = new Object;
        let pair = url.search.substring(1).split('&');
        for (let i = 0; pair[i]; i++) {
          let kv = pair[i].split('=');
          param[kv[0]] = kv[1];
        }

        const id = param['q']
        const type = param['type']

        window.history.pushState({}, document.title, `${window.location.origin}${window.location.pathname}?q=${id}&type=${type}`)
        pageGen(type, id);
        return false
      }
    }(elements[i])
  }
}

//???????????????????????????
function createDataset2ClickEvent(elements) {
  for (let i = 0; i < elements.length; i++) {
    elements[i].onclick = function (node_element) {
      return (event) => {
        //????????????ID????????????URL???history???????????????????????????
        const id = node_element.dataset.id
        const type = node_element.dataset.type
        window.history.pushState({}, document.title, `${window.location.origin}${window.location.pathname}?q=${id}&type=${type}`)
        pageGen(type, id);
        return false
      }
    }(elements[i])
  }
}

//?????????????????????URL???history???????????????????????????
async function updateFilter() {
  const serialized_filter = filter.getSerializedFiltersString()
  const id = await getParam("q")
  const type = await getParam("type")

  window.history.replaceState({}, document.title, `${window.location.origin}${window.location.pathname}?q=${id}&type=${type}&f=${serialized_filter}`)
  //pageGen(type, id, false);

  const updatelist = []
  //data.relationData????????????filter_logic?????????
  for (const [dataset, record] of Object.entries(pagedata.relationData)) {
    const recordtmp = filter.unique_filter_logic(record.children, ["title"], (oldrecord, newrecord) => { return newrecord.basefromid == newrecord.fromid /*basefromid??????????????????????????????*/ })
    Array.prototype.push.apply(updatelist, filter.filter_logic(recordtmp))
  }

  for (let j = 0; j < updatelist.length; j++) {
    const element = document.getElementById(updatelist[j].hash)
    if(element==null)continue
    if (updatelist[j].hidden) {
      element.classList.add("hidden");
    } else {
      element.classList.remove("hidden");
    }
    element.hidden = updatelist[j].hidden
  }
  
  //pagedata.relationData????????????filter_logic?????????
  for (const [dataset, record] of Object.entries(pagedata.relationData)) {
    const recordtmp = filter.unique_filter_logic(record.children, ["title"], (oldrecord, newrecord) => { return newrecord.basefromid == newrecord.fromid /*basefromid??????????????????????????????*/ })
    pagedata.relationData[dataset].children = filter.filter_logic(recordtmp)
  }
  //data.children????????????filter_logic?????????
  pagedata.children = filter.filter_logic2(pagedata.children_org)

  const element = document.getElementById('chart-container')
  updateOc(element,pagedata)

  
  //??????????????????????????????????????????
  const node_elements = document.getElementsByClassName("node")
  createDataset2ClickEvent(node_elements)

  return true
}


function updateOc(targetElement,datas) {
  const chartContainer = oc.init({
    'data': datas,
    'createNode': function ($node, data) {
      $node.attr('data-id', data.name)
      $node.attr('data-type', data.table)
      $node.attr('data-domain', data.domain)
    }
  }).$chartContainer[0]
  targetElement.outerHTML = chartContainer.outerHTML
}

//tree????????????
Handlebars.registerHelper("oc", function (context, options) {
  const chartContainer = oc.init({
    'data': context,
    'createNode': function ($node, data) {
      $node.attr('data-id', data.name)
      $node.attr('data-type', data.table)
      $node.attr('data-domain', data.domain)
    }
  }).$chartContainer[0]
  return new Handlebars.SafeString(chartContainer.outerHTML)
});


//SVG???????????????????????????????????????
Handlebars.registerHelper("svg", async function (svgfilepath) {
  svgfilepath = Handlebars.Utils.escapeExpression(svgfilepath);
  if (svgfilepath.lastIndexOf('.svg') == -1) svgfilepath = svgfilepath + '.svg';
  const response = await (await fetch("./assets/" + svgfilepath, { method: "get" })).text();
  return new Handlebars.SafeString(response);
});

//bpmnsvg??????????????????????????????????????????editor??????????????????????????????
Handlebars.registerHelper("bpmnsvg", async function (svgfilepath) {
  const _setting = await getSetting()
  svgfilepath = Handlebars.Utils.escapeExpression(svgfilepath);
  if (svgfilepath.lastIndexOf('.bpmn.svg') == -1) svgfilepath = svgfilepath + '.bpmn.svg';

  const api_call = await fetch("./assets/" + svgfilepath, { method: "get" });
  const response = (api_call.status !== 200) ? 'no image' : await api_call.text()
    + "<br /><a href='" + _setting.default['bpmn-modeler-url'] + window.location.href.split('?')[0] + "assets/" + svgfilepath + "' target='_blank'>open BPMN-Modeler</a>"
  //const response = await (await fetch("./assets/" + svgfilepath, { method: "get" })).text();
  return new Handlebars.SafeString(response);
});

//setting???prepares??????????????????????????????????????????
Handlebars.registerHelper("sql", async function (querName, parameters, options) {
  const id = await getParam("q")
  const type = await getParam("type")

  const dao = await dao_promise
  const _parameters = parameters || {}
  _parameters['$id'] = id
  _parameters['$type'] = type
  return await dao.getResult(querName, _parameters, options.fn)
});


