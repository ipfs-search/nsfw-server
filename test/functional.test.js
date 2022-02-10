const axios = require('axios');
const fs = require('fs');
const request = require('supertest');
const NsfwServer = require('../src/nsfwServer');

jest.mock('axios');

let nsfwServer;

beforeAll(async () => {
  nsfwServer = await NsfwServer();
});

describe('mozilla grapefruit jpg', () => {
  axios.get.mockResolvedValueOnce({
    data: fs.readFileSync(`${__dirname}/../test/grapefruit.jpg`),
    status: 200,
  });

  // this CID can be anything for this test
  const grapefruitCid = 'QmYasLHeFsRRY51xbBo6JfA2HegBEXhM3WL85S3Xfixr5d';

  it('should return classification properties when image file is found', () => request(nsfwServer)
    .get(`/classify/${grapefruitCid}`)
    .expect(200)
    .expect(({ body }) => {
      expect(body.nsfwjsVersion).toBeTruthy();
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

  const badGrapefruitCid = 'QmYasLHeFsRRY51xbBo6JfA2HegBEXhM3WL85S3Xfixr5e';
  test('bad cid should give 400', () => request(nsfwServer)
    .get(`/classify/${badInput}`)
    .expect(400));
});
