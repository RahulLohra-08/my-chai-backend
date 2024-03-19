import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"; //step 1: hamhe kitna video dena hai, or kanha se kanha tak dena ye decide karne ka kaam pagignate hoata h

const videoSchema = new Schema( 
    {   
        videoFile: {
            type: String, // cloudinary url
            required: true,
        },
        thumbnail: {
            type: String, 
            required: true,
        },
        title: {
            type: String, 
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        duration: {
            type: Number, // cloudinary se duration nikalenge.
            required: true,
        },
        views: {
            type: Number, 
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

// step 2:-- aggregate pipeline
    videoSchema.plugin(mongooseAggregatePaginate) // plugin ek trah ka hooks hai, jisse use karke chejo asan banya jata hia. ex: hum ek baar me user ko sara video nhi dena chahte, or khuch hi video dete or baad me jarurat ke time usse or video deta, isliye pagignate use karte hai. 

const Video = mongoose.model("Video", videoSchema)

export default Video;