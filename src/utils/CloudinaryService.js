import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Configure Cloudinary
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET, 
});

// Function to upload file to Cloudinary
const uploadOnCloudinary = async (localFilePath) => {
    try {
        console.log("Local file path:", localFilePath);

        // Check if local file path is valid
        if (!localFilePath) {
            throw new Error("Avatar file is required");
        }

        console.log("Uploading file to Cloudinary...");
        
        // Generate timestamp for the signature
        // const timestamp = Math.floor(Date.now() / 1000);

        // Create the string to sign
        // const stringToSign = `timestamp=${timestamp}`;

        // Generate the signature
        // const signature = cloudinary.utils.api_sign_request(stringToSign, process.env.CLOUDINARY_API_SECRET);

        // Upload file to Cloudinary with timestamp included in the signature
        const response = await cloudinary.uploader.upload(localFilePath, { 
            resource_type: "auto",
        });

        console.log("Cloudinary response ================>", response)
        // console.log("File is uploaded on Cloudinary. URL:", response.url);
        fs.unlinkSync(localFilePath) // upload file local se hata denge qki hum use cloudinary me store kar rahe hai.
        
        // Return Cloudinary response
        return response;
    } catch (error) {
        console.error("Error uploading file to Cloudinary:", error.message);
        
        // Remove the locally saved temporary file
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
            console.log("Local file removed:", localFilePath);
        }

        // Return null in case of error
        return null;
    }
}

export { uploadOnCloudinary };
