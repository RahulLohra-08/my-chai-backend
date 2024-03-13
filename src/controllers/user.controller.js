import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../utils/ApiError.js'
import User from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/CloudinaryService.js'
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
// Example Android verification using Google Play Developer API
import { google } from 'googleapis';
import mongoose from "mongoose";

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

        await user.save({ validateBeforeSave: false })  // validate before save false islye kia qki password field required hai or yanha validate check karne ki koi need nhi hai.

        return { accessToken, refreshToken }

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
const loginUser = asyncHandler(async (req, res) => {
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

    if (!(email || username)) {
        throw new ApiError(404, "username or email is required")
    }

    //iss user ke pass sere methods honge User model ka. To ham user se isPassword nikal password check karenge
    const user = await User.findOne({
        $or: [{ username }, { email }] //dono me khuch bhi ho uska data return kar dega
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
                { user: loggedUser, accessToken, refreshToken },
                "User logged In Successfully"
            )
        )
})

//------------------------Logout controller--------------------------------------------------//
const logoutUser = asyncHandler(async (req, res) => {
    try {
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
    } catch (error) {
        throw new ApiError(500, "Internal server error")
    }
})


//------------------------RefreshToken controller--------------------------------------------------//
const refreshAccessToken = asyncHandler(async (req, res) => {


    try {
        const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

        if (!incomingRefreshToken) {
            throw new ApiError(401, "unauthorize refreshToken")
        }

        //decoded incoming refresh token and verify
        const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        // line 31 to 33 me refresh token ko save karya hai.
        //database se refreshToken nikal lenge or match karenge. IncomingRefresh Token or data base ke refresh token ko. Same hua to refreshToken se user login rahega.
        const user = await User.findById(decoded._id) //_id User model se aa raha janha se humne generatek kia hai.

        if (!user) {
            throw new ApiError(401, "Invalid refreshToken")
        }

        console.log("Users ===============> ", user)


        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "RefreshToken is expired or used...!")
        }

        //ab agar refresh token expired or used ho gaya hai, To hum ab new refreshToken or access token generate karenge


        const { accessToken, newRefreshToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

        console.log("accessToken ===============> ", accessToken)
        console.log("newRefreshToken ===============> ", refreshToken)

        const options = {
            httpOnly: true,
            secure: true
        }

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)   // clear cookie after logout
            .cookie("refreshToken", refreshToken, options)
            .json(new ApiResponse(200, { accessToken, refreshToken }, "Access Token Refreshed"))

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token")
    }
})

//----------------------------------Change password controller--------------------------------------------------//
const changeCurrentPassword = asyncHandler(async (req, res) => {
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
    await user.save({ validation: false }) //validation: false aisa isliye lika qki mai baki ke validation run nhi karna chahta hu.

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Password change successfully")
        )
})

//----------------------------------getCurrent user controller--------------------------------------------------//
const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(200, req.user, "Current user fetched successfully")
        )
})

