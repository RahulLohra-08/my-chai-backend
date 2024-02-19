// API Error response jab bhi aayegi to error issi trah se ayegi isliye isse banai hai,
class ApiError extends Error {
   constructor( statusCode, message = "Something went wrong", errors = [], stack = "" ) {  
     //override karenge constructor ko
     super(message) // message override
     this.statusCode = statusCode
     this.data = null
     this.message = message
     this.success = false
     this.errors = errors

     if (stack) {
        this.stack = stack
     } else {
        Error.captureStackTrace(this, this.constructor)  // kis context me baat kar rahe uska instance pass kar dia capturestacktrace ke andar.
     }
   }
}

export { ApiError }