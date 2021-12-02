const notNode = require('not-node');


module.exports = function(){
  /**
  * loads data by taking _ids from selected field([_id])
  * method
  **/
  return async function ({
    contentField,
    contentModelName
  }){
    const App = notNode.Application;
    let model = App.getModel(contentModelName);
    if (this[contentField] && Array.isArray(this[contentField])){
      let list = await model.listByField('_id', this[contentField]);
      return {
        count:this[contentField].length,
        list
      };
    }else{
      return Promise.resolve({count: 0, list: []});
    }
  };
};
