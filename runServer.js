const nsfwServer = require('./src/nsfwServer');

const nsfwHost = process.env.NSFW_SERVER_HOST || 'localhost';
const nsfwPort = process.env.NSFW_SERVER_PORT || '3423';

nsfwServer().then((server) => server.listen(nsfwPort, nsfwHost, () => {
  console.log(`NSFW server listening on http://${nsfwHost}:${nsfwPort}/`);
}));
