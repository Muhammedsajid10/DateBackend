# 🚀 HiMate Dating App - Complete API Documentation

## 📋 **API Overview**

**Base URL:** `http://localhost:5000/api` (Development)  
**Base URL:** `https://your-domain.com/api` (Production)

**Authentication:** Bearer Token (JWT)  
**Content-Type:** `application/json`

---

## 🔐 **Authentication Endpoints**

### **1. Send OTP**
**Endpoint:** `POST /api/auth/send-otp`  
**Public:** Yes  
**Rate Limit:** 5 requests per 15 minutes

```json
// Request
{
  "mobileNumber": "9876543210"
}

// Success Response (200)
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "mobileNumber": "9876543210",
    "expiresIn": "5 minutes"
  }
}

// Error Response (400)
{
  "success": false,
  "message": "Invalid mobile number format"
}
```

### **2. Verify OTP**
**Endpoint:** `POST /api/auth/verify-otp`  
**Public:** Yes  
**Rate Limit:** 5 requests per 15 minutes

```json
// Request
{
  "mobileNumber": "9876543210",
  "otp": "123456"
}

// Success Response (200)
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "user_id_here",
      "mobileNumber": "9876543210",
      "username": "John Doe",
      "gender": "Male",
      "isProfileComplete": true
    }
  }
}

// Error Response (400)
{
  "success": false,
  "message": "Invalid or expired OTP"
}
```

### **3. Get All Users**
**Endpoint:** `GET /api/auth/users`  
**Authentication:** Required  
**Role:** Any authenticated user

```json
// Success Response (200)
{
  "success": true,
  "data": [
    {
      "_id": "user_id_1",
      "mobileNumber": "9876543210",
      "username": "John Doe",
      "gender": "Male",
      "profilePictures": ["url1", "url2"],
      "isOnline": true
    }
  ],
  "message": "Users retrieved successfully"
}
```

---

## 👤 **Profile Management Endpoints**

### **1. Get Current User Profile**
**Endpoint:** `GET /api/profile/`  
**Authentication:** Required

```json
// Success Response (200)
{
  "success": true,
  "data": {
    "_id": "user_id",
    "mobileNumber": "9876543210",
    "username": "John Doe",
    "dateOfBirth": "1995-05-15T00:00:00.000Z",
    "gender": "Male",
    "bio": "Love traveling and meeting new people",
    "profilePictures": ["url1", "url2"],
    "location": {
      "city": "Mumbai",
      "state": "Maharashtra",
      "country": "India",
      "coordinates": [72.8777, 19.0760]
    },
    "preferences": {
      "ageRange": { "min": 22, "max": 30 },
      "maxDistance": 50,
      "interestedIn": "Female"
    },
    "coins": 150,
    "isOnline": true,
    "lastSeen": "2025-09-19T10:30:00.000Z"
  },
  "profileCompletion": {
    "basicInfo": { "isComplete": true },
    "photos": { "isComplete": true },
    "voiceVerification": { "isComplete": false },
    "isComplete": false,
    "nextStep": "voiceVerification"
  }
}
```

### **2. Update Profile**
**Endpoint:** `PUT /api/profile/update`  
**Authentication:** Required

```json
// Request
{
  "username": "John Doe Updated",
  "dateOfBirth": "1995-05-15",
  "gender": "Male",
  "bio": "Updated bio text",
  "location": {
    "city": "Mumbai",
    "state": "Maharashtra", 
    "country": "India",
    "coordinates": [72.8777, 19.0760]
  },
  "preferences": {
    "ageRange": { "min": 22, "max": 32 },
    "maxDistance": 75,
    "interestedIn": "Female"
  }
}

// Success Response (200)
{
  "success": true,
  "data": { /* updated user object */ },
  "message": "Profile updated successfully"
}
```

### **3. Upload Profile Photos**
**Endpoint:** `POST /api/profile/upload-photos`  
**Authentication:** Required  
**Content-Type:** `multipart/form-data`

```javascript
// FormData Request
const formData = new FormData();
formData.append('photos', file1);
formData.append('photos', file2);
// ... up to 5 photos
```

```json
// Success Response (200)
{
  "success": true,
  "data": {
    "profilePictures": ["new_url1", "new_url2"],
    "photosUploaded": 2
  },
  "message": "Photos uploaded successfully"
}
```

### **4. Delete Profile Picture**
**Endpoint:** `DELETE /api/profile/photo`  
**Authentication:** Required

