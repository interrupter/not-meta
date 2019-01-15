const NAME_PREFIX = 'get_';
const BEFORE_ACTION = 'before';
const Route = require('./meta/_route.js');
const Model = require('./meta/_model.js');
const notError = require('not-error');
const log = require('not-log')(module);

/**
*	Если есть специфические действия перед обработчиком, то мы их запускаем первыми
*	@param	{string}	name	название обработчика
*	@param	{object}	input	параметры для фабрики
*	@param	{function}	funct	обработчик возвращаемый фабрикой
*/
let withBefore = function(name, input, funct){
	if(input.hasOwnProperty(BEFORE_ACTION) && input[BEFORE_ACTION].hasOwnProperty(name)){
		return function(req, res, next){
			input[BEFORE_ACTION][name]({name, input, req, res, next})
				.then(()=>{
					funct(req, res, next);
				})
				.catch((err)=>{
					let e = ((new notError(err.message)).adopt(err));
					log.report(e);
				});
		};
	}else{
		return funct;
	}
};

/**
*   Массированная инициализация общих функций
*   @param  {object}    src     источник
*   @param  {object}    dest    назначение
*   @param  {array}     list    список для переноса
*   @param  {object}    params  объект с параметрами для инициализации
*   @param  {string}    prefix  приставка перед названием метода в модуле роутера
*/
let extend = (src, dest, list, params = {}, prefix = '')=>{
	if(src && dest && Array.isArray(list)){
		for(let name of list){
			let fac = src[NAME_PREFIX + name];
			if((typeof fac!=='undefined') && (fac !== null)){
				let paramsCopy = Object.assign({ACTION_NAME: name}, params);
				dest[prefix + name] = withBefore(name, params, fac(paramsCopy));
			}
		}
	}
};

module.exports = {
	name: 'not-meta',
	Route,
	Model,
	extend,
	paths:{}
};
