/*
Next line opens .env.test or .env.production, which are included in the repo.
While this is not customary to do, it facilitates testing.
Local env settings can be passed (through docker) in the call
*/
// eslint-disable-next-line no-unused-expressions,global-require
process.env.NODE_ENV && require('dotenv').config({ path: `./.env.${process.env.NODE_ENV}` });

const express = require('express');
const cors = require('cors');
const pino = require('pino-http')();

const { CID } = require('ipfs');

const axios = require('axios');
const tf = require('@tensorflow/tfjs-node');

const nsfwModel = require('./model');

const ipfsGateway = process.env.IPFS_GATEWAY || 'http://127.0.0.1:8080';

const badInputError = 400;

const server = async () => {
  pino.logger.info(`IPFS gateway: ${ipfsGateway}`);
  const app = express();
  app.use(pino);
  app.use(cors());

  const { model, modelCid } = await nsfwModel();

  app.get('/classify/:cid', async (req, res, next) => {
    const { cid } = req.params;
    const url = `${ipfsGateway}/ipfs/${cid}`;

    try {
      CID.parse(cid);
    } catch (e) {
      e.status = badInputError;
      return next(e);
    }
    /*
    // TODO: turn it into this format:
    axios.get(url, {
      responseType: 'arraybuffer',
    })
      .then(response => {
      //  ...
      })
      .catch(error => {
      //  ...
      });
    */
    let axiosResponse;
    try {
      axiosResponse = await axios.get(url, {
        responseType: 'arraybuffer',
      });
    } catch (error) {
      pino.logger.debug(error);
      if (error.response) {
        const message = `Error fetching ${url} - ${error.response.status}`;
        return res.status(404).send(message);
      }
      if (error.request) {
        return res.status(503).send('Unable to fetch data');
      }
      return res.status(500).send(error.message);
    }

    try {
      const decodedImage = await tf.node.decodeImage(axiosResponse.data, 3);
      const classification = await model.classify(decodedImage);
      decodedImage.dispose();

      return res.status(200).send({
        classification: Object.fromEntries(classification.map(
          (entry) => [entry.className.toLowerCase(), entry.probability],
        )),
        modelCid,
      });
    } catch (error) {
      return res.status(415).send('CID points to unsupported media type');
    }
  });

  app.use(({ status, message }, req, res, next) => {
    res.status(status).send(message);
    next();
  });

  return app;
};

module.exports = server;
