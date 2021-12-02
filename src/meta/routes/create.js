module.exports = function({
  req,
  thisModel
}) {
  let data = req.body;
  delete data._id;
  return thisModel.add(data);
};
