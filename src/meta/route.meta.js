const log = require('not-log')(module, 'Meta');
const {notError} = require('not-error');
const notNode = require('not-node');
const {objHas, partCopyObj, isFunc, isAsync} = notNode.Common;
const notFilter = require('not-filter');

async function postProcess({ beforeResponse }, result) {
  if (beforeResponse && isFunc(beforeResponse)
  ) {
    if (isAsync(beforeResponse)) {
      result = await beforeResponse(result);
    } else {
      result = beforeResponse(result);
    }
  }
  return result;
}

function returnResults({ RESPONSE }, res, result) {
  if (RESPONSE && typeof RESPONSE.full === 'boolean') {
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
    try{
      result = await postProcess(input, result);
      returnResults(input, res, result);
    }catch(e){
      log.error(e);
    }
  };
}

function getErrorPresenter(req, res, {
  MODULE_NAME,
  MODEL_NAME,
  ACTION_NAME,
  reportList = []
}, opts = {}) {
  return (err) => {
    notNode.Application.report(
      new notError(`meta-route for ${MODULE_NAME}.${MODEL_NAME}.${ACTION_NAME}`, {
        MODULE_NAME,
        MODEL_NAME,
        ACTION_NAME,
        ...partCopyObj(opts, reportList)
      },
      err)
    );
    res.status(500).json({});
  };
}

function shortRoute({input, action}){
  return async function(req, res, next, preparedByNotNodeBefore){
    //extract data
    const thisModel = notNode.Application.getModel(input.MODEL_NAME);
    const thisSchema = notNode.Application.getModelSchema(input.MODEL_NAME);
    //{req, res, next, prepared, skip, size, sorter, filter, search, thisModel, thisSchema}
    const prepared = {
      input,
      req, res, next,
      prepared: preparedByNotNodeBefore,
      ...notFilter.pager.process(req), //skip,size
      sorter: notFilter.sorter.process(req, thisSchema),
      filter: notFilter.filter.process(req, thisSchema),
      search: notFilter.search.process(req, thisSchema),
      thisModel,
      thisSchema
    };
    //run action
    return (isFunc(action) && isAsync(action))?(await action(prepared)):(action(prepared));
    //return data or handle errors
  };
}

function wrap(input, shortRouteAction){
  return async function(req, res, next, prepared){
    try{
      let result = await shortRouteAction(req, res, next, prepared);
      await getResultPresenter(input, res)(result);
    }catch(e){
      getErrorPresenter(req, res, input)(e);
    }
  };
}

module.exports = ({input, action}) => {
  //before
  //standart router action function
  const shortRouteAction = shortRoute({input, action});
  if(objHas(input, 'short')){
    return shortRoute;
  }else{
    return wrap(input, shortRouteAction);
  }
  //after
};
