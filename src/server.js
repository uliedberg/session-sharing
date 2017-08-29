const http = require('http');
const Koa = require('koa');
const mount = require('koa-mount');
const serve = require('koa-static');
const views = require('koa-views');
const bunyan = require('bunyan');
const url = require('url')

const koaLogger = require('./koalogger.js');
const cookies = require('./cookies.js');
const viewsMW = require('./views.js');
const apiMW = require('./api.js');

const childHostname = process.env.CHILD_HOSTNAME || 'sub.child.com';
const cookieName = 'bounce';

const logger = bunyan.createLogger({ name: "cookie-base" });

const app = new Koa()
  .use(koaLogger({ level: 'info', verbose: false }))
  .use(cookies.log({ cookieName: 'bounce' }))
  .use(mount('/api', apiMW( { cookieName, domain: cookieDomainFromHostName(childHostname) })))
  .use(views(__dirname + '/../views', { map: { html: 'mustache' } }))
  .use(viewsMW({ childHostname, cookieName }))
  .use(serve('./views'));

const server = http.createServer(app.callback());
server.listen(3003, () => {
  logger.info({ address: server.address() }, 'server started');
});

function cookieDomainFromHostName(hostname, opts = {}) {
  const [, domain] = hostname.match(/.+(\..+\..+)/) || [];
  return domain;
}