```json
// Request
{
  "photoUrl": "url_to_delete"
}

// Success Response (200)
{
  "success": true,
  "message": "Photo deleted successfully"
}
```

### **5. Search Users**
**Endpoint:** `GET /api/profile/search`  
**Authentication:** Required

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 10)
- `gender` (optional): Filter by gender
- `minAge` (optional): Minimum age
- `maxAge` (optional): Maximum age
- `maxDistance` (optional): Maximum distance in km
- `city` (optional): Filter by city

```json
// Success Response (200)
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "user_id",
        "username": "Jane Doe",
        "age": 25,
        "gender": "Female",
        "profilePictures": ["url1"],
        "bio": "Love hiking",
        "distance": 5.2,
        "isOnline": true
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalUsers": 48,
      "hasNext": true
    }
  }
}
```

### **6. Get Random Online Users**
**Endpoint:** `GET /api/profile/random-online`  
**Authentication:** Required

```json
// Success Response (200)
{
  "success": true,
  "data": [
    {
      "_id": "user_id",
      "username": "Random User",
      "age": 28,
      "profilePictures": ["url1"],
      "isOnline": true,
      "lastSeen": "2025-09-19T10:30:00.000Z"
    }
  ]
}
```

### **7. Update Online Status**
**Endpoint:** `PUT /api/profile/online-status`  
**Authentication:** Required

```json
// Request
{
  "isOnline": true
}

// Success Response (200)
{
  "success": true,
  "message": "Online status updated"
}
```

### **8. Get Profile Completion Status**
**Endpoint:** `GET /api/profile/completion-status`  
**Authentication:** Required

```json
// Success Response (200)
{
  "success": true,
  "data": {
    "steps": {
      "basicInfo": {
        "isComplete": true,
        "required": true,
        "description": "Complete basic information",
        "completedAt": "2025-09-19T10:00:00.000Z"
      },
      "photos": {
        "isComplete": true,
        "required": true,
        "description": "Upload at least one profile photo",
        "completedAt": "2025-09-19T10:15:00.000Z"
      },
      "voiceVerification": {
        "isComplete": false,
        "required": true,
        "description": "Complete voice verification (women only)",
        "requiredFor": ["Female"]
      }
    },
    "isComplete": false,
    "nextStep": "voiceVerification",
    "completionPercentage": 66
  }
}
```

---

## 💕 **Matching System Endpoints**

### **1. Get Potential Matches**
**Endpoint:** `GET /api/matches/potential`  
**Authentication:** Required

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 10)

```json
// Success Response (200)
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "user_id",
        "username": "Jane Smith",
        "age": 26,
        "gender": "Female",
        "profilePictures": ["url1", "url2"],
        "bio": "Love music and dancing",
        "distance": 8.5,
        "commonInterests": ["music", "travel"],
        "isOnline": true
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "hasNext": true
    }
  }
}
```

### **2. Swipe User**
**Endpoint:** `POST /api/matches/swipe`  
**Authentication:** Required

```json
// Request
{
  "targetUserId": "user_id_to_swipe",
  "action": "like" // "like", "dislike", or "superlike"
}

// Success Response - No Match (200)
{
  "success": true,
  "data": {
    "action": "like",
    "targetUserId": "user_id",
    "isMatch": false,
    "coinsDeducted": 0
  },
  "message": "Swipe recorded successfully"
}

// Success Response - Match! (200)
{
  "success": true,
  "data": {
    "action": "like",
    "targetUserId": "user_id",
    "isMatch": true,
    "matchId": "match_id",
    "matchedUser": {
      "_id": "user_id",
      "username": "Jane Smith",
      "profilePictures": ["url1"]
    },
    "coinsDeducted": 0
  },
  "message": "It's a match! 🎉"
}

// Success Response - Super Like (200)
{
  "success": true,
  "data": {
    "action": "superlike",
    "targetUserId": "user_id",
    "isMatch": false,
    "coinsDeducted": 5
  },
  "message": "Super like sent!"
}
```

### **3. Get Current Matches**
**Endpoint:** `GET /api/matches/`  
**Authentication:** Required

```json
// Success Response (200)
{
  "success": true,
  "data": [
    {
      "_id": "match_id",
      "matchedUser": {
        "_id": "user_id",
        "username": "Jane Smith",
        "profilePictures": ["url1"],
        "isOnline": true
      },
      "matchedAt": "2025-09-19T10:30:00.000Z",
      "lastMessage": {
        "message": "Hey! How are you?",
        "timestamp": "2025-09-19T11:00:00.000Z",
        "isRead": false
      }
    }
  ]
}
```

