const  Log = require('not-log')(module, 'Meta/ModelStaticMethods');

/**
* static methods for models
*/
module.exports.getAction = (input)=>{
  try{
    const name = input.ACTION_NAME.replace(/[^A-z_\.]/g, '');
    const action = require('./models/' + name);
    return action({input, action});
  }catch(e){
    Log.error(`model static method '${input.MODULE_NAME}.${input.MODEL_NAME}.${input.ACTION_NAME}' generation exception`);
    Log.error(e);
  }
};
