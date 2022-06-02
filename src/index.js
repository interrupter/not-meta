const BEFORE_ACTION = 'before';
const Route = require('./meta/_route.js');
const Model = require('./meta/_model.js');
const notNode = require('not-node');
const {objHas} = notNode.Common;

const OPTIONS_TO_FLAT = [BEFORE_ACTION, 'full', 'reportList', 'populate'];

/**
*	Если есть специфические действия перед обработчиком, то мы их запускаем первыми
*	@param	{string}	name	название обработчика
*	@param	{object}	input	параметры для фабрики
*	@param	{function}	funct	обработчик возвращаемый фабрикой
*/
let withBefore = function(name, input, funct){
	if(objHas(input, BEFORE_ACTION)){
		return async function(req, res, next, prepared){
			await input[BEFORE_ACTION]({ name, input, req, res, next });
			return await funct(req, res, next, prepared);
		};
	}else{
		return funct;
	}
};

function copyParamsForAction(name, params){
	let result = {ACTION_NAME: name, RESPONSE:{}};
	Object.keys(params).forEach((paramName)=>{
		if(OPTIONS_TO_FLAT.includes(paramName)){
			if(objHas(params[paramName], name)){
				result[paramName] = params[paramName][name];
			}
		}else{
			if(paramName === 'RESPONSE' && params.RESPONSE && Array.isArray(params.RESPONSE.full)){
				result.RESPONSE = {
					full: params.RESPONSE.full.includes(name)
				};
			}else{
				result[paramName] = params[paramName];
			}
		}
	});
	return result;
}

/**
*   Массированная инициализация общих функций
*   @param  {object}    src     источник
*   @param  {object}    dest    назначение
*   @param  {array}     list     список для переноса
*   @param  {object}    params  объект с параметрами для инициализации
*   @param  {string}    prefix  приставка перед названием метода в модуле роутера
*/
let extend = (src, dest, list, params = {}, prefix = '')=>{
	if(src && dest && Array.isArray(list)){
		for(let name of list){
			const paramsCopy = copyParamsForAction(name, params);
			dest[prefix + name] = withBefore(
				name,
				paramsCopy,
				src.getAction(paramsCopy)
			);
		}
	}
};

module.exports = {
	name: 'not-meta',
	paths:{},
	Route,
	Model,
	extend,
};
