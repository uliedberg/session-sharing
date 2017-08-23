const bunyan = require('bunyan');
const path = require('path');

const logger = bunyan.createLogger({name: "view-middleware"});

module.exports = function (opts = {}) {
  const { childHostname } = opts;

  return async function (ctx, next) {
    const po = path.parse(ctx.path);

    if (po.ext && po.ext != '.html') {
      logger.info({ hostname: ctx.hostname, url: ctx.url }, 'skipping views handling for url');
      return await next();
    }

    const viewPath = (path.format(po) + (po.ext ? '' : '/index.html')).replace(/^\/+/, '');
    // move state...
    const locals = {
      child_hostname: childHostname,
      return_url: ctx.query['return-url'] || ctx.request.header.referer
    };
    logger.info({ hostname: ctx.hostname, view_path: viewPath, return_url: locals.return_url }, 'will try to render');
    try {
      await ctx.render(viewPath, locals);
    } catch (e) {
      logger.info({ hostname: ctx.hostname, template_error: e}, 'template error - passing on to next');
      return await next();
    }
  }
}
