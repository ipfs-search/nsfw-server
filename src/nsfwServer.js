/*
Next line opens .env.test or .env.production, which are included in the repo.
While this is not customary to do, it facilitates testing.
Local env settings can be passed (through docker) in the call
*/
// eslint-disable-next-line no-unused-expressions,global-require
process.env.NODE_ENV && require('dotenv').config({ path: `./.env.${process.env.NODE_ENV}` });

const express = require('express');
const cors = require('cors');

const { CID } = require('ipfs-core');

const axios = require('axios');
const tf = require('@tensorflow/tfjs-node');

const nsfwModel = require('./model');

const ipfsGateway = process.env.IPFS_GATEWAY || 'http://127.0.0.1:8080';

const server = async () => {
  console.log('IPFS gateway:', ipfsGateway);

  const app = express();
  app.use(cors());

  const { model, modelCid } = await nsfwModel();
  console.log('model:', modelCid);

  app.get('/classify/:cid', (req, res, next) => {
    const { cid } = req.params;
    const url = `${ipfsGateway}/ipfs/${cid}`;

    try {
      CID.parse(cid);
    } catch (e) {
      next({ status: 400, message: 'Bad CID input' });
      return;
    }

    axios.get(url, { responseType: 'arraybuffer' })
      .then(async (response) => {
        try {
          const decodedImage = await tf.node.decodeImage(response.data, 3);
          const classification = await model.classify(decodedImage);
          decodedImage.dispose();

          res.status(200).send({
            // simplify the classification output data:
            classification: Object.fromEntries(classification.map(
              (entry) => [entry.className.toLowerCase(), entry.probability],
            )),
            modelCid,
          });
          next();
        } catch ({ message }) {
          next({ status: 415, message }); // Unsupported media type
        }
      })
      .catch((error) => {
        if (error.response) {
          next({ status: 404, message: `Error fetching ${url} - ${error.response.status}` });
        } else if (error.request) {
          next({ status: 503, message: 'Unable to fetch data' });
        } else next({ status: 500, message: error.message });
      });
  });

  // Error handling:
  // eslint-disable-next-line no-unused-vars
  app.use(({ status, message }, req, res, next) => res.status(status).send(message));

  return app;
};

module.exports = server;
