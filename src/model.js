const { create, globSource } = require('ipfs');
const nsfw = require('nsfwjs');

const modelsDirectory = `${process.env.PWD}/models`;

// const modelFile = 'quant_nsfw_mobilenet';
// const modelOptions = {};

// const modelFile = 'model';
// const modelOptions = { size: 299 };

const modelFile = 'quant_mid';
const modelOptions = { type: 'graph' };

module.exports = async () => ({
  model: await nsfw.load(`file://${modelsDirectory}/${modelFile}/`, modelOptions),
  modelCid: await create({ offline: true, start: false })
    .then(async (ipfs) => {
      let cid;
      // eslint-disable-next-line no-restricted-syntax
      for await (const file of ipfs.addAll(globSource(modelsDirectory, `${modelFile}/*`))) {
        if (file.path === modelFile) cid = file.cid;
      }
      console.debug('model CID:', cid);
      return cid.toString();
    }),
});
