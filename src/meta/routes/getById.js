const {firstLetterToLower, objHas} = require('not-node').Common;

module.exports = function({input, req, thisModel}){
  let id = req.params[firstLetterToLower(input.MODEL_NAME) + 'ID'];
  return thisModel.getOneByID(id)
    .then((item) => {
      if (item.getVariant){
        let variant = item.getVariant();
        if (objHas(input, 'MODEL_TITLE')) {
          variant.option = firstLetterToLower(input.MODEL_NAME);
          variant.optionTitle = input.MODEL_TITLE;
        }
        return variant;
      }else{
        return item;
      }
    });
};
