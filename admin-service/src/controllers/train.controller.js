import {asyncHandler} from "../utils/asyncHandler.js";
import  {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from  "../utils/ApiResponse.js";
import adminProducer from "../kafka/producer/admin.producer.js";
import {prisma} from "../utils/prisma.js";
import logger from "../utils/logger.js";

const createTrain = asyncHandler(async(req, res) =>{
     const {trainNumber, trainName, coachName} = req.body;

     if(!trainNumber || !trainName || !coachName){
          throw new ApiError(400, "All fields are required: trainNumber, trainName, coachName");
     }

    //  if(seats.length === 0){
    //       throw new ApiError(400, "Seats array cannot be empty");
    //  }

     const existing = await prisma.train.findUnique(
          { where: { trainNumber } }
     )
     if (existing) {
          throw new ApiError(409, "Train with this number already exists");
     }

    //  const seatNumbers = seats.map((s) => s.seatNumber);

    //  if (new Set(seatNumbers).size !== seatNumbers.length) {
    //       throw new ApiError(400, "Duplicate seat numbers found in the seats array");
    //  }

      const train = await prisma.train.create({
          data: {
               trainNumber,
               trainName,
               coachName: coachName || 'AC',
            //    totalSeats: seats.length,
            //    seats: {
            //         create: seats.map((seat) => ({
            //              seatNumber: seat.seatNumber,
            //              seatType: seat.seatType,
            //              price: seat.price
            //         }))
            //    }
          },
          include: { seats: { orderBy: { seatNumber: 'asc' } } }
     })

      await adminProducer.publishTrainCreated(train).catch((err) => {
          logger.error('Failed to publish train created event', { error: err.message });
     });

     return res.status(201).json(new ApiResponse(201, train, "Train created successfully"))
})

// const createRoute = asyncHandler(async(req, res) =>{
//      const {trainId, stations} = req.body;
//      if(!trainId || !stations){
//           throw new BadRequestError("Train Id and stations are required");
//      }

//      if(stations.length < 2){
//           throw new BadRequestError("A route must have at least 2 stations (origin and destination)");
//      }

//      const route = await trainService.createRoute({trainId, stations});
//      return res.status(201).json({
//           success: true,
//           message: "Route Created",
//           data: route
//      });
// });
export {createTrain};