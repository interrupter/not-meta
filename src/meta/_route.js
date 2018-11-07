const log = require('not-log')(module),
	query = require('not-filter'),
	notError = require('not-error'),
	common = require('not-node').Common,
	notNode = require('not-node');

exports.get_list = function(input){
	return function (req, res) {
		let {size, skip} = query.pager.process(req),
			thisModel = notNode.ApplicationgetModel(input.MODEL_NAME),
			thisSchema = notNode.ApplicationgetModelSchema(input.MODEL_NAME);
		thisModel.list(skip, size, query.sorter.process(req, thisSchema), query.filter.process(req, thisSchema))
			.then(function(items){
				res.json(items);
			})
			.catch((err)=>{
				log.error(err);
				res.status(500).json({});
			});
	};
};

exports.get_listAll = function(input){
	return function (req, res) {
		let thisModel = notNode.ApplicationgetModel(input.MODEL_NAME);
		thisModel.listAll()
			.then(function (items) {
				res.json(items);
			})
			.catch(log.error);
	};
};

exports.get_count = function(input){
	return function (req, res) {
		let thisModel = notNode.ApplicationgetModel(input.MODEL_NAME),
			thisSchema = notNode.ApplicationgetModelSchema(input.MODEL_NAME),
			filter = query.filter.process(req, thisSchema);
		thisModel.countWithFilter(query.filter.modifyRules(filter, {	__latest: true}))
			.then((count)=>{
				res.json({
					count: count
				});
			})
			.catch((err)=>{
				res.status(500).end();
				log.error(err);
			});
	};
};

/**
*	Запрос списка объектов и общего числа
*	@param {ExpressRequest} req
*	@param {ExpressResponse} res
*
*/
exports.get_listAndCount = function (input){
	return (req, res)=>{
		let thisModel = notNode.ApplicationgetModel(input.MODEL_NAME),
			thisSchema = notNode.ApplicationgetModelSchema(input.MODEL_NAME),
			{size, skip} = query.pager.process(req),
			filter = query.filter.process(req, thisSchema),
			sorter = query.sorter.process(req, thisSchema),
			search = query.search.process(req, thisSchema),
			populate = [''];
		if (input.populate &&
			input.populate.hasOwnProperty(input.ACTION_NAME) &&
			Array.isArray(input.populate[input.ACTION_NAME])) {
			populate = input.populate[input.ACTION_NAME];
		}
		thisModel.listAndCount(skip, size, sorter, filter, search, populate)
			.then((result)=>{
				query.return.process(req, thisSchema, result.list);
				res.status(200).json(result);
			})
			.catch((err)=>{
				log.error(err);
				res.status(500).json({});
			});
	};
};

exports.get_create = function(input){
	return function (req, res) {
		let data = req.body,
			thisModel = notNode.ApplicationgetModel(input.MODEL_NAME);
		data.__latest = true;
		delete data._id;
		thisModel.add(data)
			.then((item) => {
				res.status(200).json(item);
			})
			.catch((e) => {
				res.status(500).json(e);
				log.error(e);
			});
	};
};

exports.get_get = function(input){
	return function (req, res) {
		let id = req.params._id,
			thisModel = notNode.ApplicationgetModel(input.MODEL_NAME);
		thisModel.getOne(id)
			.then((item) => {
				if (input.after && input.after[input.ACTION_NAME]){
					input.after[input.ACTION_NAME](item);
				}
				res.status(200).json(item);
			})
			.catch((err) => {
				log.error(id, err);
				res.status(500).json({});
			});
	};
};

exports.get_getById = function(input){
	return function (req, res) {
		let id = req.params[common.firstLetterToLower(input.MODEL_NAME)+'ID'],
			thisModel = notNode.ApplicationgetModel(input.MODEL_NAME);
		thisModel.getOneByID(id)
			.then((item)=>{
				var variant = item.getVariant();
				if (input.hasOwnProperty('MODEL_TITLE')){
					variant.option = common.firstLetterToLower(input.MODEL_NAME);
					variant.optionTitle = input.MODEL_TITLE;
				}
				res.status(200).json(variant);
			})
			.catch((err)=>{
				log.error(err);
				res.status(500).json({});
			});
	};
};

exports.get_getRaw = function(input){
	return function (req, res) {
		let id = req.params._id,
			thisModel = notNode.ApplicationgetModel(input.MODEL_NAME);
		thisModel.getOneRaw(id)
			.then((item)=>{
				res.status(200).json(item);
			})
			.catch((err)=>{
				log.error(err);
				res.status(500).json({});
			});
	};
};

exports.get_update = function(input){
	return function (req, res) {
		let id = req.params._id,
			thisModel = notNode.ApplicationgetModel(input.MODEL_NAME);
		//console.log('update', id, req.params, req.body);
		delete req.body._id;
		delete req.body.__versions;
		//console.log('id',id);
		thisModel.findOneAndUpdate({
			_id: id,
			__latest: true
		},
		thisModel.sanitizeInput(req.body)
		).exec()
			.then(thisModel.findById(id).exec())
			.then((item)=>{
				if (typeof item !== 'undefined' && item !== null) {
					return thisModel.saveVersion(item._id);
				} else {
					throw new notError('-version not saved, empty response', {id,item});
				}
			})
			.then((item)=>{
				res.status(200).json(item);
			})
			.catch((err)=>{
				log.error('-version not saved ', err);
				log.error(err);
				res.status(500).json({});
			});
	};
};

exports.get_delete = function(input){
	return function (req, res) {
		let id = req.params._id,
			thisModel = notNode.ApplicationgetModel(input.MODEL_NAME);
		thisModel.findByIdAndRemove(id).exec()
			.then(()=>{
				res.status(200).json({});
			})
			.catch((err)=>{
				log.error(err);
				res.status(500).json({});
			});
	};
};
