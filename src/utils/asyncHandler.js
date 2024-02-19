const asyncHandler = (requestHandler) => {  //requestHanlder ek function hai: ye teen parameter lega
    (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch( (err)=> next(err) ) // error me next kar dia taki kaam na ruke 
    }
}

export {asyncHandler}




//Through Try catch

//higher order async handler function
// step 1: const asyncHandler = () => {}
//step 2: const asyncHandler = (function) => () => {}
//step 2: const asyncHandler = (function) => async() => {} //highAsyncHandler function

//ye hum ek wrapper function bana rahe hai jisse hum baad me har jagah use karenge.

// const asyncHandler = (func) => async (req, res, next) => {
//     try {
//         await func(req, res, next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         })
//     }

// }