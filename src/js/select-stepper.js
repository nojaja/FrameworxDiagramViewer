

export class SelectStepper {
    constructor(classname, onChange) {
        this.stepper = {
          classname:classname,
          elements:document.getElementsByClassName(classname),
          datas:{}
        }
        
        const stepper_elements = this.stepper.elements
        for (let i = 0; i < stepper_elements.length; i++) {
          
          const stepper_element = stepper_elements[i]
          const stepper_category = stepper_element.dataset.category
          const stepper_datas = this.stepper.datas[stepper_category]?
            this.stepper.datas[stepper_category]:this.stepper.datas[stepper_category]={element:{}}
          
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

    }

    
    getAllValue() {
        return this.stepper.datas
    }
    
    getCategoryValue(category) {
        return this.getAllValue()[category]
    }
    
    getValue(category,name){
        return this.getCategoryValue(category)[name]
    }
    
    setValueByCategory(category,name,status){
        if(!this.stepper.datas[category])return false
        this.stepper.datas[category][name]=status
        const select_element = this.stepper.datas[category].element[name]
        if(select_element)select_element.value=status
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

export default SelectStepper