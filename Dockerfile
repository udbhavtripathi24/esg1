# The web app as a static site served by nginx (unprivileged, port 8080).
# The API address is fixed at build time:
#   docker build --build-arg VITE_API_BASE_URL=https://api.example.com/api/v1 -t vista-web .
FROM node:22-alpine AS build
WORKDIR /web
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG VITE_API_BASE_URL=http://localhost:8000/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /web/dist /usr/share/nginx/html
# nginx's own entrypoint fills ${API_ORIGIN} into the template at start-up.
ENV API_ORIGIN=http://localhost:8000
EXPOSE 8080
