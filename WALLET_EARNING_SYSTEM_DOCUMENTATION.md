# 💰 COMPLETE WALLET & EARNING SYSTEM - API DOCUMENTATION

## 🎯 Overview
Complete earning system where **only women earn money** and **men purchase coins** to interact with women. Women earn through call time, receive gifts, and can withdraw real money. Men recharge coins to make calls, send messages, and send gifts.

## 💡 **How It Works:**
- **👩 Women:** Earn hearts, coins, and real money through calls → Convert to cash → Withdraw to bank
- **👨 Men:** Purchase coins with real money → Spend coins on calls/gifts → Support women's earnings

---

## 👩 WOMEN'S EARNING SYSTEM

### **Get Women's Wallet Dashboard**

#### `GET /api/wallet/women/dashboard`
Complete wallet overview for women users.
```json
// Response:
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
      "callTime": 15 // minutes
    },
    "monthlyEarnings": {
      "hearts": 320,
      "coins": 180,
      "money": 90.00,
      "callTime": 240 // minutes
    },
    "statistics": {
      "totalCallTime": 1250, // total minutes
      "totalCalls": 45,
      "totalHeartsEarned": 2100,
      "totalCoinsEarned": 890,
      "totalMoneyEarned": 445.00
    },
    "conversionRates": {
      "heartsToMoney": 2.0, // ₹2 per heart
      "coinsToMoney": 0.5, // ₹0.5 per coin
      "callRates": {
        "heartsPerMinute": 2,
        "coinsPerMinute": 1
      }
    },
    "badges": [
      {
        "badgeId": "first_call",
        "name": "First Call",
        "description": "Complete your first call",
        "category": "call_time",
        "earnedAt": "2025-09-19T01:30:00.000Z"
      }
    ],
    "recentGifts": [
      {
        "giftName": "Rose",
        "giftValue": 5,
        "senderId": "user_123",
        "receivedAt": "2025-09-19T02:15:00.000Z"
      }
    ],
    "withdrawalSettings": {
      "minimumAmount": 100.0,
      "canWithdraw": false // Below minimum
    }
  }
}
```

### **How Women Earn Money:**

#### **📞 Call Earnings (Primary Income):**
- **Voice Calls:** 2 hearts + 1 coin per minute
- **Video Calls:** 2 hearts + 1 coin per minute  
- **Real Money:** 1 coin = ₹0.5, so ₹0.5 per minute
- **Hearts Value:** 1 heart = ₹2 (can be converted)

#### **🎁 Gift Earnings:**
- Receive gifts from men during calls
- Each gift has a heart value (5-100 hearts)
- Hearts can be converted to real money

#### **🏆 Badge Bonuses:**
- Earn bonus hearts for achievements
- Complete calls, hit milestones, earn badges
- Bonus hearts add to total earnings

---

## 💳 MONEY CONVERSION & WITHDRAWAL

### **Convert Hearts to Money**

#### `POST /api/wallet/women/convert-hearts`
Convert earned hearts to withdrawable cash.
```json
// Request:
{
  "hearts": 50
}

// Response:
{
  "success": true,
  "message": "Successfully converted 50 hearts to ₹100.00",
  "data": {
    "heartsConverted": 50,
    "moneyAdded": 100.00,
    "newBalances": {
      "redHearts": 100, // remaining hearts
      "realMoney": 142.50,
      "withdrawableAmount": 142.50
    }
  }
}
```

### **Request Money Withdrawal**

