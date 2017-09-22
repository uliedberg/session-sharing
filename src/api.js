
const bunyan = require('bunyan');
const Router = require('koa-router');
const path = require('path');

const cookies = require('./cookies.js');

const logger = bunyan.createLogger({name: "api-middleware"})
const router = new Router();

// TODO: .allowedMethods() would be nice... use that in the existing router on "/" since we mount .routes() in server?
module.exports = function (opts = {}) {
  const { cookieName, domain } = opts;
  return router
    .get('/redirect', (ctx, next) => {
      redirect(ctx);
      cookies.setUuid(ctx, cookieName, domain);
    })
    .get('/bouncer_redirect', (ctx, next) => {
      redirect(ctx);
    })
    .get('/cookie/:id', (ctx, next) => {
      logger.info({ hostname: ctx.hostname }, 'will respond to cookie request');
      returnCookie(ctx, cookieName);
    });
};

function returnCookie(ctx, cookieName) {
  ctx.status = 200;
  ctx.body = { name: cookieName, value: ctx.cookies.get(cookieName) };
}

function redirect(ctx) {
  const redirectUrl = ctx.request.query['url'];
  if (!redirectUrl) ctx.throw(400, 'no "url" query param', { path: ctx.path, method: ctx.method });
  logger.info({ hostname: ctx.hostname, redirect_url: redirectUrl }, 'will redirect (303)')

  ctx.status = 303;
  ctx.set('location', redirectUrl);
}

// const errorFun = function (ctx) {
//   ctx.throw(400, 'unsupported', { path: ctx.path, method: ctx.method });
// };
