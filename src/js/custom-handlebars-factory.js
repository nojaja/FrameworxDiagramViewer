
import _Handlebars from "handlebars";
import promisedHandlebars from "promised-handlebars";

export class CustomHandlebarsFactory {
    constructor() {
    }
    static getInstance() {
        const Handlebars = promisedHandlebars(require('handlebars'), { Promise: Promise })
        // 改行をBRに変換する
        Handlebars.registerHelper("breaklines", function (text) {
            text = Handlebars.Utils.escapeExpression(text);
            text = text.replace(/(\r\n|\n|\r)/gm, "<br />");
            return new Handlebars.SafeString(text);
        });

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
}

export default CustomHandlebarsFactory