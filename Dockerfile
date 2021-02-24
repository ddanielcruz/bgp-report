# Build image
FROM node:14-alpine AS build

# Create build directory
WORKDIR /usr/src/build

# Copy projects and install dependencies
COPY package.json yarn.lock ./
COPY packages/eslint-config ./packages/eslint-config
COPY packages/server ./packages/server
RUN yarn install --pure-lockfile --non-interactive

# Build server
RUN yarn build:server

# App image
FROM node:14-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy project dependencies
COPY package.json yarn.lock ./
COPY --from=build /usr/src/build/packages/server/package.json /usr/src/app/packages/server/package.json
COPY --from=build /usr/src/build/packages/server/dist /usr/src/app/packages/server/dist

# Install project production dependencies
ENV NODE_ENV production
RUN yarn install --pure-lockfile --non-interactive --production

# Start the project
WORKDIR /usr/src/app/packages/server
CMD [ "yarn", "start" ]
