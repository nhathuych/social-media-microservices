# Use the official node.js 22 image with alpine linux as the base image
FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./

# Install only production dependencies based on the exact versions in package-lock.json
# This ensures a clean and reliable install, ideal for production environments
RUN npm ci --only=production

COPY . .

EXPOSE 3002

CMD ["node", "src/server.js"]
