# Build image
FROM node:14-alpine AS build

# Create build directory
WORKDIR /usr/src/build

# Copy projects and install dependencies
COPY . .
RUN yarn install --pure-lockfile --non-interactive

# Build server
RUN yarn build

# App image
FROM node:14-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy project dependencies
COPY package.json yarn.lock ./
COPY --from=build /usr/src/build/package.json /usr/src/app/package.json
COPY --from=build /usr/src/build/dist /usr/src/app/dist

# Install project production dependencies
ENV NODE_ENV production
RUN yarn install --pure-lockfile --non-interactive --production

# Start the project
WORKDIR /usr/src/app
CMD [ "yarn", "start" ]
