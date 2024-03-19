import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import User from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/CloudinaryService.js";
import Video from "../models/video.model.js";

const getAllVideos = asyncHandler(async (req, res) => {

    try {
        // 1. Parse query parameters for filtering and sorting:
        const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

        //TODO: get all videos based on query, sort, pagination
      
        // 6. Send successful response with videos and pagination data:
        return res
            .status(200)
            .json(
                new ApiResponse(200,  "Get All videos successfully")
            )
    } catch (error) {
        throw new ApiError(500, "Internal server error")
    }

})

const publishAVideo = asyncHandler(async (req, res) => {
    try {
        const { title, description } = req.body
        // TODO: get video, upload to cloudinary, create video

        if (!title || !description) {
            throw new ApiError(400, "Missing required fields: title or description")
        }

        const localVideoFile = req.files?.videoFile[0]?.path

        if (!localVideoFile) {
            throw new ApiError(400, "Local video does not exist...!")
        }

        let thumbnailLocalFile;

        //for handling undefined ( reading 0 );
        if (req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0) {
            thumbnailLocalFile = req.files?.thumbnail[0].path;
        }

        //  // Upload video and thumbnail to Cloudinary  (adapt based on your cloud storage provider):
        const video = await uploadOnCloudinary(localVideoFile);
        const thumbnail = await uploadOnCloudinary(thumbnailLocalFile);

        if (!video) {
            throw new ApiError(400, "video file is required")
        }

         // Get the owner ID from the request (assuming it's stored in req.user)
         const ownerId = req.user._id; // Adjust this according to how you store the user ID in the request

         console.log("OwernerId ====================> ", ownerId)
 
        // Create video document in the database
        const videoResponse = await Video.create({
            videoFile: video?.secure_url,   //note: we need video url for storing on db
            thumbnail: thumbnail ? thumbnail?.secure_url : null,
            title,
            description,
            duration: video.duration,
            owner: ownerId
        });

        // Retrieve created video document
        const createdVideo = await Video.findById(videoResponse._id);

        // Check if video was created successfully
        if (!createdVideo) {
            throw new ApiError(500, "Failed to create video in the database");
        }

        // Send successful response with the created video
        return res.status(201).json(
            new ApiResponse(
                200,
                createdVideo,
                "Video uploaded successfully"
            )
        );

    } catch (error) {
        throw new ApiError(500, "Internal server error")
    }
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

})

const togglePublishStatus = asyncHandler(async (req, res) => {

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}