### **4. Unmatch User**
**Endpoint:** `DELETE /api/matches/:matchId`  
**Authentication:** Required

```json
// Success Response (200)
{
  "success": true,
  "message": "User unmatched successfully"
}
```

---

## 💬 **Messaging Endpoints**

### **1. Send Message**
**Endpoint:** `POST /api/messages/send`  
**Authentication:** Required

```json
// Request
{
  "receiverId": "user_id",
  "message": "Hello! How are you?",
  "messageType": "text" // "text", "image", "voice", "video"
}

// Success Response (200)
{
  "success": true,
  "data": {
    "_id": "message_id",
    "sender": "current_user_id",
    "receiver": "user_id",
    "message": "Hello! How are you?",
    "messageType": "text",
    "timestamp": "2025-09-19T10:30:00.000Z",
    "isRead": false
  },
  "message": "Message sent successfully"
}
```

### **2. Get Conversation**
**Endpoint:** `GET /api/messages/conversation/:receiverId`  
**Authentication:** Required

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Messages per page (default: 50)

```json
// Success Response (200)
{
  "success": true,
  "data": {
    "messages": [
      {
        "_id": "message_id",
        "sender": "user_id_1",
        "receiver": "user_id_2",
        "message": "Hello!",
        "messageType": "text",
        "timestamp": "2025-09-19T10:30:00.000Z",
        "isRead": true
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "hasNext": true
    }
  }
}
```

### **3. Get All Conversations**
**Endpoint:** `GET /api/messages/conversations`  
**Authentication:** Required

```json
// Success Response (200)
{
  "success": true,
  "data": [
    {
      "user": {
        "_id": "user_id",
        "username": "Jane Smith",
        "profilePictures": ["url1"],
        "isOnline": true
      },
      "lastMessage": {
        "message": "See you tomorrow!",
        "timestamp": "2025-09-19T11:00:00.000Z",
        "isRead": false,
        "messageType": "text"
      },
      "unreadCount": 2
    }
  ]
}
```

### **4. Mark Message as Read**
**Endpoint:** `PUT /api/messages/read/:messageId`  
**Authentication:** Required

```json
// Success Response (200)
{
  "success": true,
  "message": "Message marked as read"
}
```

---

## 💰 **Wallet & Earning Endpoints**

### **Women's Wallet Endpoints**

#### **1. Get Wallet Dashboard**
**Endpoint:** `GET /api/wallet/women/dashboard`  
**Authentication:** Required (Women only)

```json
// Success Response (200)
{
  "success": true,
  "data": {
    "balances": {
      "redHearts": 150,
      "coins": 85,
      "realMoney": 42.50,
      "withdrawableAmount": 42.50
    },
    "todayEarnings": {
      "hearts": 25,
      "coins": 12,
      "money": 6.00,
      "callTime": 15
    },
    "monthlyEarnings": {
      "hearts": 320,
      "coins": 180,
      "money": 90.00,
      "callTime": 240
    },
    "statistics": {
      "totalCallTime": 1250,
      "totalCalls": 45,
      "totalHeartsEarned": 2100,
      "totalCoinsEarned": 890,
      "totalMoneyEarned": 445.00
    },
    "conversionRates": {
      "heartsToMoney": 2.0,
      "coinsToMoney": 0.5,
      "callRates": {
        "heartsPerMinute": 2,
        "coinsPerMinute": 1
      }
    },
    "withdrawalSettings": {
      "minimumAmount": 100.0,
      "canWithdraw": false
    }
  }
}
```

#### **2. Convert Hearts to Money**
**Endpoint:** `POST /api/wallet/women/convert-hearts`  
**Authentication:** Required (Women only)

```json
// Request
{
  "hearts": 50
}

// Success Response (200)
{
  "success": true,
  "message": "Successfully converted 50 hearts to ₹100.00",
  "data": {
    "heartsConverted": 50,
    "moneyAdded": 100.00,
    "newBalances": {
      "redHearts": 100,
      "realMoney": 142.50,
      "withdrawableAmount": 142.50
    }
  }
}
```

#### **3. Request Withdrawal**
**Endpoint:** `POST /api/wallet/women/withdraw`  
**Authentication:** Required (Women only)

