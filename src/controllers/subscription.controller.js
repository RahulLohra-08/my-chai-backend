import mongoose, { isValidObjectId } from "mongoose"
import User from "../models/user.model.js"
import Subscription from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // TODO: toggle subscription
    try {
        // Input Validation
        if (!channelId || !isValidObjectId(channelId)) {
            throw new ApiError(400, "Invalid channel ID provided"); // Throw error for bad request
        }

        // Check if the user is authenticated
        if (!req.user || !req.user._id) {
            throw new ApiError(401, "Unauthorized: User not authenticated");
        }

        // Check if the user exists
        // const currentUser = await User.findById({ _id: req.user?._id });
        const currentUser = await User.findById(req.user._id); // Get currently logged-in user

        if (!currentUser) {
            throw new ApiError(404, "User not found");
        }

        // Check if the user is already subscribed to the channel
        const existingSubscription = await Subscription.findOne({
            subscriber: currentUser._id,
            channel: channelId,
        });

        if (existingSubscription) {
            // If the user is already subscribed, unsubscribe them
            // Unsubscribe scenario
            await Subscription.deleteOne(existingSubscription)
            return res
                .status(200)
                .json(new ApiResponse(200, "Unsubscribed successfully"));
        } else {
            // If the user is not subscribed, subscribe them to the channel
            // Subscribe scenario
            const newSubscription = new Subscription({
                subscriber: currentUser._id,
                channel: channelId,
            });

            const subscribedData = await newSubscription.save();

            return res
                .status(201)
                .json(
                    new ApiResponse(201, subscribedData, "Subscribed successfully")
                );
        }

    } catch (error) {
        // Handle potential errors
        if (error.name === "CastError") {
            throw new ApiError(400, "Invalid channel ID format"); // Error for invalid object ID format
        } else {
            throw error; // Re-throw other errors for generic handling
        }
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // Input Validation
    if (!channelId || !isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID provided"); // Throw error for bad request
    }

    try {

        const subscribers = await Subscription.find({ channel: channelId })
            .populate("subscriber", "username fullName avatar"); // Populate subscriber details

        const subscriberList = subscribers.map((subscriber) => subscriber.subscriber) //extract subscriber list

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    subscriberList,
                    "Subscriber list retrieved"
                )
            )
    } catch (error) {
        if (error.name === "CastError") {
            throw new ApiError(400, "Invalid channel ID format"); // Error for invalid object ID format
        } else {
            throw error; // Re-throw other errors for generic handling
        }
    }
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

     // Input Validation
     if (!subscriberId || !isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid channel ID provided"); // Throw error for bad request
    }

    try {

        const subscribedChannels = await Subscription.find({ subscriber: subscriberId })
            .populate("channel", "username fullName avatar"); // Populate subscriber details

            console.log("subscribedChannels: ", subscribedChannels)
            const channelList = subscribedChannels.map((subscriber) => subscriber.channel) //extract channel list
            
            console.log("channelList: ", channelList)

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    channelList,
                    "Subscribed channels retrieved"
                )
            )
    } catch (error) {
        if (error.name === "CastError") {
            throw new ApiError(400, "Invalid subscribe ID format"); // Error for invalid object ID format
        } else {
            throw error; // Re-throw other errors for generic handling
        }
    }
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}