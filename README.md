# nsfw-server
A simple node.js server to run [nsfw.js](https://nsfwjs.com/) for images and return its results.

CodeClimate:
<a href="https://codeclimate.com/github/ooade/NextSimpleStarter/test_coverage"><img src="https://api.codeclimate.com/v1/badges/a5551f40b263ba2c3764/test_coverage" /></a>

## getting started
### install:
`npm i`

### run:
`npm start`

run production mode:

`NODE_ENV=production npm start`

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
