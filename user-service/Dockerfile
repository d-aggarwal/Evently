FROM node:20-alpine

WORKDIR /app

COPY ./user-service/package*.json ./

RUN npm install

COPY ./user-service . 
COPY ./shared /shared

RUN npx prisma generate

EXPOSE 3001

CMD ["node", "src/index.js"]
