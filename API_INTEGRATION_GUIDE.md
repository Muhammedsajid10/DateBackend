# 🚀 HiMate Dating App - Frontend Integration Guide

## 📋 **Quick Start for Frontend Developers**

This guide provides everything you need to integrate the HiMate Dating App backend with your frontend application (React Native, Flutter, React, etc.).

---

## 🌐 **Base Configuration**

### **API Base URL:**
```javascript
// Development
const BASE_URL = "http://localhost:5000/api";

// Production (replace with your domain)
const BASE_URL = "https://your-domain.com/api";
```

### **Socket.IO URL:**
```javascript
// Development
const SOCKET_URL = "http://localhost:5000";

// Production
const SOCKET_URL = "https://your-domain.com";
```

---

## 🔐 **Authentication Flow**

### **1. Send OTP**
```javascript
// POST /api/auth/send-otp
const sendOTP = async (mobileNumber) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mobileNumber: mobileNumber // 10-digit mobile number
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('OTP sent successfully');
      return data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Send OTP Error:', error);
    throw error;
  }
};

// Usage
await sendOTP("9876543210");
```

### **2. Verify OTP & Login**
```javascript
// POST /api/auth/verify-otp
const verifyOTP = async (mobileNumber, otp) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mobileNumber: mobileNumber,
        otp: otp
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Store token for future API calls
      const token = data.data.token;
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('userId', data.data.user._id);
      
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Verify OTP Error:', error);
    throw error;
  }
};

// Usage
const loginData = await verifyOTP("9876543210", "123456");
```

### **3. Authentication Headers**
```javascript
// Get stored token for authenticated requests
const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Use in all authenticated API calls
const headers = await getAuthHeaders();
```

---

## 👤 **Profile Management**

### **1. Get Current User Profile**
```javascript
// GET /api/profile/
const getMyProfile = async () => {
  try {
    const response = await fetch(`${BASE_URL}/profile/`, {
      method: 'GET',
      headers: await getAuthHeaders()
    });
    
    const data = await response.json();
    return data.data; // User profile object
  } catch (error) {
    console.error('Get Profile Error:', error);
    throw error;
  }
};
```

### **2. Update Profile**
```javascript
// PUT /api/profile/update
const updateProfile = async (profileData) => {
  try {
    const response = await fetch(`${BASE_URL}/profile/update`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify({
        username: profileData.username,
        dateOfBirth: profileData.dateOfBirth, // YYYY-MM-DD format
        gender: profileData.gender, // "Male" or "Female"
        bio: profileData.bio,
        location: {
          city: profileData.city,
          state: profileData.state,
          country: profileData.country,
          coordinates: [longitude, latitude] // [lng, lat]
        },
        preferences: {
          ageRange: {
            min: profileData.minAge,
            max: profileData.maxAge
          },
          maxDistance: profileData.maxDistance, // in kilometers
          interestedIn: profileData.interestedIn // "Male", "Female", or "Both"
        }
      })
    });
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Update Profile Error:', error);
    throw error;
  }
};
```

### **3. Upload Profile Photos**
```javascript
// POST /api/profile/upload-photos
const uploadProfilePhotos = async (imageUris) => {
  try {
    const formData = new FormData();
    
    imageUris.forEach((uri, index) => {
      formData.append('photos', {
        uri: uri,
        type: 'image/jpeg',
        name: `profile_${index}.jpg`
      });
    });
    
    const token = await AsyncStorage.getItem('authToken');
    const response = await fetch(`${BASE_URL}/profile/upload-photos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData
    });
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Upload Photos Error:', error);
    throw error;
  }
};
```

### **4. Get Profile Completion Status**
```javascript
// GET /api/profile/completion-status
const getProfileCompletion = async () => {
  try {
    const response = await fetch(`${BASE_URL}/profile/completion-status`, {
      method: 'GET',
      headers: await getAuthHeaders()
    });
    
    const data = await response.json();
    return data.data; // Contains steps and completion status
  } catch (error) {
    console.error('Get Profile Completion Error:', error);
    throw error;
  }
};

