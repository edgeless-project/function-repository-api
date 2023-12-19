FROM node:20.5-slim as api-builder

RUN mkdir -p /usr/src/api
WORKDIR /usr/src/api

COPY ./package.json .
COPY ./package-lock.json .
COPY ./tsconfig.json .
COPY ./tsconfig.build.json .
COPY ./nest-cli.json .
COPY ./tslint.json .
COPY ./src ./src

RUN npm install 
RUN npm run package:prod

FROM node:20.5-slim

RUN apt-get update && apt-get install -y net-tools iproute2

RUN mkdir -p /usr/src/server
WORKDIR /usr/src/server

COPY --from=api-builder /usr/src/api/dist ./dist
COPY --from=api-builder /usr/src/api/package.json .
COPY --from=api-builder /usr/src/api/node_modules ./node_modules

COPY ./.env.docker .

EXPOSE 3000

COPY entrypoint.sh entrypoint.sh
RUN chmod +x entrypoint.sh 

CMD ["/usr/src/server/entrypoint.sh"]