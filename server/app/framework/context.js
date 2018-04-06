const _ = require('lodash');
const parse = require('co-body');

function sendStatus(code) {
  if (this.state.__bodySent) {
    this.logger.error('call ctx.success after body sent');
    return;
  }
  this.status = code;
  this.state.__bodySent = true;
}

function success(data = {}) {
  if (this.state.__bodySent) {
    this.logger.error('call ctx.success after body sent');
    return;
  }
  this.body = {
    code: 0,
    data
  };
  this.state.__bodySent = true;
}

function error(code, message) {
  if (this.state.__bodySent) {
    this.logger.error('call ctx.error after body sent');
    return;
  }
  if (!_.isNumber(code)) {
    message = code;
    code = 500;
  }
  if (code < 1000) {
    this.status = code;
  }
  this.body = {
    code,
    data: message
  };
  this.state.__bodySent = true;
}

async function parseBody(options = {}) {
  const type = options.type || 'json';
  const config = this.app.config.form;  
  switch(type) {
  case 'query':
    return this.query;
  case 'json':
    if (!this.request.is('json')) {
      return this.throw(400);
    }
    return await parse.json(this, {
      limit: options.maxBody || config.jsonMaxBody || config.maxBody
    });
  case 'form':
    if (!this.request.is('urlencoded')) {
      return this.throw(400);
    }
    return await parse.form(this, {
      limit: options.maxBody || config.jsonMaxBody || config.maxBody
    });
  default:
    this.logger.error(`unknown Form type: ${type}`);
    return this.throw(500);
  }
}

async function fillForm(FormModel) {
  const config = this.app.config.form;
  const type = FormModel.type;
  let body;
  let form;
  switch(type) {
  case 'query':
    form = new FormModel(this.query);
    if (!form.validate()) {
      return this.throw(400);
    } 
    break;
  case 'json':
    if (!this.request.is('json')) {
      return this.throw(400);
    }
    body = await parse.json(this, {
      limit:  FormModel.maxBody || config.jsonMaxBody || config.maxBody
    });
    form = new FormModel(body);
    if (!form.validate()) {
      return this.throw(400);
    } 
    break;
  case 'form':
    if (!this.request.is('urlencoded')) {
      return this.throw(400);
    }
    body = await parse.form(this, {
      limit:  FormModel.maxBody || config.formMaxBody || config.maxBody
    });
    form = new FormModel(body);
    if (!form.validate()) {
      return this.throw(400);
    } 
    break;
  default:
    this.logger.error(`unknown Form type: ${type}`);
    return this.throw(500);
  }
  return form;
}

async function coreHandler(ctx, next) {
  const startTime = Date.now();  
  try {
    await next();
    if (!ctx.state.__bodySent) {
      if (ctx.body) {
        ctx.success(ctx.body);        
      } else {
        ctx.error(ctx.status || 600);
      }
    }
  } catch(ex) {
    if (ctx.state.__bodySent) {
      ctx.logger.error('error occur after __bodySent', ex);
    } else {
      let status = (ex && ex.status) ? ex.status : 500;
      if (status < 0) {
        status = 500;
      }
      if (!ex || !ex.status) {
        ctx.logger.error(ex);
      }
      ctx.error(status);
    }
  } finally {
    ctx.logger.access(ctx, startTime);    
  }
}

function extendContext(app) {
  Object.assign(app.context, {
    success,
    error,
    sendStatus,
    fillForm,
    parseBody
  });
  Object.defineProperties(app.context, {
    user: {
      get: function() {
        return this.state.user;
      }
    }
  });
  app.use(coreHandler);
}

module.exports = {
  extendContext
};
