import express from "express";
import cors from "cors";
import cookieParser
from "cookie-parser";
import logger from "./utils/logger.js";


import {reqLogger} from "./middlewares/req.middleware.js"
import { disconnectProducer } from "./utils/kafka.js";

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
app.use((req, res, next) => {
     logger.info(`${req.method} ${req.path}`, {
          ip: req.ip,
          userAgent: req.get('user-agent')
     });
     next();
});

//routes import 
// import userRouter from './routes/user.routes.js'
import stationRouter from './routes/station.routes.js'
import trainRouter from './routes/train.routes.js'
import ScheduleRouter from './routes/schedule.routes.js'



// app.use("/users", userRouter)
app.use("/admin/stations", stationRouter)
app.use("/admin/trains", trainRouter)
app.use("/admin/schedules", ScheduleRouter)

export default app