//----------------------------------Update account details controller--------------------------------------------------//
const updateAccountDetails = asyncHandler(async (req, res) => {
    //I only want to update the full name and email. I dont want to update username

    const { fullName, email } = req.body;

    if (!(fullName || email)) {
        throw new ApiError(404, "All Fields required")
    }

    //find current user and update user details.
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
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
const updateUserAvatar = asyncHandler(async (req, res) => {
    try {
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
                $set: {
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
    } catch (error) {
        throw new ApiError(500, "Internal server error")
    }
})

//----------------------------------change avatar controller--------------------------------------------------//
const updateUserCoverImage = asyncHandler(async (req, res) => {
    try {
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
    } catch (error) {
        throw new ApiError(500, "Internal server error")
    }
})

//Using aggregation pipelin
//----------------------------------User channel Profile controller--------------------------------------------------//

const getUserChannelProfile = asyncHandler(async (req, res) => {

    try {
        const { username } = req.params;
    
        if (!username) {
            throw new ApiError(401, "Username is missing")
        }
    
        //Aggregation pipe line array return karta hai: 
        const channel = await User.aggregate([
            { //1st pipeline: is document/user ke adhar per hum karenge lookup
                $match: {
                    username: username?.toLowerCase(), // iss name ka jo bhi user hoga usse return kar dega.
                }
            },
            {//lookup stage: For total Subsirbers// Mughe kitne logo ne subscribe kia hai,
                $lookup: { // lookup ka use data ko merge/join "Left outer join" karne ke lia use karte hai.
                    from: "subscriptions", //kanha se lena hai usse modal ka name likhenge: Note: Modal me sari cheje lowercase me convert ho jati hai model ka name or last me "s" lag jata hai.
                    localField: "_id", //current moda, yani User modal ka _id<-------------means localField hai.
                    foreignField: "channel", //foreign key/foreignField, subscription modal ke chanel ko foriegn key banaye dia, isse hame total subscriber milenge.
                    as: "subscribers"// as using for name: Ye ek Field hai/coulmn name<---- is pure data subscriber name ke array me store ho jaiga. // Total subsriber mil jainge.
                }
            },
            { // 2nd lookup for: Maine kitne logo ko subscribe kia hai,
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "subscriber",
                    as: "subscribedTo"
                }
            },
            { //AddFields: ye upper ki sari value ko to rakhega sath hi sath additional value bhi add kar dega isilye iss use karte hai. taki ek hi object me sara data bhej de.
                $addFields: {
                    subscribersCount: { //Total subscriber kitne hai, uska count additionally add karenge.
                        $size: "$subscribers"  //<------chunki subscriptions ek field hai jise hum upper liey hai isliye iske phale Dolar"$" ka sign lagaye hai. iss field ka total count return kar dega.
                    },
                    channelsSubscribedToCount: { //Total channel jise maine subscribe kia hai.
                        $size: "$subscribedTo"
                    },
                    isSubscribed: { // condition me 3 me paramerter hote hai, janha condition likhte hai, or then janha true, or else false value likehte hia.
                        $cond: { //in operator array or object dono ko calculate kar deta hai.: Agar app already logged in honge to req.user._id hoga.
                            if: { $in: [req.user?._id, "$subscribers.subscriber"] }, // $subscribers ye ek field hai ilsiye iske andar jaya ja sakta hai.
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                $project: {  // ye basically selected value/data dene ke lia use karte hai, sari value nhi deta hai.
                    fullName: 1, //<-----------1 means Flag: matlab isse add kar dijia
                    username: 1,
                    subscribersCount: 1,
                    channelsSubscribedToCount: 1,
                    isSubscribed: 1,
                    avatar: 1,
                    coverImage: 1,
                    email: 1,
                }
            }
        ])
    
        //aggregate array return karta hai.
    
        if (!channel?.length) {
            throw new ApiError(401, "Channel does not exists")
        }
    
        return res
            .status(200)
            .json(
                new ApiResponse(200, channel[0], "User Channel Fetched successfully")
            )
    } catch (error) {
        throw new ApiError(500, "Internal server error")
    }
})

//----------------------------------Watch history controller--------------------------------------------------//
//Sub pipe lines
//Agregation pipe line me mongoose kaam nhi karti hai. mean vanha req.user._id <------------ye kaam nhi karegi iss hamhe convert karna padega objectId("") me.

const getWatchHistory = asyncHandler(async (req, res) => {
    // req.user._id <--------------aisa karne se direct id mil jati hai sabhi me. But Note: agregate Pipe line id aise nhi milti hai, isse convert karna padta hai mongo db id me.
    //Agregate pipeline ek array return karta hai.
    try {
        const user = await User.aggregate([
            {   //id se user ko match karenge.
                $match: { //agregate me moongoose kaam nhi karti hai Id convert karni padegi objectId me: Moongoose hame ye option deta hai objectId banne ka jisse new keyword se banya jata hai.
                    _id: new mongoose.Types.ObjectId(req.user._id), //yanha hamara document id match ho jaiga objectid ke sath me. 
                }
            },
            {
                $lookup: {
                    from: "videos", // join kar rahe hai. Video model se, databse ye videos name se save hota hai isliye small latter se staert or Last me "s" lagaye hai.
                    localField: "watchHistory",
                    foreignField: "_id",
                    as: "watchHistory",
                    pipeline: [  //1. sub pipe line <----------after above lookup ab humlog Video Modal me hai, ab video model ka jo owner hai usse user model se lookup karana hoaga.
                        {
                            $lookup: {
                                from: "users", //ab issme user ki sari data aa jaigi, but hame sabhi field nhi chaiye hum khuch field chaiye, or vo bhi issi lookup me to further hum or ek pipe line lagayenge. selected field return karne ke lia.
                                localField: "owner",
                                foreignField: "_id",
                                as: "owner",
                                pipeline: [ //2. sub pipe line //owner field ke andar bus itne field honge. fullName, userName, or avatar.
                                    {
                                        $project: {
                                            fullName: 1,
                                            username: 1,
                                            avatar: 1,
                                        }
                                    }
                                ]
                            }
                        },
                        { //Frontend ke sahuliyat ke lia, usse loop run karke owner ki value return na karna pade isliye hum owner field ke data ko directly return kar denge.
                            $addFields: {
                                owner: { // khuch bhi name de sakte owner ki jagah me, hmne owner rakha hia.
                                    $first: "$owner", // <-------- owner localField hai, Ab frontend developer directly owner ka data Dot laga kar access kar sakta hai.
                                    //$first or ArrayElementAt: karke nikal sakte hai, Ye first value return kar dega.
                                }
                            }
                        }
                    ]
                },
            },
        ])
        
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    user[0].watchHistory,
                    "Watched history fetched successfully"
                )
            )
    } catch (error) {
        throw new ApiError(500, "Internal server error")
    }
})

const verifyPurchaseHistory = asyncHandler(async (req, res) => {
    const { productID, purchaseToken } = req.body;

    try {
        const auth = await google.auth.getClient({
            scopes: ['https://www.googleapis.com/auth/androidpublisher.androidmarket.purchase'],
        });

        const service = google.androidpublisher({ version: 'v3', auth });

        const response = await service.purchases.subscriptions.get({
            packageName: 'com.kiddiekredit.app"', // Replace with your package name
            subscriptionId: productID, // Replace with product ID
            token: purchaseToken,
        });

        const isExpired = response.data.state === 'PURCHASED' && (
            new Date(response.data.expiryTimeMillis) > new Date()
        );

        res.json({ isExpired });
    } catch (error) {
        console.error('Error verifying purchase:', error);
        res.status(500).send('Internal Server Error');
    }
});


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
    verifyPurchaseHistory,
}