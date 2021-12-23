const Hapi = require('@hapi/hapi');
const Boom = require('@hapi/boom');
const axios = require('axios');
const tf = require('@tensorflow/tfjs-node');
const nsfw = require('nsfwjs');
const logger = require('./logger');
const nsfwjsVersion = require('./nsfwVersion');

if (process.env.NODE_ENV === 'production') {
  tf.enableProdMode();
}

const nsfwServer = async ({ port = 3000, host = 'localhost' }) => {
  const server = Hapi.server({
    port,
    host,
  });

  // TODO: offline loading / self hosting
  const model = await nsfw.load();

  server.route({
    method: 'GET',
    path: '/classify',
    handler: async (request, h) => {
      logger.info({ method: 'GET', message: request.url });
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
        logger.error({ code: 503, message });
        return Boom.serverUnavailable(message);
      }

      if (axiosResponse.status >= 400) {
        return Boom.badRequest('bad url response');
      }

      try {
        const decodedImage = await tf.node.decodeImage(axiosResponse.data, 3);
        const classification = await model.classify(decodedImage);
        decodedImage.dispose();

        return h.response({
          classification: Object.fromEntries(classification.map(
            (entry) => [entry.className.toLowerCase(), entry.probability],
          )),
          nsfwjsVersion,
        }).code(200);
      } catch (error) {
        logger.error({ request: request.url, errorMessage: error.message });
        return Boom.unsupportedMediaType(error); // 415
      }
    },
  });
  await server.start();
  logger.info({message: `Server running on port ${server.info.uri}`});
  return server;
};

// process.on('unhandledRejection', (reason, promise) => {
//   logger.error({message: 'Unhandled rejection', reason, promise});
  // Application specific logging, throwing an error, or other logic here
  // process.exit(1);
// });

module.exports = nsfwServer;
