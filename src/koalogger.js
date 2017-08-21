// taken from https://github.com/ivpusic/koa-bunyan plus some extra logs for host header

const util = require('util');

module.exports = function (logger, opts) {
  opts = opts || {};

  const defaultLevel = opts.level || 'info';
  const requestTimeLevel = opts.timeLimit;

  return function (ctx, next) {
    const startTime = new Date().getTime();
    const referer = { referer: ctx.request.header.referer };
    logger[defaultLevel](referer, util.format('[REQ] %s %s %s', ctx.method, ctx.host, ctx.url));

    const done = function () {
      const requestTime = new Date().getTime() - startTime;
      const localLevel = defaultLevel;

      if (requestTimeLevel && requestTime > requestTimeLevel) {
        localLevel = 'warn';
      }
      logger[localLevel](referer, util.format('[RES] %s %s %s (%s) took %s ms',
                         ctx.method, ctx.host, ctx.originalUrl, ctx.status, requestTime));
    };

    ctx.res.once('finish', done);
    ctx.res.once('close', done);


    return next();
  };
};
