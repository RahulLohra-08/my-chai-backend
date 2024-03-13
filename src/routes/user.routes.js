import { Router } from "express";
import { getUserChannelProfile, loginUser, logoutUser, refreshAccessToken, registerUser, verifyPurchaseHistory } from "../controllers/user.controller.js";
import upload from '../middleware/multer.middleware.js'
import jwtAuth from "../middleware/auth.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([  //as a middleware call hoga.
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)
router.route("/user-channel-profile/:username").get(getUserChannelProfile)

router.route("/verifyPurchase").post(verifyPurchaseHistory)

//secured route: user logged in or not
router.route("/logout").post(jwtAuth, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)

export default router;