
import initSqlJs from "sql.js";
import Handlebars from "handlebars";

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


export class Dao {
    constructor(datafile_url,tables,prepares) {
        //SQLiteの設定
        this.config = {
            // Required to load the wasm binary asynchronously. Of course, you can host it wherever you want
            // You can omit locateFile completely when running in node
            //locateFile: file => `https://sql.js.org/dist/${file}`
            //locateFile: filename => `/dist/${filename}`
            locateFile: file => './sql-wasm.wasm'
        }
        this.datafile_url = datafile_url || "./assets/Frameworx_DB_Model_21.0.db"
        this.tables = tables || ['TAM', 'eTOM', 'ODA_Functional_Blocks', 'End_to_End_Business_Flows', 'Open_APIs', 'Legacy_Systems']
        this.prepares = prepares
        console.log("Dao constructor",datafile_url,tables,prepares)
        this.preparesTemplate = {}
        for (const querName in this.prepares) {
          console.log('querName:' + querName + ' :' + this.prepares[querName]);
          this.preparesTemplate[querName] = Handlebars.compile(this.prepares[querName]);
        }
    }

    //SQLiteの読み込み
    // return {Promise} db
    // ex. await database
    async database () {
        const sqlPromise = initSqlJs(this.config);
        const dataPromise = fetch(this.datafile_url).then(res => res.arrayBuffer());
        const [SQL, buf] = await Promise.all([sqlPromise, dataPromise])
        return new SQL.Database(new Uint8Array(buf));
    }
    
    tableExists (table){
        if(this.tables[table.toLowerCase()]) return true
        return false
    }
    getTableInfo (table){
        return (this.tables[table.toLowerCase()]) 
    }

    //ページのデータ取得
    async getPageData (table, id) {
        if(!this.tableExists(table)) throw new Error(this.getTableInfo(table).tableName + ' TABLES not exist')
        this.db = this.db || await this.database()
        try {
            // Prepare an sql statement
            const stmt = this.db.prepare(this.preparesTemplate.PageData({ table: this.getTableInfo(table).tableName }));

            // Bind values to the parameters and fetch the results of the query
            //const result = stmt.getAsObject({'$id' : id});
            // Bind new values
            stmt.bind({ $id: id });
            let datascource = {}
            if (stmt.step()) { //primary keyで検索するので結果行は1:0
                datascource = stmt.getAsObject();
                datascource.table = table
                datascource.children = await this.getChildData(table, id) //紐づく子供の取得
                datascource.relationData = await this.getRelationData(table, id)
            }
            return datascource
        } catch (error) {
            console.error("getPageData",this.preparesTemplate.PageData({ table: this.getTableInfo(table).tableName}),error)
        }
    }

    //ページのに関連する子要素の取得
    async getChildData (table, id) {
        if(!this.tableExists(table)) throw new Error(this.getTableInfo(table).tableName + ' TABLES not exist')
        this.db = this.db || await this.database()
        
        try {
            // Prepare an sql statement
            const stmt = this.db.prepare(this.preparesTemplate.ChildData({ table: this.getTableInfo(table).tableName }))

            // Bind values to the parameters and fetch the results of the query
            //const result = stmt.getAsObject({'$id' : id});
            // Bind new values
            stmt.bind({ $id: id });
            let children = [];
            while (stmt.step()) { //
                const ret = stmt.getAsObject()
                ret.table = table
                children.push(ret)
            }
            return children
        } catch (error) {
            console.error("getChildData",this.preparesTemplate.ChildData({ table: this.getTableInfo(table).tableName}),error)
        }
    }

    //ページのに関連する子要素の取得
    async getRelationData (table, id) {
        if(!this.tableExists(table)) throw new Error(this.getTableInfo(table).tableName + ' TABLES not exist')
        const result = {}
        for (const relationTable in this.tables) {
            if (this.getTableInfo(table).tableName == this.getTableInfo(relationTable).tableName) continue
            const children = await this.getRelationChildData(table, id, relationTable)
            if (children.length > 0)
                result[this.getTableInfo(relationTable).caption] = children
        }
        return result
    }

    //ページのに関連する子要素の取得
    async getRelationChildData (fromtable, fromid, totable) {
        if(!this.tableExists(fromtable)) throw new Error(this.getTableInfo(fromtable).tableName + ' TABLES not exist')
        if(!this.tableExists(totable)) throw new Error(this.getTableInfo(totable).tableName+ ' TABLES not exist')
        this.db = this.db || await this.database()

        const ids = fromid.split('.').map( (currentValue, index, array) => {
            return `'${array.slice(0,index+1).join('.')}'`
         } ).join();

        try {
            // Prepare an sql statement
            const stmt = this.db.prepare(this.preparesTemplate.RelationChildData({ totable: this.getTableInfo(totable).tableName, ids,ids}))

            // Bind values to the parameters and fetch the results of the query
            //const result = stmt.getAsObject({'$id' : id});
            // Bind new values
            stmt.bind({ $fromtable: this.getTableInfo(fromtable).tableName, $totable: this.getTableInfo(totable).tableName });
            let children = [];
            while (stmt.step()) { //
                const ret = stmt.getAsObject()
                ret.table = totable
                children.push(ret)
            }
            return children
        } catch (error) {
            console.error("getRelationChildData",this.preparesTemplate.RelationChildData({ totable: this.getTableInfo(totable).tableName, ids,ids}),error)
        }
    }
}

export default Dao