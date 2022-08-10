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

// Ref: https://stackoverflow.com/questions/9153571/is-there-a-way-to-get-version-from-package-json-in-nodejs-code
const nsfwServerVersion = process.env.npm_package_version;

const ipfsGateway = process.env.IPFS_GATEWAY_URL || 'http://127.0.0.1:8080';

const server = async () => {
  console.log('IPFS gateway:', ipfsGateway);

  const app = express();
  app.use(cors());

  const { model, modelCid } = await nsfwModel();
  console.log('model:', modelCid);
  console.log('version:', nsfwServerVersion)

  app.get('/classify/:cid', (req, res, next) => {
    const { cid } = req.params;
    const url = `${ipfsGateway}/ipfs/${cid}`;

    try {
      CID.parse(cid);
    } catch (e) {
      next({ status: 400, error: 'Bad CID input' });
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
            nsfwServerVersion,
          });
          next();
        } catch ({ error }) {
          next({ status: 415, error }); // Unsupported media type
        }
      })
      .catch((error) => {
        if (error.response) {
          next({ status: 404, error: `File Not Found: ${url}` });
        } else if (error.request) {
          next({ status: 503, error: 'Upstream unavailable at ${url}' });
        } else next({ status: 500, error: error.error });
      });
  });

  app.use('/healthcheck', require('express-healthcheck')());

  // Error handling:
  app.use(({ status, error }, req, res, next) => res.status(status).send({
    http_status_code: status,
    error: error
  }));

  return app;
};

module.exports = server;
