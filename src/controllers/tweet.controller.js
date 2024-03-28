import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import User from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body
    const user = req.user

    try {
        // Check if the user exists
        const currentUser = await User.findById(user?._id);
        if (!currentUser) {
            throw new ApiError(404, "User not found");
        }

        if (!content) {
            throw new ApiError(404, "Content Field is missing...!");
        }

        // Create the tweet
        const tweet = new Tweet({
            content,
            owner: user?._id
        });

        await tweet.save();

        res.json(new ApiResponse(201, "Tweet created successfully", tweet));
    } catch (error) {
        throw new ApiResponse(500, "Internal Sever error")
    }
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId } = req.params
    try {

        if (!userId) {
            throw new ApiError(400, "User not found...!")
        }

        const tweets = await Tweet.find({ owner: userId }).sort({ createdAt: -1 });

        if (!tweets) {
            throw ApiError(400, "Couldn't Find tweets")
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, tweets, "User tweets retrieved successfully", tweets)
            )
    } catch (error) {
        console.log("Error: ", error.message)
        throw new ApiResponse(500, "Internal Sever error")
    }
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params;
    const { content } = req.body;
    try {
        if (!tweetId) {
            throw new ApiError(400, "Invalid TweetId")
        }

        // Check if the tweet exists
        const tweet = await Tweet.findById({ _id: tweetId });

        if (!tweet) {
            throw new ApiError(404, "Tweet not found");
        }
        // 65e96cc686b40335b56dd276 !== new ObjectId('65e96cc686b40335b56dd276').toString() :
        // Check if the user is authorized to update the tweet
        if (tweet.owner.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "You are not authorized to update this tweet");
        }

        // Update the tweet content
        tweet.content = content;
        await tweet.save();

        return res
            .status(200)
            .json(new ApiResponse(200, "Tweet updated successfully", tweet));
    } catch (error) {
        console.log("Error: ", error.message)

        throw new ApiResponse(500, "Internal Sever error")
    }
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params;
    try {
        // Check if the tweet exists
        const tweet = await Tweet.findById({_id: tweetId});
        if (!tweet) {
            throw new ApiError(404, "Tweet not found");
        }
        
        // Check if the user is authorized to delete the tweet
        if (tweet.owner.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "You are not authorized to delete this tweet");
        }

        // Delete the tweet
        const deleteTweet = await Tweet.findByIdAndDelete({_id: tweetId});

        res.json(new ApiResponse(200, deleteTweet, "Tweet deleted successfully"));
    } catch (error) {

    }
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}