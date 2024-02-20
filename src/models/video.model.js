import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"; //step 1: 

const videoSchema = new Schema( 
    {   
        videoFile: {
            type: String, // cloudinary url
            required: true,
        },
        thumbnail: {
            type: String, // cloudinary url
            required: true,
        },
        title: {
            type: String, // cloudinary url
            required: true,
        },
        description: {
            type: String, // cloudinary url
            required: true,
        },
        duration: {
            type: Number, // cloudinary se duration nikalenge.
            required: true,
        },
        views: {
            type: Number, // cloudinary se duration nikalenge.
            default: 0,
        },
        isPublished: {
            type: Boolean,
            default: true,
        },
        owner:{
            type: Schema.Types.ObjectId, // jo video upload hoga uska owner koon hoga uska reference denge.
            ref: "User", 
        }
    }, { timestamps: true }
)

//Hooks: 

// step 2:-- aggregate pipelin
videoSchema.plugin(mongooseAggregatePaginate) // plugin ek trah ka hooks hai, jisse use karke chejo asan banya jata hia.

export default Video = mongoose.model("Video", videoSchema)