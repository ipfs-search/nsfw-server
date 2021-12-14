const Hapi = require('@hapi/hapi');
const Boom = require('@hapi/boom');
const axios = require('axios');
const tf = require('@tensorflow/tfjs-node');
const nsfw = require('nsfwjs');
const logger = require('./logger');

if (process.env.NODE_ENV === 'production') {
  tf.enableProdMode();
}

const nsfwServer = async () => {
  const server = Hapi.server({
    port: 3000,
    host: 'localhost',
  });

  // TODO: offline loading
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

        // TODO: add versioning to response
        return h.response(classification).code(200);
      } catch (error) {
        logger.error({ request: request.url, errorMessage: error.message });
        return Boom.unsupportedMediaType(error); // 415
      }
    },
  });

  await server.start();
  console.log('Server running on %s', server.info.uri);
  return server;
};

process.on('unhandledRejection', (err) => {
  logger.error(err);
  process.exit(1);
});

module.exports = nsfwServer;