```json
// Request (Bank Transfer)
{
  "amount": 500.00,
  "method": "bank_transfer",
  "accountNumber": "1234567890123456",
  "ifscCode": "SBIN0001234",
  "accountHolder": "Priya Sharma"
}

// Request (UPI)
{
  "amount": 300.00,
  "method": "upi",
  "upiId": "priya@paytm"
}

// Success Response (200)
{
  "success": true,
  "message": "Withdrawal request submitted successfully",
  "data": {
    "withdrawalId": "withdrawal_123",
    "amount": 500.00,
    "method": "bank_transfer",
    "status": "pending",
    "estimatedProcessingTime": "2-3 business days",
    "remainingBalance": 42.50
  }
}
```

#### **4. Get Withdrawal History**
**Endpoint:** `GET /api/wallet/women/withdrawals`  
**Authentication:** Required (Women only)

```json
// Success Response (200)
{
  "success": true,
  "data": {
    "withdrawals": [
      {
        "id": "withdrawal_123",
        "amount": 500.00,
        "method": "bank_transfer",
        "status": "completed",
        "requestedAt": "2025-09-15T10:30:00.000Z",
        "processedAt": "2025-09-17T14:20:00.000Z",
        "transactionId": "TXN123456789"
      }
    ],
    "totalWithdrawals": 5,
    "totalAmount": 2500.00
  }
}
```

### **Men's Coin Endpoints**

#### **1. Get Coin Balance**
**Endpoint:** `GET /api/wallet/men/balance`  
**Authentication:** Required (Men only)

```json
// Success Response (200)
{
  "success": true,
  "data": {
    "coinBalance": 125,
    "statistics": {
      "totalCoinsAdded": 500,
      "totalCoinsSpent": 375,
      "totalMoneySpent": 1999.00,
      "totalCalls": 15,
      "totalCallTime": 180
    },
    "recentPurchases": [
      {
        "packageName": "Premium Pack",
        "coinsAdded": 125,
        "amountPaid": 599,
        "purchasedAt": "2025-09-19T10:30:00.000Z",
        "status": "completed"
      }
    ]
  }
}
```

#### **2. Get Coin Packages**
**Endpoint:** `GET /api/wallet/men/packages`  
**Authentication:** Required (Men only)

```json
// Success Response (200)
{
  "success": true,
  "data": {
    "packages": [
      {
        "packageId": "starter_10",
        "name": "Starter Pack",
        "description": "Perfect for trying out the app",
        "coins": 10,
        "bonusCoins": 0,
        "totalCoins": 10,
        "price": 99,
        "pricePerCoin": 9.90,
        "isFeatured": false
      },
      {
        "packageId": "popular_50",
        "name": "Popular Pack",
        "description": "Most popular choice",
        "coins": 50,
        "bonusCoins": 10,
        "totalCoins": 60,
        "price": 349,
        "pricePerCoin": 5.82,
        "isFeatured": true,
        "savings": "Save ₹58.20"
      }
    ],
    "callRates": {
      "voiceCallPerMinute": 3,
      "videoCallPerMinute": 5,
      "messagePrice": 1
    }
  }
}
```

#### **3. Purchase Coins**
**Endpoint:** `POST /api/wallet/men/purchase`  
**Authentication:** Required (Men only)

```json
// Request
{
  "packageId": "popular_50",
  "paymentMethod": "upi"
}

// Success Response (200)
{
  "success": true,
  "message": "Successfully purchased 60 coins",
  "data": {
    "orderId": "ORDER_1695123456789_abc123",
    "paymentId": "PAY_1695123456789_def456",
    "packageName": "Popular Pack",
    "coinsAdded": 60,
    "bonusCoins": 10,
    "amountPaid": 349,
    "newCoinBalance": 185,
    "transactionStatus": "completed"
  }
}
```

### **Call Tracking Endpoints**

#### **1. Start Call Session**
**Endpoint:** `POST /api/wallet/call/start`  
**Authentication:** Required

```json
// Request
{
  "receiverId": "woman_user_123",
  "callType": "video" // or "voice"
}

// Success Response (200)
{
  "success": true,
  "message": "Call session started",
  "data": {
    "callId": "CALL_1695123456789_xyz789",
    "callType": "video",
    "receiverName": "Priya",
    "costPerMinute": 5,
    "yourCoinBalance": 125,
    "estimatedCostPer10Min": 50
  }
}
```

#### **2. End Call Session**
**Endpoint:** `POST /api/wallet/call/end`  
**Authentication:** Required

