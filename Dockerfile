FROM node:16-buster-slim AS build

RUN apt-get update && apt-get -y dist-upgrade
RUN apt-get install -y build-essential python3

WORKDIR /src
COPY ./package* ./

RUN npm ci --only=production

# This results in a single layer image
FROM node:16-buster-slim

RUN apt-get update && apt-get -y dist-upgrade
RUN apt-get install -y curl

WORKDIR /src
COPY --from=build /src .
COPY . .

EXPOSE 3000
USER node
ENV HOST=0.0.0.0

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/healthcheck || exit 1

CMD ["start"]
ENTRYPOINT ["npm"]