#### `POST /api/wallet/women/withdraw`
Withdraw earnings to bank account or UPI.
```json
// Request (Bank Transfer):
{
  "amount": 500.00,
  "method": "bank_transfer",
  "accountNumber": "1234567890123456",
  "ifscCode": "SBIN0001234",
  "accountHolder": "Priya Sharma"
}

// Request (UPI):
{
  "amount": 300.00,
  "method": "upi",
  "upiId": "priya@paytm"
}

// Response:
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

### **Get Withdrawal History**

#### `GET /api/wallet/women/withdrawals`
View all withdrawal requests and their status.
```json
// Response:
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
      },
      {
        "id": "withdrawal_124",
        "amount": 200.00,
        "method": "upi",
        "status": "pending",
        "requestedAt": "2025-09-19T09:15:00.000Z"
      }
    ],
    "totalWithdrawals": 2,
    "totalAmount": 700.00
  }
}
```

---

## 👨 MEN'S COIN RECHARGE SYSTEM

### **Get Men's Coin Balance**

#### `GET /api/wallet/men/balance`
View current coin balance and spending statistics.
```json
// Response:
{
  "success": true,
  "data": {
    "coinBalance": 125,
    "statistics": {
      "totalCoinsAdded": 500,
      "totalCoinsSpent": 375,
      "totalMoneySpent": 1999.00,
      "totalCalls": 15,
      "totalCallTime": 180 // minutes
    },
    "recentPurchases": [
      {
        "packageName": "Premium Pack",
        "coinsAdded": 125, // 100 + 25 bonus
        "amountPaid": 599,
        "purchasedAt": "2025-09-19T10:30:00.000Z",
        "status": "completed"
      }
    ],
    "recentExpenses": [
      {
        "type": "call",
        "coinsSpent": 15, // 3 coins/min × 5 minutes
        "recipientId": "user_456",
        "spentAt": "2025-09-19T11:15:00.000Z"
      },
      {
        "type": "gift",
        "coinsSpent": 5,
        "recipientId": "user_789",
        "giftId": "heart",
        "spentAt": "2025-09-19T11:20:00.000Z"
      }
    ]
  }
}
```

### **Get Available Coin Packages**

#### `GET /api/wallet/men/packages`
Browse coin packages for purchase.
```json
// Response:
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
        "isFeatured": false,
        "savings": null
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
      },
      {
        "packageId": "ultimate_500",
        "name": "Ultimate Pack",
        "description": "For the ultimate experience",
        "coins": 500,
        "bonusCoins": 200,
        "totalCoins": 700,
        "price": 1999,
        "pricePerCoin": 2.86,
        "isFeatured": false,
        "savings": "Save ₹571.80"
      }
    ],
    "callRates": {
      "voiceCallPerMinute": 3, // 3 coins per minute
      "videoCallPerMinute": 5, // 5 coins per minute
      "messagePrice": 1 // 1 coin per message
    }
  }
}
```

### **Purchase Coins**

#### `POST /api/wallet/men/purchase`
Buy a coin package.
```json
// Request:
{
  "packageId": "popular_50",
  "paymentMethod": "upi"
}

// Response:
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

---

## 📞 CALL TRACKING & EARNINGS

### **Start Call Session**

#### `POST /api/wallet/call/start`
Initialize a call for earning/spending tracking.
```json
// Request:
{
  "receiverId": "woman_user_123",
  "callType": "video" // or "voice"
}

// Response:
{
  "success": true,
  "message": "Call session started",
  "data": {
    "callId": "CALL_1695123456789_xyz789",
    "callType": "video",
    "receiverName": "Priya",
    "costPerMinute": 5, // coins per minute
    "yourCoinBalance": 125,
    "estimatedCostPer10Min": 50
  }
}
```

### **End Call Session**

#### `POST /api/wallet/call/end`
End call and calculate earnings/costs.
```json
// Request:
{
  "callId": "CALL_1695123456789_xyz789",
  "endReason": "completed"
}

// Response:
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
      "coinsSpent": 35, // 5 coins/min × 7 minutes
      "remainingBalance": 90
    },
    "receiver": {
      "heartsEarned": 14, // 2 hearts/min × 7 minutes
      "coinsEarned": 7, // 1 coin/min × 7 minutes
      "moneyEarned": 3.50 // ₹0.5 per coin
    },
    "endReason": "completed"
  }
}
```

---

## 🏆 BADGE SYSTEM

### **Get Available Badges**

#### `GET /api/wallet/badges/available`
View all achievable badges and requirements.
```json
// Response:
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
      },
      {
        "badgeId": "heart_queen",
        "name": "Heart Queen",
        "description": "Collect 1000 hearts",
        "category": "hearts",
        "requirement": "Earn 1000 hearts",
        "icon": "👑",
        "reward": "150 bonus hearts"
      }
    ],
    "totalBadges": 12,
    "categories": ["call_time", "hearts", "coins", "special", "monthly"]
  }
}
```

### **Get User's Earned Badges**

#### `GET /api/wallet/badges/earned`
View badges earned by the user.
```json
// Response:
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
      },
      {
        "badgeId": "heart_collector",
        "name": "Heart Collector",
        "description": "Collect 100 hearts",
        "category": "hearts",
        "earnedAt": "2025-09-19T02:45:00.000Z"
      }
    ],
    "totalBadges": 2,
    "progress": {
      "callTime": 85, // minutes
      "totalCalls": 12,
      "totalHearts": 156,
      "totalCoins": 78
    }
  }
}
```

