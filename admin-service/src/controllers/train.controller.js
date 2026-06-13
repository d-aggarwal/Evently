import {asyncHandler} from "../utils/asyncHandler.js";
import  {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from  "../utils/ApiResponse.js";
import adminProducer from "../kafka/producer/admin.producer.js";
import {prisma} from "../utils/prisma.js";
import logger from "../utils/logger.js";

const createTrain = asyncHandler(async(req, res) =>{
     const {trainNumber, trainName, coachName, seats} = req.body;

     if(!trainNumber || !trainName || !coachName || !seats){
          throw new ApiError(400, "All fields are required: trainNumber, trainName, coachName and seats");
     }

     if(seats.length === 0){
          throw new ApiError(400, "Seats array cannot be empty");
     }

     const existing = await prisma.train.findUnique(
          { where: { trainNumber } }
     )
     if (existing) {
          throw new ApiError(409, "Train with this number already exists");
     }

     const seatNumbers = seats.map((s) => s.seatNumber);

     if (new Set(seatNumbers).size !== seatNumbers.length) {
          throw new ApiError(400, "Duplicate seat numbers found in the seats array");
     }

      const train = await prisma.train.create({
          data: {
               trainNumber,
               trainName,
               coachName: coachName || 'AC',
               totalSeats: seats.length,
               seats: {
                    create: seats.map((seat) => ({
                         seatNumber: seat.seatNumber,
                         seatType: seat.seatType,
                         price: seat.price
                    }))
               }
          },
          include: { seats: { orderBy: { seatNumber: 'asc' } } }
     })

      await adminProducer.publishTrainCreated(train).catch((err) => {
          logger.error('Failed to publish train created event', { error: err.message });
     });

     return res.status(201).json(new ApiResponse(201, train, "Train created successfully"))
})

const createRoute = asyncHandler(async(req, res) =>{
     const {trainId, stations} = req.body;
     if(!trainId || !stations){
          throw new ApiError(400, "trainId and stations are required");
     }

     if(stations.length < 2){
          throw new ApiError(400, "At least two stations are required to create a route");
     }

     const train = await prisma.train.findUnique({
          where: { id: trainId }
     });

     if (!train) {
          throw new ApiError(404, "Train not found");
     }

     const existingRoute = await prisma.route.findUnique({
          where: { trainId }
     })

     if (existingRoute) {
          throw new ApiError(409, "Route already exists for this train");
     }

     const stationIds = stations.map((station) => station.stationId);

     const existingStations = await prisma.station.findMany({
          where: { id: { in: stationIds } }
     })

     if (existingStations.length !== stationIds.length) {
          throw new ApiError(400, "One or more stationIds are invalid");
     }
     
     const sorted = [...stations].sort((a, b) => a.sequenceNumber - b.sequenceNumber);

     for (let i = 0; i < sorted.length; i++) {
          if (sorted[i].sequenceNumber !== i + 1) {
               throw new ApiError(400, "Sequence numbers must be continuous and start from 1");
          }
     }

     const route = await prisma.route.create({
          data: {
               trainId,
               routeStations: {
                    create: stations.map((s) => ({
                         stationId: s.stationId,
                         sequenceNumber: s.sequenceNumber,
                         arrivalTime: s.arrivalTime || null,
                         departureTime: s.departureTime || null,
                         distanceFromOrigin: s.distanceFromOrigin || 0,
                    }))
               }
          },
          include: {
               routeStations: {
                    include: { station: true },
                    orderBy: { sequenceNumber: 'asc' },
               },
          },
     });

     const trainWithSeats = await prisma.train.findUnique({
          where: { id: trainId },
          include: { seats: { orderBy: { seatNumber: 'asc' } } },
     });

     await adminProducer.publishRouteCreated({ ...route, train: trainWithSeats });

     return res.status(201).json(new ApiResponse(201, route, "Route created successfully"))
});

export {createTrain, createRoute};