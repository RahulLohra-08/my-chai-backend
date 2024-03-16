import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"; //step 1: hamhe kitna comments dena hai, or kanha se kanha tak dena ye decide karne ka kaam pagignate hoata h

const commentSchema = new Schema(
    {
        content: {
            type: String,
            required: true
        },
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video"
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    }, { timestamps: true }
)

commentSchema.plugin(mongooseAggregatePaginate) //step  2: kanha se kanha tak comments dena ye decide karne ka kaam pagignate ka  hoata h

export const Comment = mongoose.model("Comment", commentSchema)