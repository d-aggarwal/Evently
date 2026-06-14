import { Router } from "express";
import { ctrl} from "../controllers/search.controller.js";


const router = Router()

router.route("/trains").post(ctrl.searchTrains)

router.route("/autocomplete").get(ctrl.autocomplete)

export default router
