
const Koa = require('koa');
const bunyan = require('bunyan');
const Router = require('koa-router');
const koaBody = require('koa-body');
const uuidv4 = require('uuid/v4');

const cookies = require('./cookies.js');

const logger = bunyan.createLogger({name: "api-middleware"})
const sessions = new Map(); // all in memory :)

module.exports = function (opts = {}) {
  const router = createRouter(opts);
  return new Koa()
    .use(koaBody())
    .use(router.routes())
    .use(router.allowedMethods())
};

function createRouter(opts) {
  const { cookieName, domain } = opts;
  return Router()
    .get('/redirect', (ctx, next) => redirectAndSetCookie(ctx, cookieName, domain))
    .get('/bouncer_redirect', (ctx, next) => redirect(ctx))
    .get('/cookie/:id', (ctx, next) => returnCookie(ctx, cookieName))
    .post('/sessions', (ctx, next) => createSession(ctx))
    .get('/sessions/:id', (ctx, next) => fetchSession(ctx))
    .post('/sessions/:id', (ctx, next) => updateSession(ctx));
}

const defaultSessionData = {
  status: "created",
  data: "empty..."
}

// TODO: add some logging :)

function createSession (ctx) {
  const id = uuidv4();
  const timestamp = new Date().toISOString();
  const sessionData = Object.assign({}, ctx.request.body, defaultSessionData, { created: timestamp, updated: timestamp });
  sessions.set(id, sessionData);

  ctx.status = 201;
  ctx.set('location', `${ctx.protocol}://${ctx.host}/api/sessions/${id}`); // TODO: use router.url somehow?
  logger.info({ hostname: ctx.hostname , request_body: ctx.request.body, sessionData: sessionData }, 'create session');
}

function fetchSession (ctx) {
  fetchSessionWithoutLog(ctx);
  logger.info({ hostname: ctx.hostname, body: ctx.body }, 'fetch session');
}

function fetchSessionWithoutLog (ctx) {
  ctx.status = 200;
  ctx.body = sessions.get(ctx.params.id);
}

function updateSession (ctx) {
  const timestamp = new Date().toISOString();
  const newSessionData = Object.assign({}, sessions.get(ctx.params.id), ctx.request.body, { status: 'updated', updated: timestamp });
  sessions.set(ctx.params.id, newSessionData);
  fetchSessionWithoutLog(ctx);
  logger.info({ hostname: ctx.hostname, request_body: ctx.request.body, body: ctx.body }, 'update session')
}

function returnCookie (ctx, cookieName) {
  logger.info({ hostname: ctx.hostname }, 'will respond to cookie request');
  ctx.status = 200;
  ctx.body = { name: cookieName, value: ctx.cookies.get(cookieName) };
}

function redirectAndSetCookie (ctx, cookieName, domain) {
  redirect(ctx);
  cookies.setUuid(ctx, cookieName, domain);
}

function redirect (ctx) {
  const redirectUrl = ctx.request.query['url'];
  if (!redirectUrl) ctx.throw(400, 'no "url" query param', { path: ctx.path, method: ctx.method });
  logger.info({ hostname: ctx.hostname, redirect_url: redirectUrl }, 'will redirect (303)')

  ctx.status = 303;
  ctx.set('location', redirectUrl);
}

// const errorFun = function (ctx) {
//   ctx.throw(400, 'unsupported', { path: ctx.path, method: ctx.method });
// };
