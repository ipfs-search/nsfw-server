const Hapi = require('@hapi/hapi');
const Boom = require('@hapi/boom');
const axios = require('axios');
const tf = require('@tensorflow/tfjs-node');
const nsfw = require('nsfwjs');

// TODO add process env condition
tf.enableProdMode();

const nsfwServer = async () => {
  const server = Hapi.server({
    port: 3000,
    host: 'localhost',
  });

  const model = await nsfw.load();

  server.route({
    method: 'GET',
    path: '/classify',
    handler: async (request, h) => {
      const { url } = request.query;
      if (url === undefined) {
        return Boom.badRequest('no url specified');
      }

      const axiosResponse = await axios.get(url, {
        responseType: 'arraybuffer',
      })
        .catch(Boom.badRequest); // 400

      try {
        const decodedImage = await tf.node.decodeImage(axiosResponse.data, 3);
        const classification = await model.classify(decodedImage);
        decodedImage.dispose();
        return h.response(classification).code(200);
      } catch (error) {
        return Boom.unsupportedMediaType(error); // 415
      }
    },
  });

  await server.start();
  console.log('Server running on %s', server.info.uri);
  return server;
};

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});

module.exports = nsfwServer;
