import pkg from "@prisma/client";

const { PrismaClient, SeatType } = pkg;
const prisma = new PrismaClient();

const stations = [
  { name: "New Delhi", code: "NDLS", city: "Delhi", state: "Delhi" },
  { name: "Bathinda Junction", code: "BTI", city: "Bathinda", state: "Punjab" },
  { name: "Amritsar Junction", code: "ASR", city: "Amritsar", state: "Punjab" },
  { name: "Lucknow NR", code: "LKO", city: "Lucknow", state: "UP" },
  { name: "Kanpur Central", code: "CNB", city: "Kanpur", state: "UP" },
  { name: "Bhopal Junction", code: "BPL", city: "Bhopal", state: "MP" },
  { name: "Mumbai Central", code: "MMCT", city: "Mumbai", state: "Maharashtra" },
  { name: "Pune Junction", code: "PUNE", city: "Pune", state: "Maharashtra" },
  { name: "Ahmedabad Junction", code: "ADI", city: "Ahmedabad", state: "Gujarat" },
  { name: "Jaipur Junction", code: "JP", city: "Jaipur", state: "Rajasthan" }
];

async function main() {
  console.log("Creating stations...");

  for (const station of stations) {
    await prisma.station.upsert({
      where: { code: station.code },
      update: {},
      create: station,
    });
  }

  const dbStations = await prisma.station.findMany();

  console.log("Creating trains...");

  for (let i = 1; i <= 20; i++) {
    const train = await prisma.train.create({
      data: {
        trainNumber: `12${String(i).padStart(3, "0")}`,
        trainName: `Evently Express ${i}`,
        coachName: "AC",
        totalSeats: 10,
      },
    });

    // seats
    await prisma.seat.createMany({
      data: Array.from({ length: 10 }, (_, idx) => ({
        trainId: train.id,
        seatNumber: idx + 1,
        seatType:
          idx % 5 === 0
            ? SeatType.LOWER
            : idx % 5 === 1
            ? SeatType.MIDDLE
            : idx % 5 === 2
            ? SeatType.UPPER
            : idx % 5 === 3
            ? SeatType.SIDE_LOWER
            : SeatType.SIDE_UPPER,
        price: 500 + idx * 50,
      })),
    });

    const route = await prisma.route.create({
      data: {
        trainId: train.id,
      },
    });

    const selectedStations = [
      dbStations[(i + 0) % dbStations.length],
      dbStations[(i + 1) % dbStations.length],
      dbStations[(i + 2) % dbStations.length],
      dbStations[(i + 3) % dbStations.length],
      dbStations[(i + 4) % dbStations.length],
    ];

    await prisma.routeStation.createMany({
      data: selectedStations.map((station, index) => ({
        routeId: route.id,
        stationId: station.id,
        sequenceNumber: index + 1,
        arrivalTime:
          index === 0 ? null : `${6 + index}:00`,
        departureTime:
          index === selectedStations.length - 1
            ? null
            : `${6 + index}:10`,
        distanceFromOrigin: index * 120,
      })),
    });

    for (let d = 0; d < 30; d++) {
      const departureDate = new Date();
      departureDate.setDate(departureDate.getDate() + d);

      await prisma.schedule.create({
        data: {
          trainId: train.id,
          departureDate,
        },
      });
    }
  }

  console.log("Seed completed");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
  