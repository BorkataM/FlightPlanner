# FlightPlanner React/Vite client — built to static assets, served by nginx
FROM node:20-alpine AS build
WORKDIR /app

# Vite bakes these in at build time. Empty => the app uses relative
# /api and /ai paths, which nginx proxies to the API and AI service.
ARG VITE_API_URL=""
ARG VITE_AI_URL=""
ENV VITE_API_URL=$VITE_API_URL \
    VITE_AI_URL=$VITE_AI_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
