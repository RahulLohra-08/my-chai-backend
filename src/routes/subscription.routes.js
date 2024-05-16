import { Router } from "express";
import jwtAuth from '../middleware/auth.middleware.js';
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controller.js";

const router = Router();
router.use(jwtAuth) // Apply verifyJWT middleware to all routes in this file

router
    .route("/channel/:channelId")
    .get(getUserChannelSubscribers)
    .post(toggleSubscription)

router.route("/user/:subscriberId").get(getSubscribedChannels)

export default router;