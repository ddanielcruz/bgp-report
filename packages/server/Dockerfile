FROM node:14-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN yarn && yarn cache clean

# Set environment variables
ENV NODE_ENV=production

# Bundle app source and build the application
COPY . .
RUN yarn build

CMD [ "yarn", "start" ]
