import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Tweet } from "../models/tweet.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle like on video
    // Input Validation (optional)
    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID provided");
    }

    try {

        const existingLike = await Like.findOne(
            {
                video: videoId,
                likedBy: req.user?._id
            }
        )

        if (existingLike) {
            //Unlike the video
            await Like.findByIdAndDelete(existingLike._id)
            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        "Video unliked successfully"
                    )
                )
        } else {
            //Unlike the video
            const newLike = await Like.create(
                {
                    video: videoId,
                    likedBy: req.user?._id
                }
            )

            const like = await Like.findById(newLike?._id)

            if (!like) {
                throw new ApiError(400, "Something wrong while liked the video")
            }

            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        like,
                        "Video Liked successfully"
                    )
                )
        }

    } catch (error) {
        console.log("Error: ", error.message)
        throw new ApiResponse(500, "Internal Sever error")
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const userId = req.user?._id
    //TODO: toggle like on comment
    if (!commentId || !isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid commentID provided")
    }
    try {

        const existingComment = await Like.findOne({ comment: commentId, likedBy: userId });

        if (existingComment) {
            // Unlike the comment (remove the like document)
            await Like.findByIdAndDelete(existingComment._id);
            return res.status(200).json(new ApiResponse(200, { commented: false }, "Comment unliked"));
        } else {
            // Like the comment (create a new like document)
            const newLikeComment = await Like.create(
                {
                    comment: commentId,
                    likedBy: req.user?._id
                }
            )

            const comment = await Like.findById(newLikeComment?._id)

            if (!comment) {
                throw new ApiError(400, "Something wrong while commented the liked video")
            }
            return res.status(200).json(new ApiResponse(200, { commented: true, comment }, "Comment liked"));
        }
    } catch (error) {
        console.log("Error: ", error.message)
        throw new ApiResponse(500, "Internal Sever error")
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet
    const userId = req.user?._id;

    // Input validation (assuming isValidObjectId is implemented)
    if (!tweetId || !isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID provided");
    }

    try {
        // Find or create the tweet like
        const existingTweet = await Like.findOne({ tweet: tweetId, likedBy: userId });

        console.log("existingTweet =============> ", existingTweet)

        if (existingTweet) {
            // Unlike the comment (remove the like document)
            console.log("newTweet =============> ", existingTweet)

            await Like.findByIdAndDelete(existingTweet._id);
            return res.status(200).json(new ApiResponse(200, { tweeted: false }, "tweetId unliked"));
        } else {
            // Like the comment (create a new like document)
            const newLikeTweet = await Like.create(
                {
                    tweet: tweetId,
                    likedBy: req.user?._id
                }
            )

            console.log("newTweet =============> ", newLikeTweet)
            const tweet = await Like.findById(newLikeTweet?._id)

            if (!tweet) {
                throw new ApiError(400, "Something wrong while Tweeted the liked video")
            }
            return res.status(200).json(new ApiResponse(200, { tweeted: true, tweet }, "Tweeted liked"));
        }
    } catch (error) {
        console.error("Error:", error.message);
        return res.status(500).json(new ApiResponse(500, error.message));
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user?._id; 

    if (!userId) {
        throw new ApiError(401, "Unauthorized: You must be logged in to see liked videos");
    }

    try {
        // Find liked videos using the Like model
        const likedVideos = await Like.find({ likedBy: userId })
            .populate('video') // Populate the 'video' field with full video data

        return res.status(200).json(new ApiResponse(200, likedVideos, "Get All Liked Videos"));
    } catch (error) {
        console.error("Error:", error.message);
        return res.status(500).json(new ApiResponse(500, "Internal Server Error"));
    }
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}