const User = require('../models/user');

const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require('../middlewares/catchAsynchErrors');
const sendToken = require('../utils/jwtToken');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

//Registering a user or customer => api/v1/register

exports.registerUser = catchAsyncErrors(async (req, res, next) => {

    const{name, email, password} = req.body;

    const user = await User.create({
    name,
    email,
    password,
    avatar:{
        public_id: 'Avatars/39c706fdb9f87f1ac86185aca6892cf3_pdmu7r',
        url: 'https://res.cloudinary.com/geralt500/image/upload/v1660040588/Avatars/39c706fdb9f87f1ac86185aca6892cf3_pdmu7r.jpg'
    }

    })
 sendToken(user, 200, res);
   })

//Login a User  => api/v1/login
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
 const {email, password} = req.body;

 //checking if the user has entered the email and password
if(!email || !password){
    return next(new ErrorHandler('Please provide email and password', 400))
}

//Find user in DB
const user = await User.findOne({email}).select('+password');

if(!user){
    return next(new ErrorHandler('Invalid Email or password', 401))
}

//Checks for correct password
const isPasswordMatched = await user.comparePassword(password);

if(!isPasswordMatched){
    return next(new ErrorHandler('Invalid Email or password', 401))
 }
 sendToken(user, 200, res);
})

//Forgot Password => /api/v1/password/forgot
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
const user = await User.findOne({email: req.body.email});

if(!user){
    return next(new ErrorHandler('No user found with this email', 404))
}
// Get the reset token
const resetToken = user.getResetPasswordToken();

await user.save({validateBeforeSave: false});

// Creating reset password URL
const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/password/reset/${resetToken}`;
const message = `Your password reset link is here:\n\n${resetUrl}\n\nIf you didn't request this, please ignore this email.`

try {
    await sendEmail({
        email: user.email,
        subject: 'New password for your account',
        message
    })
    res.status(200).json({
        success: true,
        message: `Email sent to: ${user.email}`
    })
} catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({validateBeforeSave: false});

    return next(new ErrorHandler(error.message, 500))

}

})

//Reset Password => /api/v1/password/reset/:token
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {

//Hashing the url token
const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: {$gt: Date.now()}

})
 if(!user){
     return next(new ErrorHandler('The password reset token is invalid or might have been expired', 400))
 }
 if(req.body.password !== req.body.confirmPassword){
     return next(new ErrorHandler('Passwords do not match', 400))
 }
//setting up new password
user.password = req.body.password;
user.resetPasswordToken = undefined;
user.resetPasswordExpire = undefined;

await user.save();

sendToken(user, 200, res);

})

  // Get currently logged in user => /api/v1/me
exports.getUserProfile = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    res.status(200).json({
        success: true,
         user
    })
})

//update or change password => /api/v1/password/update
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+password');

//checks prevoius user password
const isMatched = await user.comparePassword(req.body.oldPassword);
if(!isMatched){
    return next(new ErrorHandler('Old password is incorrect', 400))
}
user.password = req.body.password;
await user.save();
sendToken(user, 200, res);

})

//Update user profile => /api/v1/me/update
exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email
    }

    // update avatar
    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {new: true, runValidators: true, 
        useFindAndModify: false});

        res.status(200).json({
            success: true
        })
})

//Logout  User  => api/v1/logout
exports.logout = catchAsyncErrors(async (req, res, next) => {
    res.cookie('token', null, {
    expires: new Date(Date.now()),
    httpOnly: true
    })
    res.status(200).json({
        success: true,
        message: 'Logout Successful'
        
    })
})

// Admin routes
// Get All user  => /api/v1/admin/users

exports.allUsers = catchAsyncErrors(async (req, res, next) => {
const users = await User.find();
res.status(200).json({
    success: true,
    users
})

})

// Get user details  => /api/v1/admin/user/:id
exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
const user = await User.findById(req.params.id);

if(!user){
    return next(new ErrorHandler(`User not found with ID: ${req.params.id}`))
}

res.status(200).json({
    success: true,
    user
})

})

//Update user profile => /api/v1/admin/user/:id
exports.updateUser= catchAsyncErrors(async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role
    }

 
    const user = await User.findByIdAndUpdate(req.params.id, newUserData, {new: true, runValidators: true, 
    useFindAndModify: false});

    res.status(200).json({
    success: true
     })
})

// Delete user   => /api/v1/admin/user/:id
exports.deleteUser= catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    
    if(!user){
        return next(new ErrorHandler(`User not found with ID: ${req.params.id}`))
    }
 // Remove avatar 

    await user.remove();

    res.status(200).json({
        success: true
    })
    
    })
