const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testAPI() {
    console.log('🧪 Testing HiMate Dating App API...\n');

    try {
        // Test 1: Health Check
        console.log('1. Testing Health Check...');
        const healthCheck = await axios.get(`${BASE_URL}/`);
        console.log('✅ Health Check:', healthCheck.data.message);

        // Test 2: API Status
        console.log('\n2. Testing API Status...');
        const apiStatus = await axios.get(`${BASE_URL}/api/status`);
        console.log('✅ API Status:', apiStatus.data.services);

        // Test 3: Send OTP
        console.log('\n3. Testing Send OTP...');
        const otpResponse = await axios.post(`${BASE_URL}/api/auth/send-otp`, {
            mobileNumber: '9876543210'
        });
        console.log('✅ OTP Sent:', otpResponse.data.message);

        // Test 4: Verify OTP (with test OTP)
        console.log('\n4. Testing Verify OTP...');
        const verifyResponse = await axios.post(`${BASE_URL}/api/auth/verify-otp`, {
            mobileNumber: '9876543210',
            otp: otpResponse.data.otp // Using the OTP from send-otp response
        });
        console.log('✅ OTP Verified:', verifyResponse.data.message);
        
        const authToken = verifyResponse.data.token;
        const userId = verifyResponse.data.user.id;
        console.log('🔑 Auth Token:', authToken.substring(0, 20) + '...');

        // Test 5: Get Profile (Protected Route)
        console.log('\n5. Testing Get Profile (Protected Route)...');
        const profileResponse = await axios.get(`${BASE_URL}/api/profile`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('✅ Profile Retrieved:', profileResponse.data.data.mobileNumber);

        // Test 6: Get Coin Balance
        console.log('\n6. Testing Get Coin Balance...');
        const balanceResponse = await axios.get(`${BASE_URL}/api/payment/balance`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('✅ Coin Balance:', balanceResponse.data.data.coins);

        // Test 7: Get Coin Packages
        console.log('\n7. Testing Get Coin Packages...');
        const packagesResponse = await axios.get(`${BASE_URL}/api/payment/packages`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('✅ Available Packages:', Object.keys(packagesResponse.data.data));

        console.log('\n🎉 All API tests passed successfully!');
        console.log('\n📝 Next Steps:');
        console.log('- Import the Postman collection for full API testing');
        console.log('- Set up frontend integration');
        console.log('- Configure live payment gateway');
        console.log('- Deploy to production server');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data?.message || error.message);
        if (error.response?.data) {
            console.error('Error details:', error.response.data);
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    testAPI();
}

module.exports = testAPI;