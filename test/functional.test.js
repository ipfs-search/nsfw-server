const request = require('supertest');

const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const NsfwServer = require('../nsfwServer');

let nsfwServer;

// https://dustinpfister.github.io/2017/10/01/hapi-static-file-server/
const staticServer = new Hapi.server({
  port: 7327,
});

beforeAll(async () => {
  nsfwServer = await NsfwServer();

  await staticServer.register(Inert);
  staticServer.route({ method: 'GET', path: '/{param*}', handler: { directory: { path: __dirname } } });
  staticServer.start();
});

describe('mozilla grapefruit jpg', () => {
  const grapefruitURL = 'http://localhost:7327/grapefruit.jpg';
  it('should return a 200 status code', (done) => {
    request(nsfwServer.listener)
      .get(`/classify?url=${grapefruitURL}`)
      .expect(200)
      .then(() => done())
      .catch((error) => done(error));
  });
});

afterAll(() => {
  nsfwServer.stop();
  staticServer.stop();
});
