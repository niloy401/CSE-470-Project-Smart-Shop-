const ErrorHandler = require('../utils/errorHandler');

module.exports = (err, req, res, next) => {

    err.statusCode = err.statusCode || 500;
    if (process.env.NODE_ENV === 'DEVELOPMENT') {
         res.status(err.statusCode).json({
            success : false,
            error : err,
            errMessage : err.message,
            stack : err.stack
         })
    }
    if (process.env.NODE_ENV === 'PRODUCTION') {
       
        let error = {...err}
        error.message = err.message

        //Identifying the wrong mongoose object ID
        if (err.name === 'CastError') {
            const message = `Resource not found. Invalid: ${err.path}`
            error = new ErrorHandler(message, 400)
        }
        //Handling Mongoose validation error
        if (err.name === 'ValidationError') {
            const message = Object.values(err.errors).map(value => value.message)
            error = new ErrorHandler(message, 400)
        }

        //Handling Mongoose duplicate key error
        if (err.code === 11000) {
            const message = `Duplicate ${Object.keys(err.keyValue)} entered`
            error = new ErrorHandler(message, 400)
        }

        //Handling wrong jwt errors
        if (err.name === 'JsonWebTokenError') {
            const message = 'Invalid web token'
            error = new ErrorHandler(message, 401)
        }

        // Handling Expired  jwt errors
        if (err.name === 'TokenExpiredError') {
            const message = 'Web token has expired, please retry'
            error = new ErrorHandler(message, 401)
        }



        res.status(error.statusCode).json({
            success: false,
            message: error.message || 'Server Error'
        })
    }
   }