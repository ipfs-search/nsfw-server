const axios = require('axios');

const fs = require('fs');
const request = require('supertest');
const NsfwServer = require('../src/nsfwServer');

jest.mock('axios');
jest.mock('ipfs', () => ({
  ...jest.requireActual('ipfs'),
  create: () => Promise.resolve({
    addAll: () => [{ path: 'quant_mid', cid: 'mocked model CID' }],
  }),
}));

let nsfwServer;

beforeAll(async () => {
  nsfwServer = await NsfwServer();
});

const grapefruitCid = 'QmYasLHeFsRRY51xbBo6JfA2HegBEXhM3WL85S3Xfixr5d';
describe('mozilla grapefruit jpg', () => {
  axios.get.mockResolvedValueOnce({
    data: fs.readFileSync(`${__dirname}/grapefruit.jpg`),
    status: 200,
  });

  it('should return classification properties when image file is found', () => request(nsfwServer)
    .get(`/classify/${grapefruitCid}`)
    .expect(200)
    .expect(({ body }) => {
      expect(body.modelCid).toBe('mocked model CID');
      expect(body).toHaveProperty('classification.hentai');
      expect(body).toHaveProperty('classification.neutral');
      expect(body).toHaveProperty('classification.porn');
      expect(body).toHaveProperty('classification.drawing');
      expect(body).toHaveProperty('classification.sexy');
    }));
});

describe('bad input', () => {
  test('without CID it should return 404 - not found', () => request(nsfwServer)
    .get('/classify/')
    .expect(404));

  const badInput = 'Bad Input';
  test('anything else than a cid should return 400 - bad request', () => request(nsfwServer)
    .get(`/classify/${badInput}`)
    .expect(400));

  axios.get.mockRejectedValueOnce({ response: { status: 504 } });
  test('ipfs timeout gives 404 error - resource unavailable', () => request(nsfwServer)
    .get(`/classify/${grapefruitCid}`)
    .expect(404));

  axios.get.mockRejectedValueOnce({ request: { message: 'check firewall settings' } });
  test('Server networking error causes 503 - service unavailable error', () => request(nsfwServer)
    .get(`/classify/${grapefruitCid}`)
    .expect(503));

  axios.get.mockResolvedValueOnce({
    data: fs.readFileSync(`${__dirname}/functional.test.js`),
    status: 200,
  });
  test('unsupported media should return 415', () => request(nsfwServer)
    .get(`/classify/${grapefruitCid}`)
    .expect(415));
});
