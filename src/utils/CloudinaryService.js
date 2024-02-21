import { v2 as cloudinary } from "cloudinary";
import fs from 'fs'

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET, 
  });

  //Production great me two step settings hota. isliye hum first me local storage me store karenge uske baad cloudinary me dalenge.
  const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null

        const response = await cloudinary.uploader.upload(localFilePath, { resource_type: "auto"}) //auto means koi sa bhi file: image.video pdf etc

        console.log("File is uploaded on cloudinary url is : ", response.url, "/n Responses: ", response)
        return response;
        
    } catch (error) {
        fs.unlinkSync(localFilePath) //sync matlb karna hi hai: unlink matlab remove: Matlab remove the locally saved temporary file as the upload.
        return null;
    }
  }

  export { uploadOnCloudinary }