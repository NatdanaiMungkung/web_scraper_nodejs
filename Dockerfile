# Use an official Node runtime as the base image
FROM node:18

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application's source code
COPY . .

# Make your script executable
RUN chmod +x fetch.js

# Use node to run your script
ENTRYPOINT ["node", "fetch.js"]