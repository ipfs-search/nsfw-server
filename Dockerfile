FROM node:16-buster-slim AS build

RUN apt-get update && apt-get -y dist-upgrade
RUN apt-get install -y build-essential python3

WORKDIR /src
COPY ./package* ./

RUN npm ci --only=production

# TODO; separate build and run layer
COPY . .

EXPOSE 3000
USER node
ENV HOST=0.0.0.0

CMD ["runServer.js"]
ENTRYPOINT ["node"]
