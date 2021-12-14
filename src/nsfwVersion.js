// TODO: add yarn support;
const packageLock = require('../package-lock.json');

module.exports = packageLock?.packages?.['node_modules/nsfwjs'].version;
