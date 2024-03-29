import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body
    //TODO: create playlist

    if (!name || !description) {
        throw new ApiError(400, "Fields are required")
    }

    try {
        const createPlaylist = await Playlist.create(
            {
                name,
                description,
                owner: req.user?._id
            }
        )

        const playlist = await Playlist.findById(createPlaylist._id)

        if (!playlist) {
            throw new ApiError(400, "Something wrong while creating playlist")
        }

        return res
            .status(201)
            .json(
                new ApiResponse(
                    200,
                    playlist,
                    "Playlist created successfully"
                )
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

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params  //userId means OwnerId
    //TODO: get user playlists
    if (!userId) {
        throw new ApiError(400, "User ID missing")
    }

    try {

        const playlists = await Playlist.find({
            owner: userId
        }).populate('videos') // Assuming I want to populate the 'videos' field

        if (!playlists) {
            throw new ApiError(400, "Playlists not found...!")
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    playlists,
                    "User playlists retrieved successfully"
                )
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

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    //TODO: get playlist by id

    if (!playlistId) {
        throw new ApiError(400, "Playlist ID is missing")
    }

    try {

        console.log("playlistId ================> ", playlistId)

        const playlist = await Playlist.findById(playlistId)

        console.log("playlistId 1111111111 ================> ", playlist)

        if (!playlist) {
            throw new ApiError(400, "Playlist not found")
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, playlist, "Playlist retrieved successfully")
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

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    console.log("Videos ===================> ", playlistId, videoId)
    try {
        console.log("Videos 11111111111 ===================> ", playlistId, videoId)
        // Find the playlist by its ID
        const playlist = await Playlist.findById(playlistId);

        // Check if the playlist exists
        if (!playlist) {
            throw new ApiError(404, "Playlist not found");
        }

        console.log("Videos 222222222 ===================> ", playlist)

        // Check if the videoId already exists in the playlist
        if (playlist.videos.includes(videoId)) {
            return res.status(200).json(
                new ApiResponse(400, "Video already exists in the playlist")
            )
        }

        // Add the videoId to the videos array of the playlist
        playlist.videos.push(videoId);

        // Save the updated playlist to the database
        await playlist.save();

        // Send success response
        return res.status(200).json(
            new ApiResponse(200, playlist, "Video added to playlist successfully")
        );

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

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // TODO: remove video from playlist
    try {
        // Find the playlist by its ID
        const playlist = await Playlist.findById(playlistId);

        // Check if the playlist exists
        if (!playlist) {
            throw new ApiError(404, "Playlist not found");
        }

        // Remove the videoId from the videos array of the playlist
        playlist.videos = playlist.videos.filter(id => id.toString() !== videoId);

        if (!playlist) {
            throw new ApiError(400, "Something wrong while remove the video from playlist")
        }

        // Save the updated playlist to the database
        await playlist.save();

        // Send success response
        return res.status(200).json(
            new ApiResponse(200, playlist, "Video remove from playlist successfully")
        );

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

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    // TODO: delete playlist
    if ( !playlistId ) {
        throw new ApiError(400, "Playlist ID is missing");
    }
    try {
        const deletePlaylist = await Playlist.findOneAndDelete(playlistId);

        if (!deletePlaylist) {
            throw new ApiError(400, "Something wrong while deleting the playlist.")
        }

        return res 
        .status(200)
        .json(
            new ApiResponse(
                200,
                // deletePlaylist,
                "Playlist deleted successfully...!"
            )
        )
    } catch (error) {
        if (error instanceof mongoose.Error.ValidationError) {
            // If the error is a Mongoose validation error
            throw new ApiError(400, error.message); // Bad request due to validation error
        } else {
            // Otherwise, it's an internal server error
            throw new ApiError(500, "Internal server error");
        }   
    }
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    //TODO: update playlist
    if (!name || !description) {
        throw new ApiError(400, "Fields are required")
    }

    if (!playlistId) {
        throw new ApiError(400, "PLaylist ID missing")
    }

    try {

        const playlist = await Playlist.findOneAndUpdate(
            {_id: playlistId},
            {
                $set: {
                    name: name,
                    description: description
                }
            }
        )

        if (!playlist) {
            throw new ApiError(400, "Something wrong while updating playlist")
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    playlist,
                    "Playlist Updated successfully"
                )
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
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}