```json
// Request
{
  "callId": "CALL_1695123456789_xyz789",
  "endReason": "completed"
}

// Success Response (200)
{
  "success": true,
  "message": "Call session ended successfully",
  "data": {
    "callId": "CALL_1695123456789_xyz789",
    "duration": {
      "seconds": 420,
      "minutes": 7,
      "formatted": "0:07"
    },
    "caller": {
      "coinsSpent": 35,
      "remainingBalance": 90
    },
    "receiver": {
      "heartsEarned": 14,
      "coinsEarned": 7,
      "moneyEarned": 3.50
    },
    "endReason": "completed"
  }
}
```

---

## 🎁 **Gift System Endpoints**

### **1. Get Available Gifts**
**Endpoint:** `GET /api/wallet/gifts/available`  
**Authentication:** Required

```json
// Success Response (200)
{
  "success": true,
  "data": {
    "gifts": [
      {
        "giftId": "rose",
        "name": "Rose",
        "description": "A beautiful rose",
        "value": 5,
        "coinCost": 3,
        "icon": "🌹",
        "category": "romantic",
        "rarity": "common"
      },
      {
        "giftId": "diamond",
        "name": "Diamond",
        "description": "Precious diamond gift",
        "value": 50,
        "coinCost": 25,
        "icon": "💎",
        "category": "luxury",
        "rarity": "rare"
      }
    ]
  }
}
```

### **2. Send Gift**
**Endpoint:** `POST /api/wallet/gifts/send`  
**Authentication:** Required (Men only)

```json
// Request
{
  "recipientId": "woman_user_456",
  "giftId": "heart",
  "callId": "CALL_123" // optional
}

// Success Response (200)
{
  "success": true,
  "message": "Heart sent successfully!",
  "data": {
    "gift": {
      "name": "Heart",
      "icon": "💝",
      "value": 10,
      "coinCost": 5
    },
    "sender": {
      "coinsSpent": 5,
      "remainingCoins": 120
    },
    "recipient": {
      "heartsReceived": 10
    }
  }
}
```

### **3. Get Received Gifts (Women Only)**
**Endpoint:** `GET /api/wallet/gifts/received`  
**Authentication:** Required (Women only)

```json
// Success Response (200)
{
  "success": true,
  "data": {
    "gifts": [
      {
        "giftName": "Diamond",
        "giftValue": 50,
        "senderId": "man_user_789",
        "receivedAt": "2025-09-19T03:20:00.000Z",
        "callId": "CALL_456"
      }
    ],
    "totalGifts": 25,
    "totalValue": 380
  }
}
```

---

## 🏆 **Badge System Endpoints**

### **1. Get Available Badges**
**Endpoint:** `GET /api/wallet/badges/available`  
**Authentication:** Required

```json
// Success Response (200)
{
  "success": true,
  "data": {
    "badges": [
      {
        "badgeId": "first_call",
        "name": "First Call",
        "description": "Complete your first call",
        "category": "call_time",
        "requirement": "Complete 1 call",
        "icon": "📞",
        "reward": "10 bonus hearts"
      }
    ],
    "totalBadges": 12,
    "categories": ["call_time", "hearts", "coins", "special", "monthly"]
  }
}
```

### **2. Get User's Earned Badges**
**Endpoint:** `GET /api/wallet/badges/earned`  
**Authentication:** Required

```json
// Success Response (200)
{
  "success": true,
  "data": {
    "earnedBadges": [
      {
        "badgeId": "first_call",
        "name": "First Call",
        "description": "Complete your first call",
        "category": "call_time",
        "earnedAt": "2025-09-19T01:30:00.000Z"
      }
    ],
    "totalBadges": 2,
    "progress": {
      "callTime": 85,
      "totalCalls": 12,
      "totalHearts": 156,
      "totalCoins": 78
    }
  }
}
```

---

## 🔊 **Voice Verification Endpoints (Women Only)**

### **1. Get Verification Requirements**
**Endpoint:** `GET /api/voice-verification/requirements`  
**Authentication:** Required (Women only)

```json
// Success Response (200)
{
  "success": true,
  "data": {
    "isRequired": true,
    "isCompleted": false,
    "currentStatus": "pending",
    "requirements": {
      "audioFormat": "wav, mp3, m4a",
      "maxFileSize": "10MB",
      "minDuration": "3 seconds",
      "maxDuration": "10 seconds"
    },
    "steps": [
      "Get verification phrase",
      "Record your voice saying the phrase",
      "Upload the recording",
      "Wait for verification"
    ]
  }
}
```

