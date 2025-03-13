# Use Node.js LTS version
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Copy app source code
COPY . .

# Expose the port from your env file
EXPOSE 8000

# Start the application (adjust the entry point file if needed)
CMD ["node", "app.js"]