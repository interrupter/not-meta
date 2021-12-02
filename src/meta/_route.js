const
  metaRoute = require('./route.meta.js'),
  Log = require('not-log')(module, 'Meta/Routes');

module.exports.getAction = (input)=>{
  try{
    const name = input.ACTION_NAME.replace(/[^A-z_\.]/g, '');
    const action = require('./routes/' + name);
    return metaRoute({input, action});
  }catch(e){
    Log.error(`route action '${input.MODULE_NAME}.${input.MODEL_NAME}.${input.ACTION_NAME}' generation exception`);
    Log.error(e);
  }
};
