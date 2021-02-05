const query = require('not-filter'),
	notError = require('not-error').notError,
	common = require('not-node').Common,
	notNode = require('not-node'),
	App = notNode.Application;

async function postProcess({
	beforeResponse,
	ACTION_NAME
}, result) {
	if (beforeResponse &&
		Object.prototype.hasOwnProperty.call(beforeResponse, ACTION_NAME) &&
		typeof beforeResponse[ACTION_NAME] === 'function'
	) {
		if (beforeResponse[ACTION_NAME].constructor.name === 'AsyncFunction') {
			result = await beforeResponse[ACTION_NAME](result);
		} else {
			result = beforeResponse[ACTION_NAME](result);
		}
	}
	return result;
}

function returnResults({
	RESPONSE,
	ACTION_NAME
}, res, result) {
	if (RESPONSE && Array.isArray(RESPONSE.full) && RESPONSE.full.indexOf(ACTION_NAME) > -1) {
		let msg = {
			status: 'ok'
		};
		if (typeof result !== 'undefined') {
			msg.result = result;
		}
		res.status(200).json(msg);
	} else {
		if (typeof result === 'undefined') {
			result = {};
		}
		res.status(200).json(result);
	}
}

function getResultPresenter(input, res) {
	return async (result) => {
		result = await postProcess(input, result);
		returnResults(input, res, result);
	};
}

function getErrorPresenter(req, res, {
	MODEL_NAME,
	ACTION_NAME
}, opts = {}) {
	return (err) => {
		App.report(
			new notError(`meta-route for ${MODEL_NAME}.${ACTION_NAME}`, {
				MODEL_NAME,
				ACTION_NAME,
				...opts
			},
			err)
		);
		res.status(500).json({});
	};
}

exports.get_list = function(input) {
	return function(req, res) {
		let {
				size,
				skip
			} = query.pager.process(req),
			thisModel = notNode.Application.getModel(input.MODEL_NAME),
			thisSchema = notNode.Application.getModelSchema(input.MODEL_NAME);
		thisModel.list(skip, size, query.sorter.process(req, thisSchema), query.filter.process(req, thisSchema))
			.then(getResultPresenter(input, res))
			.catch(getErrorPresenter(req, res, input, {
				size,
				skip
			}));
	};
};

exports.get_listAll = function(input) {
	return function(req, res) {
		let thisModel = notNode.Application.getModel(input.MODEL_NAME);
		thisModel.listAll()
			.then(getResultPresenter(input, res))
			.catch(getErrorPresenter(req, res, input));
	};
};

exports.get_count = function(input) {
	return function(req, res) {
		let thisModel = notNode.Application.getModel(input.MODEL_NAME),
			thisSchema = notNode.Application.getModelSchema(input.MODEL_NAME),
			filter = query.filter.process(req, thisSchema);
		thisModel.countWithFilter(query.filter.modifyRules(filter, {
			__latest: true
		}))
			.then(getResultPresenter(input, res))
			.catch(getErrorPresenter(req, res, input));
	};
};

/**
 *	Запрос списка объектов и общего числа
 *	@param {ExpressRequest} req
 *	@param {ExpressResponse} res
 *
 */
exports.get_listAndCount = function(input) {
	return (req, res) => {
		let thisModel = notNode.Application.getModel(input.MODEL_NAME),
			thisSchema = notNode.Application.getModelSchema(input.MODEL_NAME),
			{
				size,
				skip
			} = query.pager.process(req),
			filter = query.filter.process(req, thisSchema),
			sorter = query.sorter.process(req, thisSchema),
			search = query.search.process(req, thisSchema),
			populate = [''];
		if (input.populate &&
			Object.prototype.hasOwnProperty.call(input.populate, input.ACTION_NAME) &&
			Array.isArray(input.populate[input.ACTION_NAME])
		) {
			populate = input.populate[input.ACTION_NAME];
		}
		thisModel.listAndCount(skip, size, sorter, filter, search, populate)
			.then(getResultPresenter(input, res))
			.catch(getErrorPresenter(req, res, input, {
				size,
				skip,
				filter,
				sorter,
				populate
			}));
	};
};

