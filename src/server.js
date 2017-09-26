// TODO: split parent & child into 2 different servers? this is getting proper horrible :)

const http = require('http');
const Koa = require('koa');
const mount = require('koa-mount');
const serve = require('koa-static');
const views = require('koa-views');
const bunyan = require('bunyan');
const url = require('url');

const fetch = require('node-fetch');
const koaLogger = require('./koalogger.js');
const cookies = require('./cookies.js');
const viewsMW = require('./views.js');
const apiMW = require('./api.js');

const childHostname = process.env.CHILD_HOSTNAME || 'sub.child.com';
const cookieName = 'bounce';

const logger = bunyan.createLogger({ name: "cookie-base" });
const app = new Koa()
  .use(koaLogger({ level: 'info', verbose: true }))
  .use(cookies.log({ cookieName: 'bounce' }))
  .use(mount('/api', apiMW({ cookieName, domain: cookieDomainFromHostName(childHostname) })))
  .use(createSession(/^\/(index.html)?/))
  .use(views(__dirname + '/../public', { map: { html: 'mustache' } }))
  .use(viewsMW({ childHostname, cookieName }))
  .use(serve('./public'));

const server = http.createServer(app.callback());
server.listen(3003, () => {
  logger.info({ address: server.address() }, 'server started');
});

function cookieDomainFromHostName(hostname, opts = {}) {
  const [, domain] = hostname.match(/.+(\..+\..+)/) || [];
  return domain;
}

// TODO: the async stuff? do await instead of promises
function createSession(pathRegex) {
  return async (ctx, next) => {
    logger.info({ hostname: ctx.hostname, regex: pathRegex, path: ctx.path}, `createSession test: ${!pathRegex.test(ctx.path)}`);
    if (ctx.hostname == childHostname || !pathRegex.test(ctx.path)) return next();

    logger.info('create session - about to fetch');
    await fetch(`http://${childHostname}:3003/api/sessions`, { method: 'POST', body: { data: 'created by parent.' } })
      .then((res) => {
        logger.info('create session - POST result');
        const location = res.headers.get('location');
        if (res.status != 201 && !!location) throw new Error('no 201 or location header');
        return fetch(location);
      })
      .then((res) => {
        logger.info('create session - GET result');
        if (res.status != 200) throw new Error('GET response not 200');
        return res;
      })
      .then((res) => res.json().then((json) => ({ url: res.url, data: json})) ) // ehrm... :)
      .then((json) => ctx.state = Object.assign({}, ctx.state, { parent: { session: json } }) )
      .then(() => next())
      .catch((error) => {
        logger.warn({ hostname: ctx.hostname, error: error }, 'error creating session');
        ctx.throw(500, 'error creating session', { error: error })
      });
  }
}
