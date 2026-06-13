import { Router } from "express";
import {
    createStation,
} from "../controllers/station.controller.js";
// import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();


//secured routes
//need to be admin to access these routes, yet to implement role based access control
router.route("/station").post(createStation);


export default router;
