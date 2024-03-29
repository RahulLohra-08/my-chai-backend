import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import User from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/CloudinaryService.js";
import Video from "../models/video.model.js";
import mongoose from "mongoose";
import upload from "../middleware/multer.middleware.js";

const getAllVideos = asyncHandler(async (req, res) => {
    console.log(req.query);

    try {
        // Parse query parameters for filtering and sorting:
        const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
        const skip = (page - 1) * limit;
        // Pipeline stages for aggregation
        const pipeline = [];

        // Match stage to filter by user ID if provided
        if (userId) {
            pipeline.push({ $match: { owner: new mongoose.Types.ObjectId(userId) } }); //ew mongoose.Types.ObjectId(req.user._id)
        }

        // Search stage
        pipeline.push({
            $search: {
                index: "default", // Specify the index to search on
                text: { query: query, path: ["title", "description"] },
                highlight: { fields: { title: {}, description: {} } }
            }
        });

        // Sort and pagination stage
        pipeline.push({ $sort: { [sortBy || "metaScore"]: sortType === "desc" ? -1 : 1 } });
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: limit });

        // Execute aggregation
        const videos = await Video.aggregate([
            { //1. pipeline
                $match: {
                    owner: new mongoose.Types.ObjectId(userId),
                }
            },
            // { //2. pipeline
            //     $search: {
            //         index: "videos", // Specify the index to search on
            //         text: { 
            //             query: "nextjs tutorial",
            //             path: ["title", "description"] 
            //         },
            //         // highlight: { fields: { title: {}, description: {} } }
            //     }
            // },
            {
                $lookup: {
                    from: "users", // join kar rahe hai. Video model se, databse ye videos name se save hota hai isliye small latter se staert or Last me "s" lagaye hai.
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                }
            },
            {
                $addFields: {
                    owner: {
                        $first: "$owner"
                    }
                }
            },
            // { //3. pipeline
            //     $sort: { [sortBy || "metaScore"]: sortType === "desc" ? -1 : 1 }
            // },
            // { // 
            //     $skip: { skip }
            // },
            // {
            //     $limit: { limit }
            // }
        ]);

        if (!videos || videos.length === 0) {
            return res.status(404).json(new ApiResponse(404, null, "No videos found"));
        }

        // Send successful response with videos and pagination data
        return res.status(200).json(new ApiResponse(200, videos, "Get All videos successfully"));
    } catch (error) {
        throw new ApiError(500, "Internal server error");
    }
});

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
        console.log("Error: ", error.message)
        throw new ApiError(500, `Internal server error: ${error.message}`)
    }
})

const getVideoById = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params
        //TODO: get video by id

        if (!videoId) {
            throw ApiError(401, "video Id is missing")
        }

        const video = await Video.findById({ _id: videoId });

        if (!video) {
            throw ApiError(401, "Video does not exists!")
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, video, "Successfully get video")
            )
    } catch (error) {
        throw new ApiError(500, "Internal server error")
    }
})

const updateVideo = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params
        const { title, description } = req.body
        //TODO: update video details like title, description, thumbnail

        if (!videoId) {
            throw ApiError(401, "Invalid video Id")
        }

        if (!title || !description) {
            throw ApiError(401, "All fields are required")
        }

        //upload thumbnail on cloudinary

        let thumbnailLocalFile = req.file?.path;

        //for handling undefined ( reading 0 );
        if (!thumbnailLocalFile) {
            throw new ApiError(404, "Thumbnail file is missing")
        }

        // Upload video and thumbnail to Cloudinary  (adapt based on your cloud storage provider):
        const thumbnailVideo = await uploadOnCloudinary(thumbnailLocalFile);

        //check avatar url available or not
        if (!thumbnailVideo.secure_url) {
            throw new ApiError(404, "Error while uploading on thumbnail")
        }

        const video = await Video.findByIdAndUpdate(
            { _id: videoId },
            {
                $set: {
                    title: title,
                    description: description,
                    thumbnail: thumbnailVideo.secure_url,
                }
            },
            {
                new: true
            }
        );

        if (!video) {
            throw ApiError(401, "Video does not exists!")
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, video, "Video updated successfully...!")
            )

    } catch (error) {
        throw new ApiError(500, "Internal server error")
    }
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    try {

        if (!videoId) {
            throw ApiError(401, "video Id is missing")
        }

        const video = await Video.findByIdAndDelete({ _id: videoId });

        if (!video) {
            throw ApiError(401, "Video does not exists!")
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, "Video Deleted successfully...!")
            )
    } catch (error) {
        throw new ApiError(500, "Internal server error")
    }

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    try {
        // Ensure videoId is provided
        if (!videoId) {
            throw new ApiError(400, "Video Id is missing");
        }

        // Find the video by its Id
        const video = await Video.findById({_id: videoId});

        // If video is not found, return 404 error
        if (!video) {
            throw new ApiError(404, "Video not found");
        }

        // Toggle the publish status of the video
        video.isPublished = !video.isPublished;

        // Save the updated video document
        await video.updateOne({ isPublished: video.isPublished });

        // Send response with updated video
        res.status(200).json(new ApiResponse(200, video, "Publish status toggled successfully"));
    } catch (error) {
        // Handle errors
        console.error("Error toggling publish status:", error);
        if (error instanceof ApiError) {
            throw error;
        } else {
            throw new ApiError(500, "Internal server error");
        }
    }
});

const addVideoView = asyncHandler(async (req, res) => {
    const { videoId } = req.params; // Assuming video ID comes from request parameters
    const userId = req.user?._id;

    try {
        // Find the video by ID
        const video = await Video.findById(videoId);

        if (!video) {
            throw new ApiError(404, "Video not found");
        }

        // Check if the user has already viewed the video
        if (video.viewedBy.includes(userId)) {
            return res.status(400).json(new ApiResponse(400, { message: "User has already viewed the video" }));
        }

        // Increment the views count
        video.views += 1;

        // Add the user's ID to the viewedBy array
        video.viewedBy.push(userId);

        // Save the updated video document
        await video.save();

        // Return success response
        return res.status(200).json(new ApiResponse(200, video, "View added successfully" ));
    } catch (error) {
        console.error("Error:", error.message);
        // Return error response
        return res.status(500).json(new ApiResponse(500, "Internal Server Error"));
    }
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    addVideoView
}