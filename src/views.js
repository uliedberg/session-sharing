const path = require('path');

module.exports = function (opts = {}) {
  const logger = opts.logger;

  // TODO: clean up error handling and passing to next middleware... (pull out state and then no need for much of this code)
  return async function (ctx, next) {
    logger.info({ hostname: ctx.hostname, path: ctx.path }, 'maybe render');
    if (!/.*\.child\.com$/.test(ctx.hostname)) {
      logger.info({ hostname: ctx.hostname }, 'skipping to next middleware');
      return await next();
    }

    const po = path.parse(ctx.path);
    const viewPath = (path.format(po) + (po.ext ? '' : '/index.html')).replace(/^\//, '');
    const locals = { return_url: ctx.query['return-url'] || ctx.request.header.referer };
    logger.info({ hostname: ctx.hostname, view_path: viewPath, return_url: locals.return_url }, 'will try to render');
    try {
      await ctx.render(viewPath, locals);
    } catch (e) {
      logger.info({ template_error: e}, 'template error - passing on to next');
      return await next();
    }
  }
}
