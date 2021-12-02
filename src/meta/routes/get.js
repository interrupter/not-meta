module.exports = function({req, thisModel}){
  let id = req.params._id;
  return thisModel.getOne(id);
};