// Response structure:
/*
{
  steps: {
    basicInfo: { isComplete: true, completedAt: "2025-09-19..." },
    photos: { isComplete: false, required: true },
    voiceVerification: { isComplete: false, required: true } // Women only
  },
  nextStep: "photos" // Next required step
}
*/
```

---

## 💕 **Matching System**

### **1. Get Potential Matches**
```javascript
// GET /api/matches/potential
const getPotentialMatches = async (page = 1, limit = 10) => {
  try {
    const response = await fetch(`${BASE_URL}/matches/potential?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: await getAuthHeaders()
    });
    
    const data = await response.json();
    return data.data; // Array of potential match users
  } catch (error) {
    console.error('Get Potential Matches Error:', error);
    throw error;
  }
};
```

### **2. Swipe User (Like/Dislike/Super Like)**
```javascript
// POST /api/matches/swipe
const swipeUser = async (targetUserId, action) => {
  try {
    const response = await fetch(`${BASE_URL}/matches/swipe`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({
        targetUserId: targetUserId,
        action: action // "like", "dislike", or "superlike"
      })
    });
    
    const data = await response.json();
    
    if (data.data.isMatch) {
      // It's a match! Show match animation
      console.log('🎉 It\'s a Match!');
      return { isMatch: true, matchData: data.data };
    }
    
    return { isMatch: false };
  } catch (error) {
    console.error('Swipe Error:', error);
    throw error;
  }
};

// Usage
const result = await swipeUser("user123", "like");
if (result.isMatch) {
  // Show match celebration screen
  showMatchAnimation(result.matchData);
}
```

### **3. Get Current Matches**
```javascript
// GET /api/matches/
const getMatches = async () => {
  try {
    const response = await fetch(`${BASE_URL}/matches/`, {
      method: 'GET',
      headers: await getAuthHeaders()
    });
    
    const data = await response.json();
    return data.data; // Array of matched users
  } catch (error) {
    console.error('Get Matches Error:', error);
    throw error;
  }
};
```

---

## 💬 **Chat System**

### **1. Send Message**
```javascript
// POST /api/messages/send
const sendMessage = async (receiverId, message, messageType = 'text') => {
  try {
    const response = await fetch(`${BASE_URL}/messages/send`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({
        receiverId: receiverId,
        message: message,
        messageType: messageType // 'text', 'image', 'voice', etc.
      })
    });
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Send Message Error:', error);
    throw error;
  }
};
```

### **2. Get Conversation**
```javascript
// GET /api/messages/conversation/:receiverId
const getConversation = async (receiverId, page = 1, limit = 50) => {
  try {
    const response = await fetch(
      `${BASE_URL}/messages/conversation/${receiverId}?page=${page}&limit=${limit}`, 
      {
        method: 'GET',
        headers: await getAuthHeaders()
      }
    );
    
    const data = await response.json();
    return data.data; // Array of messages
  } catch (error) {
    console.error('Get Conversation Error:', error);
    throw error;
  }
};
```

### **3. Get All Conversations**
```javascript
// GET /api/messages/conversations
const getAllConversations = async () => {
  try {
    const response = await fetch(`${BASE_URL}/messages/conversations`, {
      method: 'GET',
      headers: await getAuthHeaders()
    });
    
    const data = await response.json();
    return data.data; // Array of conversation previews
  } catch (error) {
    console.error('Get Conversations Error:', error);
    throw error;
  }
};
```

---

## 💰 **Wallet & Earning System**

### **For Women - Earning Dashboard**
```javascript
// GET /api/wallet/women/dashboard
const getWomenWallet = async () => {
  try {
    const response = await fetch(`${BASE_URL}/wallet/women/dashboard`, {
      method: 'GET',
      headers: await getAuthHeaders()
    });
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Get Women Wallet Error:', error);
    throw error;
  }
};

// Response structure:
/*
{
  balances: {
    redHearts: 150,
    coins: 85,
    realMoney: 42.50,
    withdrawableAmount: 42.50
  },
  todayEarnings: { hearts: 25, coins: 12, money: 6.00 },
  monthlyEarnings: { hearts: 320, coins: 180, money: 90.00 },
  conversionRates: { heartsToMoney: 2.0, coinsToMoney: 0.5 }
}
*/
```

### **For Women - Convert Hearts to Money**
```javascript
// POST /api/wallet/women/convert-hearts
const convertHeartsToMoney = async (hearts) => {
  try {
    const response = await fetch(`${BASE_URL}/wallet/women/convert-hearts`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ hearts: hearts })
    });
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Convert Hearts Error:', error);
    throw error;
  }
};
```

### **For Women - Request Withdrawal**
```javascript
// POST /api/wallet/women/withdraw
const requestWithdrawal = async (amount, method, accountDetails) => {
  try {
    const requestBody = {
      amount: amount,
      method: method // "bank_transfer" or "upi"
    };
    
    if (method === "bank_transfer") {
      requestBody.accountNumber = accountDetails.accountNumber;
      requestBody.ifscCode = accountDetails.ifscCode;
      requestBody.accountHolder = accountDetails.accountHolder;
    } else if (method === "upi") {
      requestBody.upiId = accountDetails.upiId;
    }
    
    const response = await fetch(`${BASE_URL}/wallet/women/withdraw`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(requestBody)
    });
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Request Withdrawal Error:', error);
    throw error;
  }
};

// Usage
await requestWithdrawal(500, "bank_transfer", {
  accountNumber: "1234567890123456",
  ifscCode: "SBIN0001234",
  accountHolder: "Priya Sharma"
});
```

### **For Men - Get Coin Packages**
```javascript
// GET /api/wallet/men/packages
const getCoinPackages = async () => {
  try {
    const response = await fetch(`${BASE_URL}/wallet/men/packages`, {
      method: 'GET',
      headers: await getAuthHeaders()
    });
    
    const data = await response.json();
    return data.data.packages; // Array of coin packages
  } catch (error) {
    console.error('Get Coin Packages Error:', error);
    throw error;
  }
};
```

### **For Men - Purchase Coins**
```javascript
// POST /api/wallet/men/purchase
const purchaseCoins = async (packageId, paymentMethod = "upi") => {
  try {
    const response = await fetch(`${BASE_URL}/wallet/men/purchase`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({
        packageId: packageId, // e.g., "popular_50"
        paymentMethod: paymentMethod
      })
    });
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Purchase Coins Error:', error);
    throw error;
  }
};
```

---

## 🎁 **Gift System**

### **Get Available Gifts**
```javascript
// GET /api/wallet/gifts/available
const getAvailableGifts = async () => {
  try {
    const response = await fetch(`${BASE_URL}/wallet/gifts/available`, {
      method: 'GET',
      headers: await getAuthHeaders()
    });
    
    const data = await response.json();
    return data.data.gifts; // Array of available gifts
  } catch (error) {
    console.error('Get Available Gifts Error:', error);
    throw error;
  }
};
```

### **Send Gift (Men to Women)**
```javascript
// POST /api/wallet/gifts/send
const sendGift = async (recipientId, giftId, callId = null) => {
  try {
    const response = await fetch(`${BASE_URL}/wallet/gifts/send`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({
        recipientId: recipientId,
        giftId: giftId, // e.g., "rose", "heart", "diamond"
        callId: callId // optional, if sent during call
      })
    });
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Send Gift Error:', error);
    throw error;
  }
};

// Usage
await sendGift("woman_user_456", "heart"); // Send heart gift
```

---

## 📞 **Call System Integration**

### **Start Call Session**
```javascript
// POST /api/wallet/call/start
const startCallSession = async (receiverId, callType) => {
  try {
    const response = await fetch(`${BASE_URL}/wallet/call/start`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({
        receiverId: receiverId,
        callType: callType // "voice" or "video"
      })
    });
    
    const data = await response.json();
    return data.data; // Contains callId and cost info
  } catch (error) {
    console.error('Start Call Error:', error);
    throw error;
  }
};
```

### **End Call Session**
```javascript
// POST /api/wallet/call/end
const endCallSession = async (callId, endReason = "completed") => {
  try {
    const response = await fetch(`${BASE_URL}/wallet/call/end`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({
        callId: callId,
        endReason: endReason
      })
    });
    
    const data = await response.json();
    return data.data; // Contains earnings/costs and duration
  } catch (error) {
    console.error('End Call Error:', error);
    throw error;
  }
};
```

---

## 🔊 **Voice Verification (Women Only)**

### **Get Verification Phrase**
```javascript
// GET /api/voice-verification/phrase
const getVerificationPhrase = async () => {
  try {
    const response = await fetch(`${BASE_URL}/voice-verification/phrase`, {
      method: 'GET',
      headers: await getAuthHeaders()
    });
    
    const data = await response.json();
    return data.data.phrase; // Random phrase to record
  } catch (error) {
    console.error('Get Verification Phrase Error:', error);
    throw error;
  }
};
```

### **Upload Voice Recording**
```javascript
// POST /api/voice-verification/upload
const uploadVoiceVerification = async (audioUri, phrase) => {
  try {
    const formData = new FormData();
    formData.append('voice', {
      uri: audioUri,
      type: 'audio/wav',
      name: 'voice_verification.wav'
    });
    formData.append('phrase', phrase);
    
    const token = await AsyncStorage.getItem('authToken');
    const response = await fetch(`${BASE_URL}/voice-verification/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData
    });
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Upload Voice Error:', error);
    throw error;
  }
};
```

---

## 🎮 **Gaming System**

### **Get Available Games**
```javascript
// GET /api/games/available
const getAvailableGames = async () => {
  try {
    const response = await fetch(`${BASE_URL}/games/available`, {
      method: 'GET',
      headers: await getAuthHeaders()
    });
    
    const data = await response.json();
    return data.data; // Array of available games
  } catch (error) {
    console.error('Get Available Games Error:', error);
    throw error;
  }
};
```

### **Create Game Session**
```javascript
// POST /api/games/create
const createGameSession = async (gameType, maxPlayers = 2) => {
  try {
    const response = await fetch(`${BASE_URL}/games/create`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({
        gameType: gameType, // "tic-tac-toe", "rock-paper-scissors", etc.
        maxPlayers: maxPlayers
      })
    });
    
    const data = await response.json();
    return data.data; // Game session details with roomId
  } catch (error) {
    console.error('Create Game Error:', error);
    throw error;
  }
};
```

---

## 🔄 **Real-time Features (Socket.IO)**

### **Initialize Socket Connection**
```javascript
import io from 'socket.io-client';

