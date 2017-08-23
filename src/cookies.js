const uuidv4 = require('uuid/v4');
const bunyan = require('bunyan');

const logger = bunyan.createLogger({name: "cookie-util"});

module.exports = {
  setUuid: function (ctx, cookieName, opts = {}) {
    const newCookieValue = uuidv4();
    const cookieOpts = {
      domain: '.child.com',
      maxAge: 1000*60*60*24 * 365*2, // 2 years
      overwrite: false, // default & we don't want to remove other cookies
      httpOnly: true
      // secure: true
    }
    ctx.cookies.set(cookieName, newCookieValue, cookieOpts);
    logger.info({ hostname: ctx.hostname, bounce_cookie: ctx.cookies.get(cookieName), cookie_opts: cookieOpts },
                'setting cookie in response');
  },

  log: function (opts = {}) {
    const { cookieName } = opts;

    return async (ctx, next) => {
      const cookies = ctx.request.headers["cookie"];
      if (!cookies) {
        logger.info({ hostname: ctx.hostname }, 'no cookies in request');
      } else {
        logger.info({ hostname: ctx.hostname, cookies: cookies }, 'cookies in request');
      }
      await next();
    }
  }

}
