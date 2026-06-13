import {asyncHandler} from "../utils/asyncHandler.js";
import  {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from  "../utils/ApiResponse.js";
import adminProducer from "../kafka/producer/admin.producer.js";
import {prisma} from "../utils/prisma.js";
import logger from "../utils/logger.js";

const createSchedule = asyncHandler(async(req, res) =>{
     const {trainId, departureDate} = req.body;

     if(!trainId || !departureDate){
          throw new ApiError(400, "trainId and departureDate are required");
     }

     const train = await prisma.train.findUnique({
          where: { id: trainId },
          include: {
               seats: { orderBy: { seatNumber: 'asc' } },
               route: {
                    include: {
                         routeStations: {
                              include: { station: true },
                              orderBy: { sequenceNumber: 'asc' },
                         },
                    },
               },
          },
     });

      if (!train) throw new ApiError(404, "Train not found");
      if (!train.route) throw new ApiError(400, "Train has no route defined.");
      if (train.seats.length === 0) throw new ApiError(400, "Train has no seats defined. Please create seats before creating a schedule.");

      const parsedDate = new Date(departureDate);
      if (isNaN(parsedDate.getTime())) {
          throw new ApiError(400, 'Invalid departure date format. Use YYYY-MM-DD');
      }

      const schedule = await prisma.schedule.create({
          data: { trainId, departureDate: parsedDate },
     });


     const eventPayload = {
          scheduleId: schedule.id,
          trainId: train.id,
          trainNumber: train.trainNumber,
          trainName: train.trainName,
          coachName: train.coachName,
          totalSeats: train.totalSeats,
          departureDate: departureDate,
          status: schedule.status,
          seats: train.seats.map((s) => ({
               seatId: s.id,
               seatNumber: s.seatNumber,
               seatType: s.seatType,
               price: s.price,
          })),
          route: train.route.routeStations.map((rs) => ({
               stationId: rs.station.id,
               stationName: rs.station.name,
               stationCode: rs.station.code,
               city: rs.station.city,
               sequenceNumber: rs.sequenceNumber,
               arrivalTime: rs.arrivalTime,
               departureTime: rs.departureTime,
               distanceFromOrigin: rs.distanceFromOrigin,
          })),
     };

     await adminProducer.publishScheduleCreated(eventPayload);
     logger.info(`Schedule created and event published for train ${train.trainNumber} on ${departureDate}`);

     return res.status(201).json(new ApiResponse(201, schedule, "Schedule created successfully"));
})

export {createSchedule};
