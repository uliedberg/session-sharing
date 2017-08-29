const bunyan = require('bunyan');
const path = require('path');

const logger = bunyan.createLogger({name: "view-middleware"});

const HTML_MAX_AGE = 60*60*24 * 365; // 1 year

module.exports = function (opts = {}) {
  const { childHostname, cookieName } = opts;

  return async function (ctx, next) {
    const po = path.parse(ctx.path);

    if (po.ext && po.ext != '.html') {
      logger.info({ hostname: ctx.hostname, url: ctx.url }, 'skipping views handling for url');
      return await next();
    }

    const viewPath = (path.format(po) + (po.ext ? '' : '/index.html')).replace(/^\/+/, '');
    // move state...
    const localState = viewState(ctx, childHostname, cookieName);
    logger.info({ hostname: ctx.hostname, view_path: viewPath, local_state: localState }, 'will try to render');
    try {
      await ctx.render(viewPath, localState);
      if (ctx.hostname == childHostname && po.base != 'bouncer.html') {
        logger.info({ hostname: ctx.hostname }, 'view request to child, indicating cacheable content');
        ctx.set('Cache-Control', `max-age=${HTML_MAX_AGE}`);
      }
    } catch (e) {
      logger.info({ hostname: ctx.hostname, template_error: e}, 'template error - passing on to next');
      return await next();
    }
  }
}

function viewState (ctx, childHostname, cookieName) {
  cookieValue = ctx.cookies.get(cookieName);

  return {
    hostname: ctx.hostname,
    child_hostname: childHostname,
    return_url: ctx.query['return-url'] || ctx.request.header.referer,
    close_action: ctx.query['close-action'] == 'true',
    cookie: cookieValue ? { name: cookieName, value: cookieValue } : undefined
  }
}
