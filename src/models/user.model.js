import mongoose, { Schema } from "mongoose";
import bcrypt from 'bcrypt'
import jwt from "jsonwebtoken"; // ye token generate karta hai: just like a key/chabhi: jiske pass bhi key hai usse sara data de do.

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,   // isse true karne per searching enabled ho jati hai, ye baar show jaingi mongo db me
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName: {
            type: String,
            unique: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String, //cloudinary url: aws ki trah image upload krne per ye url deta hai.
            required: true
        },
        coverImage: {
            type: String,
        },
        watchHistory: [ // kisne dekha unka list ayeaga islia array me hai, 
            {
                type: Schema.Types.ObjectId,
                ref: "Video",  // ye model ka name hai, video dekhne walo ka id isme aa jaiga.
            }
        ],
        password: {
            type: String,
            required: [true, "Password is required"] // ek error message de dia hia.
        },
        refreshToken: {
            type: String
        },

    }, { timestamps: true }
)

// Hooks:-- 

//direct encrypt karna posible hai nhi isliye hum use karte hai mongoose ki hooks ki. Hum use karegne pre hooks: pre hooks ye ek middle ware hai, jab bhi koi data save hone ja rahi hogi just uske phale, isme khuch bhi code dal ke run kara sakte hai. hum password encrypt  karenge.

//yanha per callback function use nhi kar sakte hai. qki callback function ke pass this nhi hota hai, iske paas koi context nhi jisse hum userSchema ko find kar sake islye dusre wale function ka use karte hai.
userSchema.pre("save", async function (next) {
    //check user modified his password or not.
    if (!this.isModified("password")) return next();  // agar password change nhi hua h to simply return kar denge, aisa islye karene taki hame password ko bar bar modified na ho sake.

    //first time when we entered password: then we should encrypt the password.

    this.password = await bcrypt.hash(this.password, 10) // password decrypt here.
    next();
}) // jab password save hone wali ho usse just phale password lenge or usse encrypt karke store/save kara denge.


//Methods:--
//hum password ko check karenge upas bhejne se phale.
//create custom method through userSchema.

userSchema.methods.isPasswordCorrect = async function (password) {
    //compare password
    return bcrypt.compare(password, this.password) // jo database me store password or jo hum password input kia usse check karega.
}

userSchema.methods.generateAccessToken = function () {
    // console.log('Generate Access function call here......')
    return jwt.sign(
        { //1. ---------------payload----------------//
            _id: this._id, // ye id mongo database se ayegi
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        //2. Access token
        process.env.ACCESS_TOKEN_SECRET,
        { //3. expiry
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY, // access token expiry kam hota as compare to refresh token
        }
    )
}
userSchema.methods.generateRefreshToken = function () {
    // console.log('Generate Refresh token function call here......')

    return jwt.sign(
        { //1. ---------------payload----------------//
            _id: this._id, // refresh token me data kam hoti hai. qki token baar bar refresh hoti.
        },
        //2. Access token
        process.env.REFRESH_TOKEN_SECRET,
        { //3. expiry
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    )
}


const User = mongoose.model("User", userSchema)

export default User;