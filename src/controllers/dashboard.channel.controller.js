import mongoose from "mongoose"
import Video from "../models/video.model.js"
import Subscription from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    // const { channelId } = req.params;
    const channelId = req.user?._id

    if (!channelId) {
        throw new ApiError(400, "Missing channel ID parameter");
    }

    try {
        // Fetch total video views
        const totalVideoViews = await Video.aggregate([
            { $match: { owner: new mongoose.Types.ObjectId(channelId) } }, // Filter videos by channel ID
            {
                $group: {
                    _id: null,
                    totalViews: { $sum: "$views" }
                }
            }
        ]);

        // Fetch total subscribers
        const totalSubscribers = await Subscription.countDocuments({subscriber: channelId});

        // Fetch total videos
        const totalVideos = await Video.countDocuments({owner: channelId});

        // Fetch total likes
        const totalLikes = await Like.countDocuments({likedBy: channelId});

        // Return the channel stats
        res.json({
            totalVideoViews: totalVideoViews.length > 0 ? totalVideoViews[0].totalViews : 0,
            totalSubscribers,
            totalVideos,
            totalLikes
        });
    } catch (error) {
        console.error("Error:", error.message);
        // Return ApiResponse with status 500 for internal server error
        return res.status(500).json(new ApiResponse(500, "Internal Server Error"));
    }
});


const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    try {
        // Find all videos uploaded by the channel
        const videos = await Video.find({owner: req.user?._id});

        // Return the videos
        return res.status(200).json(new ApiResponse(200, videos, "Retrieved all videos uploaded by channel"));
    } catch (error) {
        console.error("Error:", error.message);
        return res.status(500).json(new ApiResponse(500, "Internal Server Error"));
    }
})

export {
    getChannelStats,
    getChannelVideos
}