const notNode = require('not-node');

/*
* static
*/
exports.get_search = (input) => {
	return (searchQuery) => {
		const App = notNode.Application;
		let model = App.getModel(input.MODEL_NAME);
		return Promise.all(
			[
				Promise.resolve(input.MODEL_NAME),
				model.makeQuery('find', searchQuery).exec()
			]
		);
	};
};

/*
* loads data by taking _ids from selected field([_id])
* method
*/
exports.get_getContent = ()=>{
	return async ({
		contentField,
		contentModelName
	}) => {
		const App = notNode.Application;
		let model = App.getModel(contentModelName);
		if (this[contentField] && Array.isArray(this[contentField])){
			let list = await model.listByField('_id', this[contentField]);
      return {
				count:this[contentField].length,
				list
			};
    }else{
      return Promise.resolve({count: 0, list: []});
    }
	}
};
