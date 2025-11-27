FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN yarn install

# Copy source code
COPY . .

# Build the application
RUN yarn run build

EXPOSE 8080

# Use Vite preview to serve the built files
CMD ["yarn", "preview", "--host", "0.0.0.0", "--port", "8080"]
