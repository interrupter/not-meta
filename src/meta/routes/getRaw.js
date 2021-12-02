module.exports = function({req, thisModel}){
  const id = req.params._id;
  return thisModel.getOneRaw(id);
};
