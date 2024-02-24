import { Router } from "express";
import { loginUser, registerUser } from "../controllers/user.controller.js";
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

router.route("/logout").post(jwtAuth, loginUser)

export default router;