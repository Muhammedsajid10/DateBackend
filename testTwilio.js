require('dotenv').config();
const { sendSMS, sendOTP } = require('./utils/smsService');
const generateOTP = require('./utils/otpGenerator');

// Function to test SMS sending
async function testSMS() {
  // Check if Twilio credentials are configured
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
    console.error('❌ Error: Twilio credentials are missing in .env file');
    console.log('Please ensure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER are set');
    return;
  }

  // Test phone number - must be verified in your Twilio trial account
  const testPhoneNumber = '+918089391497'; // Replace this with your verified phone number
  
  console.log('🔍 Testing Twilio SMS integration...');
  console.log(`📱 Sending test message to: ${testPhoneNumber}`);
  
  try {
    const result = await sendSMS(testPhoneNumber, 'This is a test message from HiMate Dating App. If you received this, the Twilio integration is working correctly!');
    
    if (result.success) {
      console.log('✅ SMS sent successfully!');
      console.log(`📝 Message SID: ${result.sid}`);
      if (result.dev) {
        console.log('Note: Running in development mode - no actual SMS was sent');
      }
    } else {
      console.error('❌ Failed to send SMS');
      console.error('Error details:', result.error);
      console.error('Error code:', result.code);
      console.error('HTTP status:', result.status);
    }
  } catch (error) {
    console.error('❌ Unexpected error occurred:', error);
  }
}

// Function to test OTP sending
async function testOTP() {
  const testPhoneNumber = '+918089391497'; // Using the same verified phone number as in testSMS
  const otp = generateOTP();
  
  console.log('🔍 Testing OTP delivery...');
  console.log(`📱 Sending OTP to: ${testPhoneNumber}`);
  console.log(`🔢 Generated OTP: ${otp}`);
  
  try {
    const result = await sendOTP(testPhoneNumber, otp);
    
    if (result.success) {
      console.log('✅ OTP sent successfully!');
      if (result.dev) {
        console.log('Note: Running in development mode - no actual SMS was sent');
      }
    } else {
      console.error('❌ Failed to send OTP');
      console.error('Error details:', result.error);
    }
  } catch (error) {
    console.error('❌ Unexpected error occurred:', error);
  }
}

// Only run the test if this file is executed directly
if (require.main === module) {
  // Determine which test to run based on command line argument
  const args = process.argv.slice(2);
  const testType = args[0] || 'both'; // Default to both tests
  
  const runTests = async () => {
    if (testType === 'sms' || testType === 'both') {
      await testSMS();
      console.log('\n');
    }
    
    if (testType === 'otp' || testType === 'both') {
      await testOTP();
    }
    
    console.log('\n🏁 Testing completed');
  };
  
  runTests();
}

module.exports = { testSMS, testOTP };