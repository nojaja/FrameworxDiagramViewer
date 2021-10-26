const zlib = require('zlib')
const fs = require('fs')

const initdb = require('../Initdb.js')
console.log('test', initdb)

async function main() {
    //initdb.init('test.db', require('./test.json') )

    const content = await initdb.init(require('../src/assets/datas/Frameworx_DB_Model_21.0.json') );
    console.log('test',content)
    
    async function save(savedata) {
        //fs.writeFileSync('test2.db', savedata);
        const gz = zlib.gzipSync(savedata);// 圧縮
        fs.writeFileSync('test2.db.gz', gz);
    }

    await save(content)
}
main();
