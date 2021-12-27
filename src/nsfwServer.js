// eslint-disable-next-line no-unused-expressions,global-require
process.env.NODE_ENV && require('dotenv').config({ path: `./.env.${process.env.NODE_ENV}` });

const Hapi = require('@hapi/hapi');
const Boom = require('@hapi/boom');
const axios = require('axios');
const tf = require('@tensorflow/tfjs-node');
const nsfw = require('nsfwjs');
const laabr = require('laabr');
const logger = require('./logger');
const nsfwjsVersion = require('./nsfwVersion');

if (process.env.NODE_ENV === 'production') {
  tf.enableProdMode();
  logger.info('Tensorflow production mode enabled');
}

const nsfwServer = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
  });

  await server.register({
    plugin: laabr,
    options: {
      formats: {
        onPostStart: ':time :start :level :message on port :host[port]',
        onPostStop: ':time :stop :level :message',
        response: ':time :method :remoteAddress :url < :blurb > :status :payload (:responseTime ms)',
      },
      tokens: {
        start: () => '[start]',
        stop: () => '[stop]',
        blurb: (data) => data,
      },
      indent: 0,
    },
  });

  // TODO: offline loading / self hosting
  const model = await nsfw.load();

  server.route({
    method: 'GET',
    path: '/',
    handler() {
      logger.info('/ received');

      return 'This is the "Not suitable for work" server';
    },
  });

  server.route({
    method: 'GET',
    path: '/classify',
    handler: async (request, h) => {
      const { url } = request.query;

      if (url === undefined) {
        return Boom.badRequest('no url specified');
      }

      let axiosResponse;
      try {
        axiosResponse = await axios.get(url, {
          responseType: 'arraybuffer',
        });
      } catch (error) {
        const message = `Error fetching data for ${url} - got code ${error.toJSON().status}`;
        logger.error({ request: request.url, code: 503, message });
        return Boom.serverUnavailable(message);
      }

      if (axiosResponse.status >= 400) {
        return Boom.badRequest('bad url response');
      }

      try {
        const decodedImage = await tf.node.decodeImage(axiosResponse.data, 3);
        const classification = await model.classify(decodedImage);
        decodedImage.dispose();

        logger.info({ message: request.url });
        return h.response({
          classification: Object.fromEntries(classification.map(
            (entry) => [entry.className.toLowerCase(), entry.probability],
          )),
          nsfwjsVersion,
        }).code(200);
      } catch (error) {
        logger.error({ request: request.url, code: 415, message: error.message });
        return Boom.unsupportedMediaType(error); // 415
      }
    },
  });
  await server.start();

  logger.info({ message: `${process.env.NODE_ENV || 'development'} server running on port ${server.info.port}` });

  return server;
};

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ message: 'Unhandled rejection', reason, promise });
  // Application specific logging, throwing an error, or other logic here
  process.exit(1);
});

module.exports = nsfwServer;
