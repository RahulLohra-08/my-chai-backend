// Api response issi formate me send karenge.

class ApiResponse {
    constructor(statusCode, data, message = "Success") {
        //override kar denge
        this.statusCode = statusCode,
        this.data = data,
        this.message = message
        this.success= statusCode < 400  // sabka standard status code hota, success response iske niche hi send karenge.
    }
}

export { ApiResponse }