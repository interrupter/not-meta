const notFilter = require('not-filter');

module.exports = function({filter, thisModel}){
  return thisModel.countWithFilter(notFilter.filter.modifyRules(filter, {
    __latest: true
  }));
};