const initializeSocket = (userId, username) => {
  const socket = io(SOCKET_URL, {
    transports: ['websocket'],
    upgrade: true
  });
  
  socket.on('connect', () => {
    console.log('Connected to server');
    
    // Authenticate user
    socket.emit('authenticate', {
      userId: userId,
      username: username
    });
  });
  
  return socket;
};
```

### **Chat Events**
```javascript
// Join conversation room
socket.emit('join-room', `conversation_${userId1}_${userId2}`);

// Send message (for real-time delivery)
socket.emit('send-message', {
  receiverId: receiverId,
  message: message,
  messageType: 'text'
});

// Listen for incoming messages
socket.on('receive-message', (data) => {
  console.log('New message received:', data);
  // Update chat UI with new message
  addMessageToChat(data);
});

// Typing indicators
socket.emit('typing', {
  receiverId: receiverId,
  isTyping: true
});

socket.on('user-typing', (data) => {
  console.log(`${data.senderId} is typing...`);
  showTypingIndicator(data.senderId, data.isTyping);
});
```

### **Call Events**
```javascript
// Start a call
socket.emit('call-user', {
  targetUserId: targetUserId,
  sdpOffer: sdpOffer, // WebRTC SDP offer
  callType: 'video' // or 'voice'
});

// Listen for incoming calls
socket.on('incoming-call', (data) => {
  console.log('Incoming call from:', data.callerUserId);
  showIncomingCallScreen(data);
});

