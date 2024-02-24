import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
    {
        subscriber: {
            type: Schema.Types.ObjectId, // Who is subscribing
            ref: "User"
        },
        chanel: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },{ timestamps: true}
)

const Subscription = mongoose.model("Subscription", subscriptionSchema);
