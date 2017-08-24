
const bunyan = require('bunyan');
const path = require('path');

const cookies = require('./cookies.js');

const logger = bunyan.createLogger({name: "api-middleware"})

const paths = {
  '/redirect': function (ctx, opts) { // /redirect?url={url}
    const { cookieName, domain } = opts;
    const redirectUrl = ctx.request.query['url'];
    if (!redirectUrl) ctx.throw(400, 'no "url" query param', { path: ctx.path, method: ctx.method });
    logger.info({ hostname: ctx.hostname, redirect_url: redirectUrl }, 'will redirect (303)')

    ctx.status = 303;
    ctx.set('location', redirectUrl);
    cookies.setUuid(ctx, cookieName, domain);
  },
  '/ping': function (ctx) { // /ping/{uuid}
    logger.info({ hostname: ctx.hostname }, 'will respond to ping');
    ctx.status = 200;
    ctx.body = { message: 'pong' };
  }
};
const errorFun = function (ctx) {
  ctx.throw(400, 'unsupported', { path: ctx.path, method: ctx.method });
};

module.exports = function (opts = {}) {
  return async (ctx, next) => {
    ctx.set('Cache-Control', 'max-age=0, no-cache, no-store');
    const po = path.parse(ctx.path);
    (paths[po.dir] || errorFun)(ctx, opts);
  };
};
