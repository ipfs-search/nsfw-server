const pino = require('pino-http')();
const nsfwServer = require('./src/nsfwServer');

const port = process.env.PORT || 3000;
nsfwServer().then((server) => server.listen(port, () => {
  pino.logger.info(`NSFW server listening on port ${port}`);
}));
