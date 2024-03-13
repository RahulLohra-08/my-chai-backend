import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, verifyPurchaseHistory } from "../controllers/user.controller.js";
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


//secured route: user logged in or not
router.route("/logout").post(jwtAuth, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(jwtAuth, changeCurrentPassword)
router.route("/current-user").get(jwtAuth, getCurrentUser)
router.route("/update-account").patch(jwtAuth, updateAccountDetails)
// updateUserAvatar //File
router.route("/avatar").patch(jwtAuth, upload.single("avatar"), updateUserAvatar)  //sd be login, multiple files nhi hai isliye single("avatar") ka use karenge
router.route("/cover-image").patch(jwtAuth, upload.single("coverImage"), updateUserCoverImage)
//params
router.route("/user-channel-profile/:username").get(jwtAuth, getUserChannelProfile)
router.route("/watch-history").get(jwtAuth, getWatchHistory)
router.route("/verifyPurchase").post(verifyPurchaseHistory)

export default router;