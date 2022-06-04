/**
 *  Запрос списка объектов и общего числа
 *  @param {ExpressRequest} req
 *  @param {ExpressResponse} res
 *
 **/

module.exports = function({
  input,
  skip,
  size,
  sorter,
  filter,
  search,
  thisModel
}) {
  let populate = [];
  if (input.populate && Array.isArray(input.populate)) {
    populate = [...input.populate];
  }
  return thisModel.listAndCount(skip, size, sorter, filter, search, populate);
};
