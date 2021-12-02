const notNode = require('not-node');

module.exports = function(input){
  return function(searchQuery){
    const App = notNode.Application;
    let model = App.getModel(input.MODEL_NAME);
    return Promise.all(
      [
        Promise.resolve(input.MODEL_NAME),
        model.makeQuery('find', searchQuery).exec()
      ]
    );
  };
};
