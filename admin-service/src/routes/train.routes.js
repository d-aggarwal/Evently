import { Router } from "express";
import {createTrain} from "../controllers/train.controller.js";
// import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();


//secured routes
//need to be admin to access these routes, yet to implement role based access control
router.route("/train").post(createTrain);


export default router;
