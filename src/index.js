//src folder ke andar jake backend ko run kare:  npm run dev

// require('dotenv').config({path: "./env"}) // consistency ko karab kart hai hamare code ki
import connectDB from "./db/index.js"
import dotenv from "dotenv"
import express from 'express'
const app = express();
dotenv.config({   // isko hum experimental ke through hum isse aise use kar sakte hai. package.json me
    path: "./env"
})

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => console.log(`Server is listening at port: ${process.env.PORT}`))
    app.on("Error", (error)=>{
        console.error("Error: ", error);
        throw error
    })
})
.catch((error) => {
   console.log("MongoDB db connection failed !!!", error)
})

/*
1st db connection:---

import express from "express";
const app = express();

//efi function
( async () => { //<-----------ye function banaye aur iske just baad function call kar dia
    try {
        
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        app.on("Error", (error) => console.log("Error:", error))

        app.listen(process.env.PORT, () => console.log(`App is listing on ${process.env.PORT}`) )

    } catch (error) {
        console.log("Error:", error)
        throw error
    }
})() //<------------iske just function call kar dia.

*/