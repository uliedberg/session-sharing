const http = require('http');
const Koa = require('koa');
const serve = require('koa-static');
const bunyan = require('bunyan');
const koaLogger = require('./koalogger.js');
const uuidv4 = require('uuid/v4');

const app = new Koa();
const logger = bunyan.createLogger({name: "cookie-bounce"});

app.use(koaLogger(logger, { level: 'info' }));

const COOKIE_NAME = 'bounce'
app.use(async (ctx, next) => {
  await next();
  if (!/.*\.child\.com$/.test(ctx.hostname)) {
    logger.info({ hostname: ctx.hostname }, 'cookie-handling: not child.com')
    return;
  }

  if (ctx.cookies.get(COOKIE_NAME)) {
    logger.info({ cookie: { name: COOKIE_NAME, value: ctx.cookies.get(COOKIE_NAME) } },
                'cookie-handling: cookie set by browser - doing nothing');
  } else {
    const newCookieValue = uuidv4();
    const cookieOpts = {
      domain: '.child.com',
      maxAge: 1000*60*60*24 * 1, // 1 day
      overwrite: false,
      httpOnly: true
      // secure: true
    }
    logger.info({ cookie: { name: COOKIE_NAME, value: ctx.cookies.get(COOKIE_NAME), opts: cookieOpts } },
                'cookie-handling: cookie not set by browser  - setting');
    //   maxAge a number representing the milliseconds from Date.now() for expiry
    // signed sign the cookie value
    // expires a Date for cookie expiration
    // path cookie path, /' by default
    // domain cookie domain
    // secure secure cookie
    // httpOnly server-accessible cookie, true by default
    // overwrite a boolean indicating whether to overwrite previously set cookies of the same name (false by default). If this is true, all cookies set during the same request with the same name (regardless of path or domain) are filtered out of the Set-Cookie header when setting this cookie.
    ctx.cookies.set(COOKIE_NAME, newCookieValue, cookieOpts);
  }
});

app.use(serve('./public'));

const server = http.createServer(app.callback());

server.listen(3003, () => {
  logger.info({ address: server.address() }, 'server started');
});
