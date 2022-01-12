# nsfw-server
[![Pipeline Status](https://gitlab.com/ipfs-search.com/nsfw-server/badges/main/pipeline.svg)](https://gitlab.com/ipfs-search.com/nsfw-server/-/commits/main)
[![Maintainability](https://api.codeclimate.com/v1/badges/21a5f471fb41d6c57eec/maintainability)](https://codeclimate.com/github/ipfs-search/nsfw-server/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/21a5f471fb41d6c57eec/test_coverage)](https://codeclimate.com/github/ipfs-search/nsfw-server/test_coverage)
[![Backers on Open Collective](https://opencollective.com/ipfs-search/backers/badge.svg)](#backers)
[![Sponsors on Open Collective](https://opencollective.com/ipfs-search/sponsors/badge.svg)](#sponsors)

A simple node.js server to run [nsfw.js](https://nsfwjs.com/) for images and return its results.

## Requirements
* Node 16.x (LTS)
* Python (Windows / Mac OS X Requires Python 2.7, )

## getting started
### Install Node dependencies:
`npm install`

### Run (auto-reloading) dev server
`npm run-script dev`

Run in production mode:

`env NODE_ENV=production npm start`

dev/prod server runs on port 3000 by default. To change this, set PORT environment variable, like so:

`PORT=707 npm start`

### Run tests
`npm test`

### Build docker image (tagged as `nsfw-server`)

`docker build -t nsfw-server .`

### Run docker image in production on port 9000
`docker run --env NODE_ENV=production -p 9000:3000 -t nsfw-server`

## Usage/api

`/classify/<CID>`

get the NSFW classification for the image located by CID on IPFS
