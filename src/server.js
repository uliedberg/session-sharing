const http = require('http');
const Koa = require('koa');
const serve = require('koa-static');
const views = require('koa-views');
const bunyan = require('bunyan');
const koaLogger = require('./koalogger.js');
const uuidv4 = require('uuid/v4');
const path = require('path');

const app = new Koa();
const baseLogger = bunyan.createLogger({name: "cookie-base"});

app.use(koaLogger(bunyan.createLogger({name: "req-res-logger"}), { level: 'info' }));

const cLogger = bunyan.createLogger({name: "cookie-middleware"});
const COOKIE_NAME = 'bounce';
app.use(async (ctx, next) => {
  const logger = cLogger;
  await next();
  if (!/.*\.child\.com$/.test(ctx.hostname)) {
    logger.info({ hostname: ctx.hostname }, ' not child.com')
    return;
  }

  if (ctx.cookies.get(COOKIE_NAME)) {
    logger.info({ hostname: ctx.hostname, bounce_cookie: ctx.cookies.get(COOKIE_NAME) },
                'cookie set by browser - doing nothing');
  } else {
    const newCookieValue = uuidv4();
    const cookieOpts = {
      domain: '.child.com',
      maxAge: 1000*60*60*24 * 1, // 1 day
      overwrite: false,
      httpOnly: true
      // secure: true
    }
    ctx.cookies.set(COOKIE_NAME, newCookieValue, cookieOpts);
    logger.info({ hostname: ctx.hostname, bounce_cookie: ctx.cookies.get(COOKIE_NAME), cookie_opts: cookieOpts },
                'cookie-handling: cookie not set by browser  - set cookie');
  }
});


const vLogger = bunyan.createLogger({name: "view-middleware"});
app.use(views(__dirname + '/../views', { map: { html: 'mustache' } }));
app.use(async (ctx, next) => {
  const logger = vLogger;
  logger.info({ hostname: ctx.hostname, path: ctx.path }, 'maybe render');
  if (!/.*\.child\.com$/.test(ctx.hostname)) {
    logger.info({ hostname: ctx.hostname }, 'skipping to next middleware');
    return await next();
  }

  const po = path.parse(ctx.path);
  const viewPath = (path.format(po) + (po.ext ? '' : '/index.html')).replace(/^\//, '');
  const locals = { return_url: ctx.query['return-url'] || ctx.request.header.referer };
  logger.info({ hostname: ctx.hostname, view_path: viewPath, return_url: locals.return_url }, 'will render');
  await ctx.render(viewPath, locals);
});
app.use(serve('./views'));

const server = http.createServer(app.callback());

server.listen(3003, () => {
  baseLogger.info({ address: server.address() }, 'server started');
});
