import express from "express";
import cors from "cors";
import cookieParser
from "cookie-parser";
import logger from "./utils/logger.js";
import {initIndices, recreateIndices} from "./utils/elasticsearch.js";

import {reqLogger} from "./middlewares/req.middleware.js";
import searchConsumer from "./kafka/consumer/search.consumer.js";
import {shut} from "./utils/kafka.js";

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit : "10kb"}))
app.use(express.urlencoded({extended: true, limit:"10kb"}))
app.use(express.static("public"))
app.use(cookieParser())
app.use(reqLogger)


const startServer = async () => {
     if (process.env.ES_RECREATE_INDICES === 'true') {
          await recreateIndices();
     } else {
          await initIndices();
     }
     await searchConsumer.start();

     const server = app.listen(process.env.PORT, () => {
          logger.info(`${process.env.SERVICE_NAME} running on http://localhost:${process.env.PORT}`);
     });

     const shutdown = async () => {
          logger.info('Shutting down...');
          server.close(async () => {
               await shut();
               process.exit(0);
          });
     };
     process.on('SIGTERM', shutdown);
     process.on('SIGINT', shutdown);
};

export { startServer };

//routes import 
// import userRouter from './routes/user.routes.js'




// app.use("/users", userRouter)


export default app