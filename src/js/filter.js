
export class Filter {
    constructor(filters) {
        this.filters = filters || {}
    }

    /**
     * リストからの重複排除 Deduplication from list
     * @param {*} dataList : [{'key1':'val','unique-key-name':'val'},,,]
     * @param {*} keylist : Composite key ['unique-key-name',,,] 
     * @param {*} override : Override strategy
     *           ex1. (old,new) => {return true} //Strategy to choose the Latter
     *           ex1. (old,new) => {return old.min > new.min} //Strategy to choose the smaller
     * @returns : new List [{...},{...},,,,]
     */
    unique_filter_logic(dataList, keylist, override) {
        // uniqueになるkey文字列作成
        const keyjoin = (data, keylist, delimiter) => {
            return keylist.reduce((resultArray, key, index) => {
                resultArray[index] = data[key] || ""
                return resultArray;
            }, []).join(delimiter)
        }
        const map = new Map()
        for (let index = 0; index < dataList.length; index++) {
            const currentData = dataList[index];
            const uniqueKey = keyjoin(currentData, keylist)
            if (map.has(uniqueKey)) {//上書き
                if (override && override(map.get(uniqueKey), currentData)) map.set(uniqueKey, currentData)
            } else {
                map.set(uniqueKey, currentData)
            }
        }
        return Array.from(map.values())
    }


    /**
     * filter処理の実行
     * select * from dataList where ( table == filter_id ) or ( filter_category like filter_id)
     * @param {*} dataList 
     * @returns 
     */
    filter_logic(dataList) {
        //const result = dataList.filter((data)=>this.filter(data));
        const result = dataList.map((data)=>{
            data.hash = btoa(data.table + data.name)
            if(this.filter(data)){
                data.hidden = false
            }else{
                data.hidden = true
            }
            return data
        });
        return result
    }
    filter_logic2(dataList) {
        const result = dataList.filter((data)=>this.filter(data));
        return result
    }

    filter(data) {
        for (const [filter_category, filter] of Object.entries(this.filters)) {
            let hit_count = 0
            let filters_count = 0
            for (const [filter_id, value] of Object.entries(filter)) {
                if (filter_category == "LEVEL") {
                    if (data["table"] == filter_id.toLowerCase()) {
                        if (data[filter_category] != value) return false;//filterに不一致
                    }
                } else {
                    if (value && data[filter_category]) {
                        filters_count++;
                        if (data[filter_category].indexOf(filter_id) > -1) hit_count++;//filterに一致
                    }
                }
            }
            if (filters_count > 0 && hit_count == 0) return false //フィルタカテゴリ内で1つも一致しない場合は除外する
        }
        return true
    }

    //ノードのID表示用のURLをhistoryに追加して、再描画
    async setFilter(filter_category, filter_id, status) {
        //delete出来るようにMapにする
        const filter = new Map(Object.entries(this.filters[filter_category] || {}));
        if (status) {
            filter.set(filter_id, status)
        } else {
            filter.delete(filter_id)
        }
        //serialize出来るようにobjectにする
        this.filters[filter_category] = [...filter].reduce((l, [k, v]) => Object.assign(l, { [k]: v }), {})
        console.log("setFilter", this.filters)
        return true
    }

    setFilters(filters) {
        this.filters = filters
    }

    getFilters() {
        return this.filters
    }
    getSerializedFiltersString() {
        return btoa(JSON.stringify(this.filters));
    }
}

export default Filter