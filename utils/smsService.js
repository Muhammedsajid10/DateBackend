const twilio = require('twilio');
require('dotenv').config();

// Check if we're using test credentials
const isTestMode = process.env.TWILIO_ACCOUNT_SID === 'AC00000000000000000000000000000000' || 
                  process.env.TWILIO_PHONE_NUMBER === '+15005550006';

// Set development mode based on NODE_ENV
const DEV_MODE = isTestMode || process.env.NODE_ENV !== 'production'; 

// Flag to indicate if we should attempt real SMS delivery even in dev mode
const ATTEMPT_SMS_IN_DEV = true;

// Create a Twilio client instance
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Format phone number to ensure it has a country code
 * @param {string} mobileNumber - The phone number to format
 * @param {string} defaultCountryCode - Default country code to add if missing (default: +91 for India)
 * @returns {string} Formatted phone number with country code
 */
const formatPhoneNumber = (mobileNumber, defaultCountryCode = '+91') => {
  if (mobileNumber.startsWith('+')) {
    return mobileNumber;
  }
  
  // Remove leading zeros if any
  let cleaned = mobileNumber.replace(/^0+/, '');
  
  // Add country code
  return `${defaultCountryCode}${cleaned}`;
};

/**
 * Send SMS using Twilio
 * @param {string} to - Recipient phone number
 * @param {string} message - SMS message content
 * @returns {Promise} Promise resolving to Twilio message object or error
 */
const sendSMS = async (to, message) => {
  const formattedNumber = formatPhoneNumber(to);
  
  // Always log the message in development mode
  if (DEV_MODE) {
    console.log('┌─────────────────── DEV MODE SMS ────────────────────┐');
    console.log(`│ TO: ${formattedNumber}`);
    console.log(`│ FROM: ${process.env.TWILIO_PHONE_NUMBER}`);
    console.log(`│ MESSAGE: ${message}`);
    console.log('└─────────────────────────────────────────────────────┘');
    
    // If we don't want to attempt real SMS in dev, return simulated success
    if (!ATTEMPT_SMS_IN_DEV) {
      return { 
        success: true, 
        sid: `TEST-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        dev: true 
      };
    }
  }
  
  // Try to send real SMS (in production or if ATTEMPT_SMS_IN_DEV is true)
  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedNumber
    });
    
    console.log(`SMS sent successfully to ${to}, SID: ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('SMS delivery error:', error);
    
    // In development, treat this as success with a flag for fallback
    if (DEV_MODE) {
      return { 
        success: true, 
        dev: true,
        smsError: true,
        error: error.message,
        code: error.code || 'unknown'
      };
    }
    
    // In production, return failure
    return { 
      success: false, 
      error: error.message,
      code: error.code,
      status: error.status
    };
  }
};

/**
 * Send OTP via SMS
 * @param {string} to - Recipient phone number
 * @param {string} otp - The OTP to send
 * @returns {Promise} Promise resolving to result of SMS delivery
 */
const sendOTP = async (to, otp) => {
  const message = `Your HiMate Dating App verification code is: ${otp}. Valid for 5 minutes.`;
  return await sendSMS(to, message);
};

module.exports = {
  sendSMS,
  sendOTP,
  formatPhoneNumber
};