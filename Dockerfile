FROM node:16

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install
# RUN npm ci --only=production

COPY . .

EXPOSE 3000

ENV PORT 3000
ENV MONGO_DB_HOST "localhost"

CMD [ "node", "app.js" ]