exports.get_create = function(input) {
	return function(req, res) {
		let data = req.body,
			thisModel = notNode.Application.getModel(input.MODEL_NAME);
		data.__latest = true;
		delete data._id;
		thisModel.add(data)
			.then(getResultPresenter(input, res))
			.catch(getErrorPresenter(req, res, input));
	};
};

exports.get_get = function(input) {
	return function(req, res) {
		let id = req.params._id,
			thisModel = notNode.Application.getModel(input.MODEL_NAME);
		thisModel.getOne(id)
			.then(getResultPresenter(input, res))
			.catch(getErrorPresenter(req, res, input, {
				id
			}));
	};
};

exports.get_getById = function(input) {
	return function(req, res) {
		let id = req.params[common.firstLetterToLower(input.MODEL_NAME) + 'ID'],
			thisModel = notNode.Application.getModel(input.MODEL_NAME);
		thisModel.getOneByID(id)
			.then((item) => {
				let variant = item.getVariant();
				if (Object.prototype.hasOwnProperty.call(input, 'MODEL_TITLE')) {
					variant.option = common.firstLetterToLower(input.MODEL_NAME);
					variant.optionTitle = input.MODEL_TITLE;
				}
				return variant;
			})
			.then(getResultPresenter(input, res))
			.catch(getErrorPresenter(req, res, input, {
				id
			}));
	};
};

exports.get_getRaw = function(input) {
	return function(req, res) {
		let id = req.params._id,
			thisModel = notNode.Application.getModel(input.MODEL_NAME);
		thisModel.getOneRaw(id)
			.then(getResultPresenter(input, res))
			.catch(getErrorPresenter(req, res, input, {
				id
			}));
	};
};

exports.get_update = function(input) {
	return function(req, res) {
		let id = req.params._id,
			thisModelFile = notNode.Application.getModelFile(input.MODEL_NAME),
			thisModel = notNode.Application.getModel(input.MODEL_NAME);
		delete req.body._id;
		delete req.body.__versions;
		if (thisModelFile.enrich && thisModelFile.enrich.versioning) {
			thisModel.findOneAndUpdate({
				_id: id,
				__latest: true,
				__closed: false
			},
			thisModel.sanitizeInput(req.body)
			).exec()
				.then(thisModel.findById(id).exec())
				.then((item) => {
					if (typeof item !== 'undefined' && item !== null) {
						return thisModel.saveVersion(item._id);
					} else {
						throw new notError('-version not saved, empty response', {
							id,
							item
						});
					}
				})
				.then(getResultPresenter(input, res))
				.catch(getErrorPresenter(req, res, input, {
					id
				}));
		} else {
			thisModel.findOneAndUpdate({
				_id: id
			},
			thisModel.sanitizeInput(req.body)
			).exec()
				.then(getResultPresenter(input, res))
				.catch(getErrorPresenter(req, res, input, {
					id
				}));
		}

	};
};

exports.get_delete = function(input) {
	return function(req, res) {
		let id = req.params._id,
			thisModelFile = notNode.Application.getModelFile(input.MODEL_NAME),
			thisModel = notNode.Application.getModel(input.MODEL_NAME);
		if (thisModelFile.enrich && thisModelFile.enrich.versioning) {
			thisModel.findOneAndUpdate({
				_id: id,
				__latest: true,
				__closed: false
			}, {
				__closed: true
			}).exec()
				.then(getResultPresenter(input, res))
				.catch(getErrorPresenter(req, res, input, {
					id
				}));
		} else {
			thisModel.findByIdAndRemove(id).exec()
				.then(getResultPresenter(input, res))
				.catch(getErrorPresenter(req, res, input, {
					id
				}));
		}
	};
};
