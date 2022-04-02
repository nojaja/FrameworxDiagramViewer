

export class SelectCheckbox {
    constructor(classname, onChange) {
        
        this.filter = {
            classname:classname,
            elements:document.getElementsByClassName(classname),
            datas:{}
        }

        const filter_elements = this.filter.elements
        for (let i = 0; i < filter_elements.length; i++) {
          const filter_element = filter_elements[i]
          const filter_category = filter_element.dataset.category
          const filter_datas = this.filter.datas[filter_category]?
                this.filter.datas[filter_category]:this.filter.datas[filter_category]={}
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

    }

    getAllValue() {
        return this.filter.datas
    }
    
    getCategoryValue(category) {
        return this.getAllValue()[category]
    }
    getValue(category,name){
        return this.getCategoryValue(category)[name]
    }

    //状態を更新
    setValueByCategory(category,name,status){
        if(!this.filter.datas[category])return false
        this.filter.datas[category][name]=status
        const input_elements = this.filter.datas[category].elements
        for (let i = 0; i < input_elements.length; i++) {
        if(input_elements[i].name==name)input_elements[i].checked = status
        }
    }
         
    setValuesByCategory(category,statusList){
        for (const [name, status] of Object.entries(statusList)) {
        this.setValueByCategory(category, name, status)
        }
    }
    
    setValues(datas){
        for (const [category, statusList] of Object.entries(datas)) {
        this.setValuesByCategory(category, statusList)
        }
    }
    
}

export default SelectCheckbox