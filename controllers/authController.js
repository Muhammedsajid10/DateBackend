const OTP = require('../models/otpModel');
const userModel = require('../models/userModel');
const User = require('../models/userModel');
const generateOTP = require('../utils/otpGenerator');
const { generateToken } = require('../middleware/auth');
const { sendOTP } = require('../utils/smsService');
const joi = require('joi');
require('dotenv').config();

exports.sendOTP = async (req, res) => {
  try {
    // Validation schema
    const schema = joi.object({
      mobileNumber: joi.string().pattern(/^[0-9]{10,15}$/).required()
    });
    
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { mobileNumber } = req.body;
    const otp = generateOTP();

    // Delete any existing OTP for this mobile number
    await OTP.deleteMany({ mobileNumber });
    
    // Store OTP in database
    await OTP.create({ mobileNumber, otp });
    
    // Send OTP via SMS service
    const smsResult = await sendOTP(mobileNumber, otp);
    
    // Always log the OTP in development environment
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV ONLY] OTP for ${mobileNumber}: ${otp}`);
    }
    
    // Prepare response object
    const response = {
      success: true
    };
    
    // Add message based on SMS result
    if (smsResult.success && !smsResult.smsError) {
      // Real SMS was sent successfully
      response.message = 'OTP sent successfully to your mobile number';
    } else if (smsResult.dev || smsResult.smsError) {
      // In dev mode or when SMS failed but we're treating it as success
      response.message = 'OTP generated successfully';
    } else {
      // This shouldn't happen with our updated code, but just in case
      response.message = 'OTP generated but SMS delivery failed';
    }
    
    // Always include OTP in non-production environments
    // This makes testing easier without requiring real SMS delivery
    if (process.env.NODE_ENV !== 'production') {
      response.devOnly = {
        otp: otp,
        note: 'This OTP is only shown in development mode'
      };
      
      if (smsResult.smsError) {
        response.devOnly.smsError = smsResult.error;
        response.devOnly.errorCode = smsResult.code;
      }
    }
    
    // Send response (always 200 in dev, might be 207 in production if SMS fails)
    res.status(process.env.NODE_ENV !== 'production' ? 200 : (smsResult.success ? 200 : 207)).json(response);
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({
      success: false,
      message: 'Error processing OTP request',
      error: err.message
    });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    // Validation schema
    const schema = joi.object({
      mobileNumber: joi.string().pattern(/^[0-9]{10,15}$/).required(),
      otp: joi.string().length(6).required()
    });
    
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { mobileNumber, otp } = req.body;
    
    const validOTP = await OTP.findOne({ mobileNumber, otp });
    if (!validOTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    const otpAge = Date.now() - validOTP.createdAt.getTime();
    if (otpAge > 5 * 60 * 1000) {
      await OTP.deleteOne({ _id: validOTP._id });
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }

    let user = await User.findOne({ mobileNumber });
    if (!user) {
      user = await User.create({ mobileNumber });
    }

    // Generate JWT token
    const token = generateToken(user._id);
    
    // Clean up used OTP
    await OTP.deleteOne({ _id: validOTP._id });

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      token,
      user: {
        id: user._id,
        mobileNumber: user.mobileNumber,
        username: user.username,
        gender: user.gender,
        isProfileComplete: !!(user.username && user.dateOfBirth && user.gender)
      }
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({
      success: false,
      message: 'Error verifying OTP',
      error: err.message
    });
  }
};


exports.GetUsers = async (req, res) => {
  try {
    const Users = await userModel.find().select('-__v');
    if (!Users || Users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No users found"
      });
    }
    return res.status(200).json({
      success: true,
      data: Users,
      message: "Users retrieved successfully"
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};