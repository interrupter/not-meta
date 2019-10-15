const App = require('not-node').Application;

exports.get_search = (input) => {
  return (searchQuery) => {
    let model = App.getModel(input.MODEL_NAME);
    return Promise.all(
      [
        Promise.resolve(input.MODEL_NAME),
        model.makeQuery('find', searchQuery).exec()
      ]
    );
  };
};
