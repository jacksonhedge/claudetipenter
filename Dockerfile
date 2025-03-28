FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3000

# Start the application
CMD [ "node", "server-proxy.js" ]
