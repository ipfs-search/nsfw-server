const request = require('supertest');

const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const NsfwServer = require('../src/nsfwServer');

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
      .expect(({ body }) => {
        expect(body.nsfwjsVersion).toBeTruthy();
        expect(body).toHaveProperty('hentai');
        expect(body).toHaveProperty('neutral');
        expect(body).toHaveProperty('porn');
        expect(body).toHaveProperty('drawing');
        expect(body).toHaveProperty('sexy');
      })
      .end(done);
  });
});

describe('no url specified', () => {
  it('should return a 400 status code', (done) => {
    request(nsfwServer.listener)
      .get('/classify')
      .expect(400)
      .end(done);
  });
});

describe('axios 404', () => {
  const grapefruitURL = 'http://localhost:7327/i_never_existed';
  it('should return 503 - bad gateway', (done) => {
    request(nsfwServer.listener)
      .get(`/classify?url=${grapefruitURL}`)
      .expect(503)
      .end(done);
  });
});

afterAll(() => {
  nsfwServer.stop();
  staticServer.stop();
});
