// eslint-disable-next-line no-unused-expressions,global-require
process.env.NODE_ENV && require('dotenv').config({ path: `./.env.${process.env.NODE_ENV}` });

const Hapi = require('@hapi/hapi');
const Boom = require('@hapi/boom');
const axios = require('axios');
const tf = require('@tensorflow/tfjs-node');
const nsfw = require('nsfwjs');
const laabr = require('laabr');
const nsfwjsVersion = require('./nsfwVersion');

if (process.env.NODE_ENV === 'production') {
  tf.enableProdMode();
}

const nsfwServer = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
  });

  server.ext('onPreResponse', ({ response }, h) => {
    if (response.isBoom) {
      response.output.headers['Access-Control-Allow-Origin'] = '*';
    } else {
      response.header('Access-Control-Allow-Origin', '*');
    }
    return h.continue;
  });

  await server.register({
    plugin: laabr,
    options: {
      hapiPino: {
        logQueryParams: true,
      },
      formats: {
        onPostStart: ':time :level :message on port :host[port]',
        response: ':time :level :remoteAddress :method :url :get[queryParams] :status (:responseTime ms)',
      },
    },
  });

  // TODO: offline loading / self hosting
  const model = await nsfw.load();

  server.route({
    method: 'GET',
    path: '/',
    handler() {
      return 'This is the "Not suitable for work" server';
    },
  });

  server.route({
    method: 'GET',
    path: '/classify',
    handler: async (request, h) => {
      const { url } = request.query;

      if (!url) {
        return Boom.badRequest('no url specified'); // 400
      }

      let axiosResponse;
      try {
        axiosResponse = await axios.get(url, {
          responseType: 'arraybuffer',
        });
      } catch (error) {
        const message = `Error fetching data for ${url} - got code ${error.toJSON().status}`;
        return Boom.serverUnavailable(message);
      }

      if (axiosResponse.status >= 400) {
        return Boom.badRequest('bad url response'); // 400
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
        return Boom.unsupportedMediaType(error); // 415
      }
    },
  });
  await server.start();

  return server;
};

process.on('unhandledRejection', (reason, promise) => {
  console.error({ message: 'Unhandled rejection', reason, promise });
  // Application specific logging, throwing an error, or other logic here
  process.exit(1);
});

module.exports = nsfwServer;
