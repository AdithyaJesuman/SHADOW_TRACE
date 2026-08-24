# Frontend Dockerfile
# This builds and serves the React app using Node.js inside a container.
# 
# HOW THIS WORKS:
# Stage 1 (builder): Uses Node to install dependencies and build the React app.
# Stage 2 (serve):   Uses a tiny nginx image to serve the built files.
#                    This keeps the final image small (~25MB vs 1GB).
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first so Docker can cache the npm install step.
# If you don't change package.json, Docker will reuse the cached layer 
# and skip re-downloading all packages — much faster rebuilds.
COPY package*.json ./
RUN npm install

# Copy all source files and build the React app
COPY . .
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