// Accept call
socket.emit('call-accepted', {
  callerUserId: callerUserId,
  sdpAnswer: sdpAnswer // WebRTC SDP answer
});

// End call
socket.emit('end-call', {
  otherUserId: otherUserId
});

socket.on('call-ended', (data) => {
  console.log('Call ended by:', data.initiatorUserId);
  endCallUI();
});
```

### **Match Notifications**
```javascript
// Listen for new matches
socket.on('new-match', (matchData) => {
  console.log('New match found!', matchData);
  showMatchNotification(matchData);
});
```

---

## 📊 **Error Handling**

### **Standard Error Response Format**
```javascript
// All API errors follow this format:
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}

// Success responses:
{
  "success": true,
  "data": { /* response data */ },
  "message": "Success message"
}
```

### **Common Error Handling**
```javascript
const handleApiError = (error, response) => {
  if (response?.status === 401) {
    // Token expired, redirect to login
    redirectToLogin();
  } else if (response?.status === 403) {
    // Forbidden, show access denied
    showErrorMessage('Access denied');
  } else if (response?.status === 429) {
    // Rate limited
    showErrorMessage('Too many requests. Please try again later.');
  } else {
    // Generic error
    showErrorMessage(error.message || 'Something went wrong');
  }
};

// Usage in API calls
try {
  const data = await sendOTP(mobileNumber);
} catch (error) {
  handleApiError(error, error.response);
}
```

---

## 🔧 **Development Setup**

### **Environment Variables**
Create `.env` file in backend:
```bash
PORT=5000
MONGODB_URI=mongodb://localhost:27017/himate_dating_app
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### **Starting the Backend Server**
```bash
cd NovoXDatingApp
npm install
npm start
```

