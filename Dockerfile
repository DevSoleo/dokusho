FROM node:lts-slim

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

ENV MONGO_DB_HOST "localhost"
ENV MONGO_DB_TIMEOUT "2000"

CMD [ "npm", "start" ]
