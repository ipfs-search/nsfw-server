# nsfw-server
[![Pipeline Status](https://gitlab.com/ipfs-search.com/nsfw-server/badges/main/pipeline.svg)](https://gitlab.com/ipfs-search.com/nsfw-server/-/commits/main)
[![Maintainability](https://api.codeclimate.com/v1/badges/21a5f471fb41d6c57eec/maintainability)](https://codeclimate.com/github/ipfs-search/nsfw-server/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/21a5f471fb41d6c57eec/test_coverage)](https://codeclimate.com/github/ipfs-search/nsfw-server/test_coverage)
[![Backers on Open Collective](https://opencollective.com/ipfs-search/backers/badge.svg)](#backers)
[![Sponsors on Open Collective](https://opencollective.com/ipfs-search/sponsors/badge.svg)](#sponsors)

A microservice to run [nsfw.js](https://nsfwjs.com/) for images on IPFS.

## Requirements
* Node 16.x (LTS)
* Python (Windows / Mac OS X Requires Python 2.7)
* [Running IPFS daemon](https://docs.ipfs.io/how-to/command-line-quick-start/#command-line-quick-start) or [public IPFS gateway](https://docs.ipfs.io/concepts/ipfs-gateway/#gateway-providers) (not recommended, can be configured with environment variable)

## Getting started
### Install Node dependencies
`npm install`

### Start IPFS node
In a separate terminal, after installing a local IPFS daemon (see requirements):
`ipfs daemon`

### Start server
Run (auto-reloading) dev server with full debug enabled:
`env DEBUG=* npm run-script dev`

### Example usage

```sh
$ curl -s http://localhost:3423/classify/bafkreiam7vh2raw2chmx6gllup6sd32xsicwus2riglpjtzlygz4lzmxbm | jq
```
(Wait a while... IPFS is slow. :/)

```json
{
  "classification": {
    "neutral": 0.9980410933494568,
    "drawing": 0.001135041005909443,
    "porn": 0.00050011818530038,
    "hentai": 0.00016194644558709115,
    "sexy": 0.00016178081568796188
  },
  "modelCid": "QmfBNCmYLxwTr3CHaknd5HdzA6uXcTZqn1hsuLf8mRc3xS",
  "nsfwServerVersion": "0.9.0"
}
```

### Production server
Run in production mode:

`env NODE_ENV=production NSFW_SERVER_PORT=3342 npm start`

### Run tests
`npm test`

## Docker support
### Build docker image (tagged as `nsfw-server`)

`docker build -t nsfw-server .`

### Run docker image in production on port 9000
`docker run --env NODE_ENV=production -p 9000:3423 -t nsfw-server`

## API
To classify an [IPLD CID](https://docs.ipfs.io/concepts/content-addressing/):

`/classify/<cid>`

## Supported formats
We're using TensorFlow's [decodeImage](https://js.tensorflow.org/api_node/1.2.7/#node.decodeImage), which detects and supports BMP, GIF, JPEG and PNG formats.

## Configuration
nsfw-server is configured through the following environment variables:
* `IPFS_GATEWAY_URL`: Gateway to use for loading images. Defaults to `http://localhost:8080` (local node).
* `NSFW_SERVER_HOST`: Host to run server on. Defaults to `localhost`.
* `NSFW_SERVER_PORT`: Port to run server on. Defaults to `3423`.
* `DEBUG`: [Debug](https://www.npmjs.com/package/debug) verbosity level.
* `NODE_ENV`: Node environment. Set to `production` in ... production. Defaults to `development`.
* `NSFW_MODEL`: NSFW model to use.
