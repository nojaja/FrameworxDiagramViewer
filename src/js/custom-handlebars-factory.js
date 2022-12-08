
import _Handlebars from "handlebars";
import promisedHandlebars from "promised-handlebars";
import md from 'markdown-it';

const mdInstance = md({
    html: true,
    breaks: false,
    linkify: true,
    typography: true
  })

export class CustomHandlebarsFactory {
    constructor() {
    }
    static getInstance() {
        const Handlebars = promisedHandlebars(require('handlebars'), { Promise: Promise })
        // 改行をBRに変換する
        Handlebars.registerHelper("breaklines", function (text) {
            const ret_text = Handlebars.Utils.escapeExpression(text);
            const ret = ret_text.replace(/(\r\n|\n|\r)/gm, "<br />");
            return new Handlebars.SafeString(ret);
        });
        // コンテンツをmdとしてレンダリングする
        Handlebars.registerHelper("md", function (text) {
            const ret_text = mdInstance.render(text.trim())
            return new Handlebars.SafeString(ret_text);
        });

        /**
         * 
         * ex.{{#ifEquals this.source "consideration"}}
         */
        Handlebars.registerHelper('ifEquals', function (arg1, arg2, options) {
            return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
        });
        Handlebars.registerHelper('log', function (arg1, arg2, options) {
            console.log(arg1, arg2, options);
            return
        });

        Handlebars.pageCache = {}
        Handlebars.getPageTemplate = async (URL) => {
            return await CustomHandlebarsFactory.getPageTemplate(Handlebars, URL)
        }
        Handlebars.registerPartialURL = async (PartialName, URL) => {
            return await CustomHandlebarsFactory.registerPartial(Handlebars, PartialName, URL)
        }

        return Handlebars
    }

    static async getPageTemplate(HandlebarsInstance, URL) {
        //if(!dao.tableExists(table)) throw new Error(table + ' TABLES not exist')
        //table単位でページテンプレートを読み込み
        if (!HandlebarsInstance.pageCache[URL]) {
            const response = await (await fetch(URL, { method: "get" })).text();
            HandlebarsInstance.pageCache[URL] = HandlebarsInstance.compile(response);
        }
        return HandlebarsInstance.pageCache[URL]
    }

    static async registerPartial(HandlebarsInstance, PartialName, URL) {
        const response = await (await fetch(URL, { method: "get" })).text();
        HandlebarsInstance.registerPartial(PartialName, response);
    }
}

export default CustomHandlebarsFactory