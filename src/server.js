const http = require('http');
const Koa = require('koa');
const mount = require('koa-mount');
const serve = require('koa-static');
const views = require('koa-views');
const bunyan = require('bunyan');

const koaLogger = require('./koalogger.js');
const cookies = require('./cookies.js');
const viewsMW = require('./views.js');
const apiMW = require('./api.js');

const app = new Koa()
  .use(koaLogger(bunyan.createLogger({name: "req-res-logger"}), { level: 'info' }))
  .use(cookies.log({ cookieName: 'bounce' }))
  .use(mount('/api', apiMW( { cookieName: 'bounce' })))
  .use(views(__dirname + '/../views', { map: { html: 'mustache' } }))
  .use(viewsMW())
  .use(serve('./views'));

const logger = bunyan.createLogger({name: "cookie-base"});
const server = http.createServer(app.callback());
server.listen(3003, () => {
  logger.info({ address: server.address() }, 'server started');
});
