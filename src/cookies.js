const uuidv4 = require('uuid/v4');

module.exports = function(opts = {}) {
  const { logger, cookieName } = opts;

  return async (ctx, next) => {
    await next();
    if (!/.*\.child\.com$/.test(ctx.hostname)) {
      logger.info({ hostname: ctx.hostname }, ' not child.com')
      return;
    }

    if (ctx.cookies.get(cookieName)) {
      logger.info({ hostname: ctx.hostname, bounce_cookie: ctx.cookies.get(cookieName) },
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
      ctx.cookies.set(cookieName, newCookieValue, cookieOpts);
      logger.info({ hostname: ctx.hostname, bounce_cookie: ctx.cookies.get(cookieName), cookie_opts: cookieOpts },
                  'cookie-handling: cookie not set by browser  - set cookie');
    }
  }
}
