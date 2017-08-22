const http = require('http');
const Koa = require('koa');
const mount = require('koa-mount');
const serve = require('koa-static');
const views = require('koa-views');
const bunyan = require('bunyan');

const koaLogger = require('./koalogger.js');
const cookiesMW = require('./cookies.js');
const viewsMW = require('./views.js');
const apiMW = require('./api.js');

const app = new Koa()
  .use(koaLogger(bunyan.createLogger({name: "req-res-logger"}), { level: 'info' }))
  .use(cookiesMW({ cookieName: 'bounce', logger: bunyan.createLogger({name: "cookie-middleware"}) }))
  .use(mount('/api', apiMW( { logger: bunyan.createLogger({name: "api-middleware"}) })))
  .use(views(__dirname + '/../views', { map: { html: 'mustache' } }))
  .use(viewsMW({ logger: bunyan.createLogger({name: "view-middleware"}) }))
  .use(serve('./views'));

const baseLogger = bunyan.createLogger({name: "cookie-base"});
const server = http.createServer(app.callback());
server.listen(3003, () => {
  baseLogger.info({ address: server.address() }, 'server started');
});
