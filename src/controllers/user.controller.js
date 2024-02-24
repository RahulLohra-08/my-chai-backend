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

//Generate access and refesh token here

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();  //isse user ko de dete hai
        const refreshToken = user.generateRefreshToken();  // isse user ko return karte h or database me  bhi store kar dete hai taki access token expired hone per isse user fhir se access token se sake check karke.

        user.refreshToken = refreshToken;  //refresh token save in data base.

        await user.save({validateBeforeSave: false})  // validate before save false islye kia qki password field required hai or yanha validate check karne ki koi need nhi hai.

        return { accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token.")
    }
}


//---------------------------Register controller--------------------------------------------//
const registerUser = asyncHandler(async (req, res) => {
    console.log("files =====> ", req.files)

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
    if (!validateEmail(email)) {
        throw new ApiError(400, "Invalid email format");
    }

    if (!validatePassword(password)) {
        throw new ApiError(400, "Password must be at least 4 characters long");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }],//$(dolar) ka use karke multiple value ko check kar sakte hai.
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }


    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path; // if file is empty send then its throw undefined ( reading 0 ) error:

    //for handling undefined ( reading 0 );
    let coverImageLocalPath;

    // Array.isArray ke andar coverImage hai yani array hai. to
    if (req.files && Array.isArray(req.files?.coverImage) && req.files?.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

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

//------------------------Login controller--------------------------------------------------//
const loginUser = asyncHandler( async ( req, res) => {
    //Algorithm for login
    //1. taking login data from frontend // req body ===> data
    //2. taking username or email and password
    //3. find user already exits or not
    //4. user has not existed throw an error
    //5. password check
    //6. after password check generate access and refresh token
    //7. send cookie securely
    //8. return response 

    const { email, username, password } = req.body;

    if (!eamil || !username) {
        throw new ApiError(404, "username or email is required")
    }

    //iss user ke pass sere methods honge User model ka. To ham user se isPassword nikal password check karenge
    const user = await User.findOne({
        $or: [{username}, {email}] //dono me khuch bhi ho uska data return kar dega
    })

    if (!user) {
        throw new ApiError(404, "User does not exists")
    }

    //check password : user.model me hamne method banya hai check karne ke lia hum uska use karenge.
    const isPasswordValid = await user.isPasswordCorrect(password);   //req.password ko compare karega backend me jo password store ho gaya hai usse.

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credential")
    }

    //generate access and refresh toekn
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    //again data base se User ko find kar lia taki asani ho logged user ko manage karna.
    const loggedUser = await User.findById(user._id).select("-password -refreshToken") // jo chej hame response nhi karna hai use unselect kar denge. qki by default sabhi select hoata h

    //send cookies
    const options = {
        httpOnly: true,  // frontend se modifiable nhi hoati keval cookie ko server se modified kar sakte hai isliye httpOnly: true or secure: true kia hia.
        secure: true,
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)  //send cookie securely
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {user: loggedUser, accessToken, refreshToken},
            "User logged In Successfully"
        )
    )
})

//------------------------Logout controller--------------------------------------------------//
const logoutUser = asyncHandler(async(req, res) => {
    //findByIdAndUpdate method ka use kar rahe taki token sab khud se refresh na karna pade
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { // dollar set laga kar hum data ko update kar sakte hai, 
                refreshToken: undefined, // logout hone per refreshToken undefined ho jaiga
            },
        },
        {
            new: true, // new value add kar dega 
        }
    )

     //send clear cookie
     const options = {
        httpOnly: true,  // frontend se modifiable nhi hoati keval cookie ko server se modified kar sakte hai isliye httpOnly: true or secure: true kia hia.
        secure: true,
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)   // clear cookie after logout
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"))
})

//----------------------------------Change password controller--------------------------------------------------//
const changeCurrentPassword = asyncHandler( async(req, res) => {
   //get oldPassword and newPassword from frontend
   const { oldPassword, newPassword } = req.body;

   //find logged user
   const user = await User.findById(req.user._id)

   //check old password is correct or not 
   //match old password from database password.
   const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

   if (!isPasswordCorrect) {
        throw new ApiError(404, "Invalid old password")
   }

   //assign the new password inside the user's model password
   user.password = newPassword;

   //Now update the User model password only;
   await user.save({validation: false}) //validation: false aisa isliye lika qki mai baki ke validation run nhi karna chahta hu.
   
   return res
   .status(200)
   .json(
    new ApiResponse(200, {}, "Password change successfully")
   )
})

//----------------------------------getCurrent user controller--------------------------------------------------//
const getCurrentUser = asyncHandler( async(req, res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(200, req.user, "Current user fetched successfully")
    )
})

//----------------------------------Update account details controller--------------------------------------------------//
const updateAccountDetails = asyncHandler( async(req, res) => {
    //I only want to update the full name and email. I dont want to update username

    const { fullName, email } = req.body;

    if (!fullName || !email) {
       throw new ApiError(404, "All Fields required")
    }

    //find current user and update user details.
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{ 
                fullName,
                email: email
            } //$set ek object receive karta hai. or which one we want to updated, write that field here.
        }, 
        {
            new: true //new: true: Means update hone ke baad jo value hain vo hame return hote hai. 
        } 
    ).select("-password")  // mai nhi chahta ki password field return ho.

    //now save the update details and store the db
    
    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Account details updated successfully")
    )
})

//----------------------------------change avatar controller--------------------------------------------------//
const updateUserAvatar = asyncHandler ( async(req, res) => {
    const avatarLocalPath = req.file?.path; // file: <----------file lia qki hume hi file chaiye

    if (!avatarLocalPath) {
        throw new ApiError(404, "Avatar file is missing")
    }

    //upload current avatar on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);

    //check avatar url available or not
    if (!avatar.url) {
        throw new ApiError(404, "Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url,
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar updated successfully")
    )
})

//----------------------------------change avatar controller--------------------------------------------------//
const updateUserCoverImage = asyncHandler ( async(req, res) => {
    const coverImageLocalPath = req.file?.path; // file: <----------file lia qki hume hi file chaiye

    if (!coverImageLocalPath) {
        throw new ApiError(404, "Cover Image file is missing")
    }

    //upload current avatar on cloudinary
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    //check avatar url available or not
    if (!coverImage.url) {
        throw new ApiError(404, "Error while uploading on coverImage")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover Image updated successfully")
    )
})

export { 
    registerUser,
    loginUser,
    logoutUser,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
}