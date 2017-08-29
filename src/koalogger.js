// taken from https://github.com/ivpusic/koa-bunyan and then modified some...
const bunyan = require('bunyan');
const util = require('util');

module.exports = function (opts = {}) {
  const logger = bunyan.createLogger({
    name: "req-res-logger",
    serializers: bunyan.stdSerializers
  });

  const defaultLevel = opts.level || 'info';
  const verbose = !!opts.verbose;
  const requestTimeLevel = opts.timeLimit;

  return function (ctx, next) {
    const startTime = new Date().getTime();
    const logData = { hostname: ctx.hostname, referer: ctx.request.header.referer };
    logger[defaultLevel](logData, util.format('[REQ] %s %s %s', ctx.method, ctx.host, ctx.url));

    const done = function () {
      const requestTime = new Date().getTime() - startTime;
      const localLevel = defaultLevel;

      if (requestTimeLevel && requestTime > requestTimeLevel) {
        localLevel = 'warn';
      }
      // const resLogData = logData;
      const resLogData = verbose ? Object.assign({ req: ctx.req, res: ctx.res }, logData) : logData;
      logger[localLevel](resLogData, util.format('[RES] %s %s %s (%s) took %s ms',
                         ctx.method, ctx.host, ctx.originalUrl, ctx.status, requestTime));
    };

    ctx.res.once('finish', done);
    ctx.res.once('close', done);

    return next();
  };
};
