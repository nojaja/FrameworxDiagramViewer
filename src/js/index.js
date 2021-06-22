
import '../../node_modules/docsify/themes/vue.css';
import '../css/h-style.css';

import 'orgchart/dist/css/jquery.orgchart.min.css';
import '../css/style.css';

import docsify from 'docsify/lib/docsify.min.js';
import OrgChart from 'orgchart';

let oc; //階層チャート

//View///////////////////////////////////////////////////
//コンテンツロード完了イベントのハンドリング
document.addEventListener('DOMContentLoaded', function () {
  //階層チャートの初回描画
  //oc = $('#chart-container').orgchart({
  oc = $('<div id="chart-container"></div>').orgchart({  
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

window.$docsify = {
  name: '',
  repo: '',
  executeScript: true,
  plugins: [
    function(hook) {
      console.log('markdown-plugins',hook)
      hook.init(function() {
        console.log('markdown-init')
      });
      hook.beforeEach(function(html) {
        console.log('markdown-afterEach',html)
      });
    }
  ],
  markdown: {
    renderer: {
      code: function(code, lang) {
        console.log('code',code, lang)
        if (lang === "orgchart") {
          const ele = oc.init({ 'data': JSON.parse(code)}).$chartContainer[0]
          return ( '<div id="chart-container">'+ele.innerHTML +'</div>'
          );
        }
        return this.origin.code.apply(this, arguments);
      }
    }
  }
}

