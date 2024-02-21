import { asyncHandler } from "../utils/asyncHandler.js";

//Higher order function ke andar ek function call ho raha hai.
const registerUser = asyncHandler( async (req, res) => {
    res.status(200).json({
        message: "Ok"
    })
})

export { registerUser, }