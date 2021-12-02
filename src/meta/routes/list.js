module.exports = function({skip, size, sorter, filter, thisModel}){
  return thisModel.list(skip, size, sorter, filter);
};
