const { create, globSource } = require('ipfs-core');

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
const selectedModel = availableModels[0]; // quant_nsfw_mobilenet

const ipfsCreateOptions = {
  offline: true,
  start: false,
  preload: {
    enabled: false
  },
  init: {
    emptyRepo: true,
  },
};

async function modelCid(modelFile) {
  let cid;
  const ipfs = await create(ipfsCreateOptions);

  // eslint-disable-next-line no-restricted-syntax
  for await (const file of ipfs.addAll(globSource(modelsDirectory, `${modelFile}/*`))) {
    if (file.path === modelFile) cid = file.cid;
  }

  await ipfs.stop();

  return cid?.toString();
}
module.exports = async ({ modelFile, modelOptions } = selectedModel) => ({
  model: await nsfw.load(`file://${modelsDirectory}/${modelFile}/`, modelOptions),
  modelCid: await modelCid(modelFile),
});
