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

const { CID } = require('multiformats');

const axios = require('axios');
const tf = require('@tensorflow/tfjs-node');
const nsfw = require('nsfwjs');
const Boom = require('@hapi/boom');
const fs = require('fs');
const nsfwjsVersion = require('./nsfwVersion');

// const ipfs = ipfsClient.create(process.env.IPFS_API || 'http://localhost:5001');

const ipfsGateway = process.env.IPFS_GATEWAY || 'http://127.0.0.1:8080';

const server = async () => {
  const app = express();
  app.use(pino);
  app.use(cors());

  // TODO: offline loading / self hosting
  const model = await nsfw.load(process.env.NSFW_MODEL);

  app.get('/classify/:cid', async (req, res) => {
    const { cid } = req.params;
    const url = `${ipfsGateway}/ipfs/${cid}`;

    try {
      CID.parse(cid);
    } catch (e) {
      console.log(`Bad CID ${cid}`);
      return res.status(400).send('Bad input');
    }

    let axiosResponse;
    try {
      axiosResponse = await axios.get(url, {
        responseType: 'arraybuffer',
      });
    } catch (error) {
      const message = `Error fetching ${url} - ${error.toJSON().status}`;
      return Boom.serverUnavailable(message);
    }

    if (axiosResponse.status >= 400) {
      return Boom.badRequest('bad url response'); // 400
    }

    try {
      const decodedImage = await tf.node.decodeImage(axiosResponse.data, 3);
      const classification = await model.classify(decodedImage);
      decodedImage.dispose();

      return res.status(200).send({
        classification: Object.fromEntries(classification.map(
          (entry) => [entry.className.toLowerCase(), entry.probability],
        )),
        nsfwjsVersion,
      });
    } catch (error) {
      return Boom.unsupportedMediaType(error); // 415
    }
  });

  return app;
};

module.exports = server;