### **2. Get Verification Phrase**
**Endpoint:** `GET /api/voice-verification/phrase`  
**Authentication:** Required (Women only)

```json
// Success Response (200)
{
  "success": true,
  "data": {
    "phrase": "Hello, my name is Sarah and I love dancing under the moonlight",
    "phraseId": "phrase_123",
    "expiresIn": "1 hour"
  },
  "message": "Please record yourself saying this phrase clearly"
}
```

### **3. Upload Voice Recording**
**Endpoint:** `POST /api/voice-verification/upload`  
**Authentication:** Required (Women only)  
**Content-Type:** `multipart/form-data`

```javascript
// FormData Request
const formData = new FormData();
formData.append('voice', audioFile);
formData.append('phrase', 'Hello, my name is...');
```

```json
// Success Response (200)
{
  "success": true,
  "data": {
    "verificationId": "verification_123",
    "status": "pending",
    "uploadedAt": "2025-09-19T10:30:00.000Z",
    "estimatedProcessingTime": "2-5 minutes"
  },
  "message": "Voice uploaded successfully. Verification in progress..."
}
```

### **4. Check Verification Status**
**Endpoint:** `GET /api/voice-verification/status/:verificationId`  
**Authentication:** Required (Women only)

```json
// Success Response (200) - Approved
{
  "success": true,
  "data": {
    "verificationId": "verification_123",
    "status": "approved",
    "processedAt": "2025-09-19T10:35:00.000Z",
    "confidence": 0.95
  },
  "message": "Voice verification successful!"
}

// Success Response (200) - Rejected
{
  "success": true,
  "data": {
    "verificationId": "verification_123",
    "status": "rejected",
    "reason": "Audio quality too low",
    "processedAt": "2025-09-19T10:35:00.000Z",
    "canRetry": true
  },
  "message": "Voice verification failed. Please try again."
}
```

### **5. Retry Verification**
**Endpoint:** `POST /api/voice-verification/retry`  
**Authentication:** Required (Women only)

```json
// Success Response (200)
{
  "success": true,
  "data": {
    "newPhrase": "The quick brown fox jumps over the lazy dog",
    "attemptsRemaining": 2
  },
  "message": "You can retry voice verification"
}
```

---

## 🎭 **Avatar System Endpoints**

### **1. Get Recommended Avatars**
**Endpoint:** `GET /api/avatars/recommended`  
**Authentication:** Required

```json
// Success Response (200)
{
  "success": true,
  "data": {
    "avatars": [
      {
        "_id": "avatar_1",
        "name": "Modern Male 1",
        "imageUrl": "https://example.com/avatar1.png",
        "category": "modern",
        "gender": "male",
        "isPopular": true
      }
    ],
    "categories": ["modern", "classic", "artistic", "casual"],
    "totalAvatars": 25
  }
}
```

### **2. Select Avatar**
**Endpoint:** `POST /api/avatars/select`  
**Authentication:** Required

```json
// Request
{
  "avatarId": "avatar_1"
}

// Success Response (200)
{
  "success": true,
  "data": {
    "selectedAvatar": {
      "_id": "avatar_1",
      "name": "Modern Male 1",
      "imageUrl": "https://example.com/avatar1.png"
    }
  },
  "message": "Avatar selected successfully"
}
```

### **3. Get User's Current Avatar**
**Endpoint:** `GET /api/avatars/my-avatar`  
**Authentication:** Required

```json
// Success Response (200)
{
  "success": true,
  "data": {
    "currentAvatar": {
      "_id": "avatar_1",
      "name": "Modern Male 1",
      "imageUrl": "https://example.com/avatar1.png",
      "selectedAt": "2025-09-19T10:30:00.000Z"
    }
  }
}
```

---

## 📋 **KYC Verification Endpoints**

### **1. Submit Personal Information**
**Endpoint:** `POST /api/kyc/personal-info`  
**Authentication:** Required

```json
// Request
{
  "registeredName": "John Doe",
  "mobileNumber": "9876543210",
  "phoneNumber": "+91-9876543210",
  "emailId": "john@example.com"
}

// Success Response (200)
{
  "success": true,
  "data": {
    "kycId": "kyc_123",
    "step": "personal_info",
    "status": "completed",
    "nextStep": "bank_details"
  },
  "message": "Personal information submitted successfully"
}
```

### **2. Submit Bank Details**
**Endpoint:** `POST /api/kyc/bank-details`  
**Authentication:** Required

