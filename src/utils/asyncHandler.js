const asyncHandler = (requestHandler) => {  //requestHanlder ek function hai: ye teen parameter lega
   return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch( (err)=> next(err) ) // error me next kar dia taki kaam na ruke 
    }
}

export { asyncHandler }

//Error: 
/* 
    node:internal/errors:464
    ErrorCaptureStackTrace(err);
    ^

Error [ERR_MODULE_NOT_FOUND]: Cannot find module 'C:\Users\User\OneDrive\Desktop\Jai info\complete backend course\chai-backend\src\utils\asyncHandler' imported from C:\Users\User\OneDrive\Desktop\Jai info\complete backend course\chai-backend\src\controllers\user.controller.js
    at new NodeError (node:internal/errors:371:5)


   1. qki hamne function call hone ke baad hamne usse return nhi kia tha
   2. file name ke baad extention js lagana bhul gaye the.
**/

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