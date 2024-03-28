import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    try {
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 }, // Sort by creation date descending (newest first)
        };

        const comments = await Comment.aggregate([
            { $match: { video: new mongoose.Types.ObjectId(videoId) } },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "ownerDetails",
                },
            },
            // { $unwind: "$ownerDetails" },
            {
                $project: {
                    _id: 1,
                    content: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    owner: {
                        _id: "$ownerDetails._id",
                        username: "$ownerDetails.username",
                        fullName: "$ownerDetails.fullName",
                        avatar: "$ownerDetails.avatar",
                    },
                },
            },
            { $sort: { createdAt: -1 } }, // Sort by creation date descending (newest first)
            { $skip: (options.page - 1) * options.limit }, // Skip documents based on pagination
            { $limit: options.limit }, // Limit documents based on pagination
        ]);

        // console.log("aggregate ===========? ", aggregate)
        // Execute the aggregation pipeline
        // const comments = await aggregate.exec();
        console.log("comments ===========? ", comments)

        //aggregate array return karta hai.

        // if (!comments?.length) {
        //     throw new ApiError(401, "comments does not exists")
        // }

        // Count total comments
        const totalComments = await Comment.countDocuments({ video: videoId });

        // Send response
        res.status(200).json({
            comments,
            pagination: {
                page: options.page,
                limit: options.limit,
                totalPages: Math.ceil(totalComments / options.limit),
            },
            message: "Comments retrieved successfully"
        });
    } catch (error) {
        if (error.name === "CastError") {
            throw new ApiError(400, "Invalid video ID format");
        } else {
            throw error;
        }
    }
});


const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params
    const { content } = req.body

    // Check if the videoId is valid
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID format");
    }

    try {
        // Create a new comment
        const addComment = await Comment.create(
            {
                content,
                video: videoId,
                owner: req.user?._id
            }
        )

        const addedComment = await Comment.findById(addComment._id)

        if (!addedComment) {
            throw new ApiError(500, "Something wrong while adding comments")
        }

        return res.status(201).json(
            new ApiResponse(200, addedComment, "Comment added Successfully...!")
        )

    } catch (error) {
        // Handle errors
        if (error instanceof mongoose.Error.ValidationError) {
            // If the error is a Mongoose validation error
            throw new ApiError(400, error.message); // Bad request due to validation error
        } else {
            // Otherwise, it's an internal server error
            throw new ApiError(500, "Internal server error");
        }
    }
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params
    const { content } = req.body;

    // Check if the videoId is valid
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment ID format");
    }

    try {

        const updateComment = await Comment.findOneAndUpdate(
            {_id: commentId },
            {
                $set: {
                    content: content
                }
            },
            {
                new: true
            }
        )

        if (!updateComment) {
            throw new ApiError(400, "Something wrong while updating comments")
        }

        return res.status(201).json(
            new ApiResponse(200, updateComment, "Comment added Successfully...!")
        )

    } catch (error) {
        // Handle errors
        if (error instanceof mongoose.Error.ValidationError) {
            // If the error is a Mongoose validation error
            throw new ApiError(400, error.message); // Bad request due to validation error
        } else {
            // Otherwise, it's an internal server error
            throw new ApiError(500, "Internal server error");
        }
    }
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params

    // Check if the videoId is valid
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment ID format");
    }

    try {

        const deleteComment = await Comment.findOneAndDelete(
            {_id: commentId }
        )

        if (!deleteComment) {
            throw new ApiError(400, "Something wrong while deleting comments")
        }

        return res.status(201).json(
            new ApiResponse(200, "Comment deleted Successfully...!")
        )

    } catch (error) {
        // Handle errors
        if (error instanceof mongoose.Error.ValidationError) {
            // If the error is a Mongoose validation error
            throw new ApiError(400, error.message); // Bad request due to validation error
        } else {
            // Otherwise, it's an internal server error
            throw new ApiError(500, "Internal server error");
        }
    }
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}