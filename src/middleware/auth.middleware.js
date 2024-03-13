//user hai ya nhi ye check karega ye middleware.

import jwt  from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/user.model.js";

const jwtAuth = asyncHandler( async(req, _, next) => {  //yanha res ka use nhi ho raha hai isliye underscore laga denge: professional standard
    try {

        console.log("incomingCookies: ===========> ", req.cookies?.accessToken);

        const incomingRefreshToken =  req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "") // bearer space ko ek empty string me replace karke baki ka jo code hai use nikal lenge
    
        if (!incomingRefreshToken) {
            throw new ApiError(401, "Unauthorized request")
        }

        console.log("incomingRefreshToken: ", incomingRefreshToken)
    
        //decode the token or verify the token 
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.ACCESS_TOKEN_SECRET);

        console.log("decodedToken: ", decodedToken)

    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")  //user.model me access token generate kar rahe hai to usme _id payload me de rahe vahi se udha rahe hai.
    
        if(!user) {
            //NEXT VIDEO: discussion about frontend.
            throw new ApiError(401, "Invalid Access Token")
        }

        //request ke andar hum  user add kar denge. 
    
        req.user = user;  //add user: Ab ye user globally use kar sakte hai janha kanhi bhi ye middleware use hoage req se user nikal sakte hai.
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access token")
    }

})


export default jwtAuth;


// if you are not using try catch then select the code and direct write trycatch and hit enter automatically all code inside the try catch block. 