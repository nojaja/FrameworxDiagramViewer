import Handlebars from "handlebars";
import zlib from "zlib";

export class Site {
    constructor(pages) {
        this.pages = pages || ['TAM', 'eTOM', 'ODA_Functional_Blocks', 'End_to_End_Business_Flows', 'Open_APIs', 'Legacy_Systems']
        console.log("Site constructor", pages)
    }

    //有効期限が最大1日になるようなクエリ文字列生成
    cacheExpire() {
        return Math.round(Date.now() / 100000000).toString()
    }


    pageExists(pagename) {
        if (this.pages[pagename.toLowerCase()]) return true
        return false
    }
    getPageInfo(pagename) {
        return (this.pages[pagename.toLowerCase()])
    }


}

export default Site