---

## 🎁 GIFT SYSTEM

### **Get Available Gifts**

#### `GET /api/wallet/gifts/available`
Browse gifts that men can send to women.
```json
// Response:
{
  "success": true,
  "data": {
    "gifts": [
      {
        "giftId": "rose",
        "name": "Rose",
        "description": "A beautiful rose to show your appreciation",
        "value": 5, // hearts value for woman
        "coinCost": 3, // cost for man
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
    ],
    "categories": ["romantic", "sweet", "cute", "luxury"],
    "rarities": ["common", "uncommon", "rare", "legendary"]
  }
}
```

### **Send Gift**

#### `POST /api/wallet/gifts/send`
Send a gift to a woman (men only).
```json
// Request:
{
  "recipientId": "woman_user_456",
  "giftId": "heart",
  "callId": "CALL_123" // optional, if sent during call
}

// Response:
{
  "success": true,
  "message": "Heart sent successfully!",
  "data": {
    "gift": {
      "name": "Heart",
      "icon": "💝",
      "value": 10, // hearts for woman
      "coinCost": 5 // cost for man
    },
    "sender": {
      "coinsSpent": 5,
      "remainingCoins": 120
    },
    "recipient": {
      "heartsReceived": 10,
      "newBadges": [ // if any new badges earned
        {
          "badgeId": "heart_collector",
          "name": "Heart Collector",
          "heartsReward": 20
        }
      ]
    }
  }
}
```

### **Get Received Gifts (Women Only)**

#### `GET /api/wallet/gifts/received`
View gifts received from men.
```json
// Response:
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
      },
      {
        "giftName": "Rose",
        "giftValue": 5,
        "senderId": "man_user_123",
        "receivedAt": "2025-09-19T02:15:00.000Z"
      }
    ],
    "totalGifts": 25,
    "totalValue": 380 // total hearts received from gifts
  }
}
```

---

## 💰 COMPLETE EARNING FLOW EXAMPLE

### **For Women (Earning Journey):**

1. **📞 Take Calls:** 10-minute video call = 20 hearts + 10 coins + ₹5
2. **🎁 Receive Gifts:** Rose (5 hearts) + Diamond (50 hearts) = 55 hearts
3. **🏆 Earn Badges:** Complete 10 calls = 50 bonus hearts
4. **💳 Convert Hearts:** 125 hearts × ₹2 = ₹250
5. **💰 Total Earned:** ₹5 (calls) + ₹250 (hearts) = ₹255
6. **🏦 Withdraw:** Request withdrawal of ₹200 to bank account

### **For Men (Spending Journey):**

1. **💳 Buy Coins:** Purchase "Popular Pack" (60 coins) for ₹349
2. **📞 Make Calls:** 10-minute video call = 50 coins spent
3. **🎁 Send Gifts:** Send Rose (3 coins) + Heart (5 coins) = 8 coins
4. **💰 Total Spent:** 58 coins on interactions
5. **📊 Result:** Remaining balance: 2 coins

---

## 🎯 **Earning Rates Summary:**

### **📞 Call Earnings (Women):**
- **Voice Call:** ₹1.5/minute (2 hearts + 1 coin)
- **Video Call:** ₹1.5/minute (2 hearts + 1 coin)
- **Hearts Conversion:** 1 heart = ₹2
- **Coins Value:** 1 coin = ₹0.5

### **💳 Call Costs (Men):**
- **Voice Call:** 3 coins/minute
- **Video Call:** 5 coins/minute
- **Average Cost:** ₹10-17/minute depending on package

### **🎁 Gift Values:**
- **Rose:** 3 coins → 5 hearts (₹10 value for women)
- **Heart:** 5 coins → 10 hearts (₹20 value for women)
- **Diamond:** 25 coins → 50 hearts (₹100 value for women)
- **Crown:** 50 coins → 100 hearts (₹200 value for women)

### **💰 Withdrawal Limits:**
- **Minimum Withdrawal:** ₹100
- **Processing Time:** 2-3 business days
- **Methods:** Bank transfer, UPI, Paytm

**🎉 Complete earning system implemented! Women can now earn real money through calls and gifts, while men purchase coins to interact and support women's earnings.**