#syntax=docker/dockerfile:1.4
# Run this from within this directory. Change the location of coriolis-data repo and image name/tag as needed.
# docker buildx build --build-context data=../coriolis-data --tag coriolis .

FROM node:25-alpine

# TODO: For a production build, we may want to just build the bundle and copy that in. No need for local copy of source.
WORKDIR /app
ADD . .
COPY --from=data . /coriolis-data/

# Git is required before install if any modules (like coriolis-data) are loaded from github
RUN apk update
RUN apk add git

WORKDIR /app/coriolis-data
RUN npm install --legacy-peer-deps
WORKDIR /app
RUN npm install --legacy-peer-deps
# Bundle for production config with webpack & log
RUN npm run build --legacy-peer-deps > >(tee -a stdout.log) 2> >(tee -a stderr.log >&2)

# Optimally, this will start a static asset server like nginx/apache. Currently, this will start dev webpack server.
CMD ["npm", "start"]
EXPOSE 3300
