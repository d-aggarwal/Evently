FROM node:20-alpine

WORKDIR /app

COPY ./search-service/package*.json ./

RUN npm install

COPY ./search-service . 
COPY ./shared /shared

EXPOSE 3003

CMD ["node", "src/index.js"]
