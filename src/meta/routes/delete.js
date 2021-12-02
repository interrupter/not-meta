const notNode = require('not-node');

module.exports = function({
  req,
  thisModel
}) {
  const id = req.params._id;
  if (notNode.Routine.versioning(thisModel)) {
    return thisModel.getOneRaw(id).then((itm) => itm.close());
  } else {
    return thisModel.findByIdAndRemove(id).exec();
  }
};
