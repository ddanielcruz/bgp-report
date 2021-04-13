#!/usr/bin/env sh
docker image pull mongo
docker container run -d --name mongo \
  -e MONGO_INITDB_ROOT_USERNAME=docker \
  -e MONGO_INITDB_ROOT_PASSWORD=docker \
  -p 27017:27017 \
  mongo:latest
