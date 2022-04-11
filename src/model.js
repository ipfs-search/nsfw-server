const { create, globSource } = this.process.env.IPFS_API_ADDRESS
  ? require('ipfs')
  : require('ipfs-http-client');
const nsfw = require('nsfwjs');

const modelsDirectory = `${process.env.PWD}/models`;
const availableModels = [
  {
    modelFile: 'quant_nsfw_mobilenet',
    modelOptions: {},
  },
  {
    modelFile: 'model',
    modelOptions: { size: 299 },
  },
  {
    modelFile: 'quant_mid',
    modelOptions: { type: 'graph' },
  },
];
const selectedModel = availableModels[2];

const ipfsCreateOptions = this.process.env.IPFS_API_ADDRESS
  ? this.process.env.IPFS_API_ADDRESS
  : { offline: true, start: false };

module.exports = async ({ modelFile, modelOptions } = selectedModel) => ({
  model: await nsfw.load(`file://${modelsDirectory}/${modelFile}/`, modelOptions),
  modelCid: await create(ipfsCreateOptions)
    .then(async (ipfs) => {
      let cid;
      // eslint-disable-next-line no-restricted-syntax
      for await (const file of ipfs.addAll(globSource(modelsDirectory, `${modelFile}/*`))) {
        if (file.path === modelFile) cid = file.cid;
      }
      return cid.toString();
    }),
});
