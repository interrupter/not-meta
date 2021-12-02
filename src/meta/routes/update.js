module.exports = function({
  req,
  thisModel
}) {
  let id = req.params._id;
  delete req.body._id;
  delete req.body.__versions;
  return thisModel.update(
    {
      _id: id
    },
    thisModel.sanitizeInput(req.body),
    false
  );
};
