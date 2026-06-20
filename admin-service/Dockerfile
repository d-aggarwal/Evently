FROM node:20-alpine

WORKDIR /app

COPY ./admin-service/package*.json ./

RUN npm install

COPY ./admin-service . 
COPY ./shared /shared

RUN npx prisma generate

EXPOSE 3002

CMD ["node", "src/index.js"]
