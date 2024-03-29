import { Router } from 'express';

import jwtAuth from '../middleware/auth.middleware.js';
import { getChannelStats, getChannelVideos } from '../controllers/dashboard.channel.controller.js';

const router = Router();

router.use(jwtAuth); // Apply verifyJWT middleware to all routes in this file

router.route("/stats").get(getChannelStats);
router.route("/videos").get(getChannelVideos);

export default router