Server will run on `http://localhost:5000`

### **API Testing**
Use the provided **Postman Collection** (`HiMate_Dating_App_API.postman_collection.json`) for testing all endpoints.

---

## 📱 **Mobile App Integration Checklist**

### **Authentication Flow:**
- ✅ OTP-based login screen
- ✅ Token storage (AsyncStorage/SecureStore)
- ✅ Auto-login with stored token
- ✅ Logout functionality

### **Profile Setup:**
- ✅ Multi-step profile creation wizard
- ✅ Photo upload from camera/gallery
- ✅ Voice recording for verification (women)
- ✅ Location permission and selection

### **Main App Features:**
- ✅ Swipe cards for matching
- ✅ Match celebration animation
- ✅ Real-time chat interface
- ✅ Voice/video calling with WebRTC
- ✅ Earning dashboard (women)
- ✅ Coin purchase flow (men)
- ✅ Gift sending interface

### **Real-time Features:**
- ✅ Socket.IO integration
- ✅ Live chat updates
- ✅ Call notifications
- ✅ Match notifications
- ✅ Online status indicators

---

## 🚀 **Production Deployment**

### **Backend Deployment:**
1. Deploy to cloud service (AWS, Heroku, DigitalOcean)
2. Set up MongoDB Atlas or similar
3. Configure environment variables
4. Set up SSL certificate
5. Update CORS and Socket.IO origins

### **Mobile App Configuration:**
1. Update `BASE_URL` to production domain
2. Update `SOCKET_URL` to production domain
3. Test all API endpoints
4. Configure push notifications
5. Set up app store deployment

---

## 📞 **Support & Integration Help**

### **Documentation Files:**
- `API_INTEGRATION_GUIDE.md` (this file)
- `WALLET_EARNING_SYSTEM_DOCUMENTATION.md`
- `VOICE_VERIFICATION_DOCUMENTATION.md`
- `GROUP_FEATURE_DOCUMENTATION.md`
- `KYC_AVATAR_DOCUMENTATION.md`
- `HiMate_Dating_App_API.postman_collection.json`

### **Sample Frontend Code:**
Check the examples above for React Native integration patterns.

### **Testing:**
Use Postman collection for API testing before frontend integration.

---

🎉 **Your HiMate Dating App backend is ready for frontend integration!** All APIs are documented and tested. Frontend developers can use this guide to build amazing mobile applications with complete features.