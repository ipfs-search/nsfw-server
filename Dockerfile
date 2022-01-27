FROM node:lts AS build

RUN apt-get install python3

WORKDIR /src
COPY ./package* ./

RUN npm ci --only=production

COPY . .

EXPOSE 3000
USER node
ENV HOST=0.0.0.0

CMD ["runServer.js"]
ENTRYPOINT ["node"]
