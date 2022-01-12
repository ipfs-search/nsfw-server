const nsfwServer = require('./src/nsfwServer');

nsfwServer().then((server) => server.listen(process.env.PORT || 3000));
