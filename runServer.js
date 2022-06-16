const nsfwServer = require('./src/nsfwServer');

const port = process.env.PORT || 3000;
nsfwServer().then((server) => server.listen(port, () => {
  console.log(`NSFW server listening on http://localhost:${port}/`);
}));
