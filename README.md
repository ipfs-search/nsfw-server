# nsfw-server
[![Maintainability](https://api.codeclimate.com/v1/badges/21a5f471fb41d6c57eec/maintainability)](https://codeclimate.com/github/ipfs-search/nsfw-server/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/21a5f471fb41d6c57eec/test_coverage)](https://codeclimate.com/github/ipfs-search/nsfw-server/test_coverage)
[![Backers on Open Collective](https://opencollective.com/ipfs-search/backers/badge.svg)](#backers)
[![Sponsors on Open Collective](https://opencollective.com/ipfs-search/sponsors/badge.svg)](#sponsors)

A simple node.js server to run [nsfw.js](https://nsfwjs.com/) for images and return its results.

## getting started
### install:
`npm i`

### run:
`npm run-script serve`

run production mode:

`node runServer.js`

dev/prod server runs on port 3000 by default. To change this, set PORT environment variable, like so:

`PORT=707 npm start`

### run tests:
`npm test`

### setup docker:

`docker build -t nsfw-server .`

### run docker in production on port 9000
`docker run --env NODE_ENV=production -p 9000:3000 -it nsfw-server`

## usage/api

`/classify?url=<imageURL>`

get the NSFW classification for the image given by imageURL
