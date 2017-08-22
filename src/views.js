const path = require('path');

// TODO: move out view state from here?
module.exports = function (opts = {}) {
  const logger = opts.logger;

  return async function (ctx, next) {
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
  }
}
