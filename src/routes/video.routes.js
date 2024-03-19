import { Router } from 'express'
import { deleteVideo, getAllVideos, getVideoById, publishAVideo, togglePublishStatus, updateVideo } from '../controllers/video.controller.js';
import upload from '../middleware/multer.middleware.js';
import jwtAuth from '../middleware/auth.middleware.js';

const router = Router();

router.route("/").get(getAllVideos).post(jwtAuth, upload.fields([
    {
        name: "videoFile",
        maxCount: 1,
    },
    {
        name: "thumbnail",
        maxCount: 1,
    },
]), publishAVideo)

router
    .route("/:videoId")
    .get(getVideoById)
    .patch(upload.single("thumbnail"), updateVideo)
    .delete(deleteVideo)

router.route("/toggle/publish/:videoId").patch(togglePublishStatus)

export default router;