```json
// Request
{
  "registeredName": "John Doe",
  "ifscCode": "SBIN0001234",
  "accountNumber": "1234567890123456"
}

// Success Response (200)
{
  "success": true,
  "data": {
    "kycId": "kyc_123",
    "step": "bank_details",
    "status": "completed",
    "nextStep": "document_upload"
  },
  "message": "Bank details submitted successfully"
}
```

### **3. Upload Aadhaar Documents**
**Endpoint:** `POST /api/kyc/upload-aadhaar`  
**Authentication:** Required  
**Content-Type:** `multipart/form-data`

```javascript
// FormData Request
const formData = new FormData();
formData.append('document', aadhaarFile);
formData.append('documentType', 'aadhaar_front'); // or 'aadhaar_back'
```

```json
// Success Response (200)
{
  "success": true,
  "data": {
    "kycId": "kyc_123",
    "documentType": "aadhaar_front",
    "uploadedAt": "2025-09-19T10:30:00.000Z",
    "status": "uploaded",
    "nextStep": "aadhaar_back"
  },
  "message": "Aadhaar front uploaded successfully"
}
```

### **4. Get KYC Status**
**Endpoint:** `GET /api/kyc/status`  
**Authentication:** Required

```json
// Success Response (200)
{
  "success": true,
  "data": {
    "kycId": "kyc_123",
    "overallStatus": "in_progress",
    "steps": {
      "personalInfo": {
        "status": "completed",
        "completedAt": "2025-09-19T10:00:00.000Z"
      },
      "bankDetails": {
        "status": "completed",
        "completedAt": "2025-09-19T10:15:00.000Z"
      },
      "documentUpload": {
        "status": "pending",
        "aadhaarFront": "uploaded",
        "aadhaarBack": "pending"
      }
    },
    "nextStep": "aadhaar_back",
    "completionPercentage": 75
  }
}
```

---

## 🎮 **Gaming System Endpoints**

### **1. Get Available Games**
**Endpoint:** `GET /api/games/available`  
**Authentication:** Required

```json
// Success Response (200)
{
  "success": true,
  "data": [
    {
      "gameId": "tic-tac-toe",
      "name": "Tic Tac Toe",
      "description": "Classic 3x3 grid game",
      "maxPlayers": 2,
      "coinCost": 5,
      "winnerReward": 8,
      "estimatedDuration": "2-5 minutes",
      "icon": "⭕"
    },
    {
      "gameId": "rock-paper-scissors",
      "name": "Rock Paper Scissors",
      "description": "Best of 3 rounds",
      "maxPlayers": 2,
      "coinCost": 3,
      "winnerReward": 5,
      "estimatedDuration": "1-2 minutes",
      "icon": "✂️"
    }
  ]
}
```

### **2. Create Game Session**
**Endpoint:** `POST /api/games/create`  
**Authentication:** Required

```json
// Request
{
  "gameType": "tic-tac-toe",
  "maxPlayers": 2
}

// Success Response (200)
{
  "success": true,
  "data": {
    "roomId": "game_room_123",
    "gameType": "tic-tac-toe",
    "creator": "user_id",
    "maxPlayers": 2,
    "currentPlayers": 1,
    "status": "waiting",
    "coinCost": 5,
    "createdAt": "2025-09-19T10:30:00.000Z"
  },
  "message": "Game session created successfully"
}
```

### **3. Join Game Session**
**Endpoint:** `POST /api/games/join/:roomId`  
**Authentication:** Required

```json
// Success Response (200)
{
  "success": true,
  "data": {
    "roomId": "game_room_123",
    "gameType": "tic-tac-toe",
    "currentPlayers": 2,
    "players": [
      {
        "userId": "user_1",
        "username": "John",
        "isReady": true
      },
      {
        "userId": "user_2", 
        "username": "Jane",
        "isReady": false
      }
    ],
    "status": "waiting_for_ready",
    "coinCost": 5
  },
  "message": "Joined game successfully"
}
```

### **4. Update Player Ready Status**
**Endpoint:** `PUT /api/games/:roomId/ready`  
**Authentication:** Required

```json
// Request
{
  "isReady": true
}

// Success Response (200)
{
  "success": true,
  "data": {
    "roomId": "game_room_123",
    "playerReady": true,
    "allPlayersReady": true,
    "gameStatus": "active"
  },
  "message": "Ready status updated. Game starting!"
}
```

### **5. End Game**
**Endpoint:** `POST /api/games/:roomId/end`  
**Authentication:** Required

