import {asyncHandler} from "../utils/asyncHandler.js";
import  {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from  "../utils/ApiResponse.js";
import adminProducer from "../kafka/producer/admin.producer.js";
import {prisma} from "../utils/prisma.js";
import logger from "../utils/logger.js";

const createStation = asyncHandler(async (req, res) => {
     const { name, code, city, state } = req.body;

     if (!name || !code || !city || !state) {
          throw new ApiError(400, "All fields are required: name, code, city, state");
     }

     const existingStation = await prisma.station.findUnique({
          where: { code },
     });

     if (existingStation) {
          throw new ApiError(409, "Station with this code already exists");
     }

     const station = await prisma.station.create({
          data: { name, code, city, state },
     });

     logger.info(`Station created: ${station.name} (${station.code}) in ${station.city}, ${station.state}`);

     await adminProducer.publishStationCreated(station).catch((error) => {
          logger.error(`Failed to publish station created event for ${station.code}`, {
               error: error.message,
               stack: error.stack,
          });
     });

     return res.status(201).json(new ApiResponse(201, station, "Station created successfully"))
})

export { createStation };
