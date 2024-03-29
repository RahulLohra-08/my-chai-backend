import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'  // cookies ka use user ke pass ya mere pass jo browser hai uski cookie ko access kar pau, or uski cookie ko set kar pau, taki crud operation purform kar pau. inn cookie ko server hi read kar sakta hai or remove kar sakta hai.

const app = express();
// app.use : app.use middleware ke configuaration me kaam aata hai.

//set middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN, // kisko allow kare.
    credentials: true,
})) //configuaration ho jata hai: cors ke andar setting kar sakte hai.

app.use(express.json({limit: "16kb"})) //data json me bhi aa sakti: server cruse na ho jai isliye limit lagate hai.
app.use(express.urlencoded({extended: true, limit: "16kb"})) // extended matlb object ke andar object likh sakte hai: ---------URLENCODED: URL CONVERT KARTA HAI, SPECAIL CHAR KO SPECAIL CHARACTER ME.
app.use(express.static("public"))  // public ye ek folder ka name hai.: static khuch nhi hota, kai baar hum file folder store karna chahte hai, jaise pdf aai ya image aai usse mai apne hi server me store karna chahta hun to ek public folder bana dete, khuch bhi assets hum isme store kar denge
app.use(cookieParser())

//import routes
import router from './routes/healthcheck.route.js';
import userRouter from './routes/user.routes.js'
import videoRouter from './routes/video.routes.js'
import tweetRouter from './routes/tweet.routes.js'
import subscriptionRouter from './routes/subscription.route.js'
import commentRouter from './routes/comment.routes.js'
import playlistRouter from './routes/playlist.routes.js'


//route declaration
app.use("/api/v1/health-check", router)
app.use("/api/v1/users", userRouter)  // sare indestiry gred me yahi use hoata hai: v1 means version 1;
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/videos", videoRouter)  
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/playlist", playlistRouter)

//http://localhost:8000/user/register

export { app }