```json
// Request
{
  "winnerId": "user_1", // or null for draw
  "gameData": {
    "moves": ["X", "O", "X", "O", "X", "O", "X"],
    "result": "player1_wins"
  }
}

// Success Response (200)
{
  "success": true,
  "data": {
    "roomId": "game_room_123",
    "winner": {
      "userId": "user_1",
      "username": "John",
      "coinsWon": 8
    },
    "loser": {
      "userId": "user_2",
      "username": "Jane",
      "coinsLost": 5
    },
    "gameData": { /* game specific data */ },
    "endedAt": "2025-09-19T10:45:00.000Z"
  },
  "message": "Game ended successfully"
}
```

---

## ⚠️ **Error Response Formats**

### **Standard Error Responses**

#### **400 - Bad Request**
```json
{
  "success": false,
  "message": "Invalid request data",
  "errors": [
    {
      "field": "mobileNumber",
      "message": "Mobile number must be 10 digits"
    }
  ]
}
```

#### **401 - Unauthorized**
```json
{
  "success": false,
  "message": "Authentication required",
  "error": "No token provided"
}
```

#### **403 - Forbidden**
```json
{
  "success": false,
  "message": "Access denied",
  "error": "Insufficient permissions"
}
```

#### **404 - Not Found**
```json
{
  "success": false,
  "message": "Resource not found",
  "error": "User not found"
}
```

#### **429 - Rate Limited**
```json
{
  "success": false,
  "message": "Too many requests",
  "error": "Rate limit exceeded. Try again later."
}
```

#### **500 - Internal Server Error**
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Database connection failed"
}
```

---

## 🔐 **Authentication Headers**

### **Required for Protected Endpoints:**
```javascript
{
  "Authorization": "Bearer your_jwt_token_here",
  "Content-Type": "application/json"
}
```

### **For File Uploads:**
```javascript
{
  "Authorization": "Bearer your_jwt_token_here",
  "Content-Type": "multipart/form-data"
}
```

---

## 📊 **Rate Limiting**

### **General API Endpoints:**
- **Limit:** 100 requests per 15 minutes per IP
- **Headers:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`

### **Authentication Endpoints:**
- **Limit:** 5 requests per 15 minutes per IP
- **Endpoints:** `/api/auth/send-otp`, `/api/auth/verify-otp`

---

## 🌐 **Socket.IO Events**

### **Connection Events**
```javascript
// Authenticate user after connection
socket.emit('authenticate', {
  userId: 'user_id',
  username: 'username'
});

// Join chat room
socket.emit('join-room', 'conversation_user1_user2');
```

### **Chat Events**
```javascript
// Send message
socket.emit('send-message', {
  receiverId: 'user_id',
  message: 'Hello!',
  messageType: 'text'
});

// Listen for messages
socket.on('receive-message', (data) => {
  console.log('New message:', data);
});

// Typing indicators
socket.emit('typing', {
  receiverId: 'user_id',
  isTyping: true
});

socket.on('user-typing', (data) => {
  console.log(`${data.senderId} is typing...`);
});
```

### **Call Events**
```javascript
// Start call
socket.emit('call-user', {
  targetUserId: 'user_id',
  sdpOffer: sdpOffer,
  callType: 'video'
});

// Listen for incoming calls
socket.on('incoming-call', (data) => {
  console.log('Incoming call from:', data.callerUserId);
});

// Accept call
socket.emit('call-accepted', {
  callerUserId: 'caller_id',
  sdpAnswer: sdpAnswer
});

// End call
socket.emit('end-call', {
  otherUserId: 'other_user_id'
});
```

---

## 📱 **Frontend Integration Checklist**

### **Authentication Flow**
- ✅ OTP input screens
- ✅ Token storage (AsyncStorage)
- ✅ Auto-login with stored token
- ✅ Token refresh handling

### **Profile Management**
- ✅ Profile creation wizard
- ✅ Photo upload interface
- ✅ Voice recording (women)
- ✅ Avatar selection

### **Core Features**
- ✅ Swipe cards interface
- ✅ Match celebration screen
- ✅ Chat interface with real-time updates
- ✅ Call interface with WebRTC
- ✅ Earning dashboard (women)
- ✅ Coin purchase flow (men)

### **Real-time Features**
- ✅ Socket.IO integration
- ✅ Live message updates
- ✅ Call notifications
- ✅ Match notifications

---

This comprehensive API documentation provides everything frontend developers need to integrate with the HiMate Dating App backend. All endpoints are tested and ready for production use.