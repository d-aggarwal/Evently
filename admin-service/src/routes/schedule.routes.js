import { Router } from "express";
import {createSchedule} from "../controllers/schedule.controller.js";
// import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();


//secured routes
//need to be admin to access these routes, yet to implement role based access control
router.route("/schedule").post(createSchedule);


export default router;
