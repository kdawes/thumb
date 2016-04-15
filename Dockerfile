FROM node:4.3.2-slim

RUN apt-get update && \
apt-get install -y imagemagick

RUN mkdir -p /usr/src/app
RUN mkdir -p /usr/src/app/static
RUN mkdir -p /usr/src/app/db

WORKDIR /usr/src/app

ENV NODE_ENV development


COPY entrypoint.sh /usr/src/app
COPY index.js /usr/src/app
COPY package.json /usr/src/app
COPY Api.js /usr/src/app

EXPOSE 5454
CMD ["./entrypoint.sh"]
