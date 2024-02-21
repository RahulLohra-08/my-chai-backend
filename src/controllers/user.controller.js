import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../utils/ApiError.js'
import User  from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/CloudinaryService.js'
import { ApiResponse } from "../utils/ApiResponse.js";

//Higher order function ke andar ek function call ho raha hai.

// Validate email
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validate password
const validatePassword = (password) => {
    // Password must be at least 8 characters long
    return password.length >= 4;
};

const registerUser = asyncHandler(async (req, res) => {
    // logic building code steps:-
    //1. get user details from frontend
    //2. validation - not empty
    //3. check user already exist: username, email
    //4. check images, for avatar: file handling lia code router me likhenge as a middleware.
    //5. upload them to cloudinary, avatar
    //6. create user object - create entry in db
    //7. remove password and refresh token field from response
    //8. return response

    const { fullName, username, email, password } = req.body;

    // if (username === "") throw new ApiError(400, "All fields are required")

    //2. write advance code for checking not empty.
    if ([fullName, email, username, password].some((field) => field?.trim === "")) { //field ko trim karke nikal lia or check karene ye empty hai ki nhi.
        throw new ApiError(400, "All field required")
    }
    // if (!validateEmail(email)) {
    //     throw new ApiError(400, "Invalid email format");
    // }

    // if (!validatePassword(password)) {
    //     throw new ApiError(400, "Password must be at least 8 characters long");
    // }

    const existedUser = User.findOne({
        $or: [{ username }, { email }],//$(dolar) ka use karke multiple value ko check kar sakte hai.
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    console.log("multer se file aaaya ki nhi =====> ", req.files, "\n ", req.files?.avatar[0]?.path)

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }
     
    const avatar = await uploadOnCloudinary(avatarLocalPath);  //file upload on cloudinary.
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    //save on db
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken"); // select function sabhi select hote hai by default, humhe jo field nhi chaiye use string me pass kardenge negative sign laga ke. 

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully...!")
    )

})

export { registerUser, }