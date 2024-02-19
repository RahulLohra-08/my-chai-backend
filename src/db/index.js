import mongoose from "mongoose";
import { DB_NAME } from "../constants.js"

//DATA BASE IS AN ANOTHER CONTIENENT

const connectDB = async () => {
    try {
        console.log('Connecting to MongoDB...');
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`MongoDB Connected !! DB HOST: ${connectionInstance.connection.host}`);
       
    } catch (error) {
        console.error("MongoDB Connection error: ", error);
        process.exit(1);
    }
}

export default connectDB;
