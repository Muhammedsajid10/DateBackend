const mongoose = require('mongoose');

// Women's Wallet & Earning System
const WalletSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        unique: true
        // Removed index: false as it conflicts with unique: true
    },
    
    // Current Balances
    balances: {
        // Hearts (earned from calls, chats, gifts)
        redHearts: { type: Number, default: 0 },
        
        // Coins (earned from calls - convertible to real money)
        coins: { type: Number, default: 0 },
        
        // Real money earned (INR)
        realMoney: { type: Number, default: 0.0 },
        
        // Withdrawal balance
        withdrawableAmount: { type: Number, default: 0.0 }
    },
    
    // Earning Statistics
    earnings: {
        // Total time spent on calls (in minutes)
        totalCallTime: { type: Number, default: 0 },
        
        // Total calls completed
        totalCalls: { type: Number, default: 0 },
        
        // Total hearts received
        totalHeartsEarned: { type: Number, default: 0 },
        
        // Total coins earned
        totalCoinsEarned: { type: Number, default: 0 },
        
        // Total real money earned
        totalMoneyEarned: { type: Number, default: 0.0 },
        
        // This month's earnings
        monthlyEarnings: {
            month: { type: String }, // "2025-09"
            hearts: { type: Number, default: 0 },
            coins: { type: Number, default: 0 },
            money: { type: Number, default: 0.0 },
            callTime: { type: Number, default: 0 }
        },
        
        // Today's earnings
        dailyEarnings: {
            date: { type: String }, // "2025-09-19"
            hearts: { type: Number, default: 0 },
            coins: { type: Number, default: 0 },
            money: { type: Number, default: 0.0 },
            callTime: { type: Number, default: 0 }
        }
    },
    
    // Earning Rates (per minute of call)
    rates: {
        heartsPerMinute: { type: Number, default: 2 }, // 2 hearts per minute
        coinsPerMinute: { type: Number, default: 1 }, // 1 coin per minute
        moneyPerCoin: { type: Number, default: 0.5 }, // ₹0.5 per coin
        conversionRate: { type: Number, default: 2.0 } // 1 heart = ₹2.0
    },
    
    // Badge System
    badges: [{
        badgeId: { type: String, required: true },
        name: { type: String, required: true },
        description: String,
        category: { 
            type: String, 
            enum: ['call_time', 'hearts', 'coins', 'special', 'monthly'], 
            required: true 
        },
        earnedAt: { type: Date, default: Date.now },
        isActive: { type: Boolean, default: true }
    }],
    
    // Gift History
    giftsReceived: [{
        giftId: { type: String, required: true },
        giftName: { type: String, required: true },
        giftValue: { type: Number, required: true }, // in hearts
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        receivedAt: { type: Date, default: Date.now },
        callId: String // if received during call
    }],
    
    // Withdrawal History
    withdrawals: [{
        amount: { type: Number, required: true },
        status: { 
            type: String, 
            enum: ['pending', 'processing', 'completed', 'failed'], 
            default: 'pending' 
        },
        method: { 
            type: String, 
            enum: ['bank_transfer', 'upi', 'paytm'], 
            required: true 
        },
        accountDetails: {
            accountNumber: String,
            ifscCode: String,
            accountHolder: String,
            upiId: String
        },
        requestedAt: { type: Date, default: Date.now },
        processedAt: Date,
        transactionId: String,
        adminNotes: String
    }],
    
    // Account Settings
    settings: {
        minimumWithdrawal: { type: Number, default: 100.0 }, // ₹100 minimum
        autoWithdraw: { type: Boolean, default: false },
        autoWithdrawThreshold: { type: Number, default: 1000.0 },
        enableEarnings: { type: Boolean, default: true },
        showEarningsToUsers: { type: Boolean, default: false }
    }
    
}, { 
    timestamps: true,
    collection: 'women_wallets'
});

// Men's Coin Balance (for recharging and spending)
const MenCoinBalanceSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        unique: true
    },
    
    // Current Balance
    coinBalance: { type: Number, default: 0 },
    
    // Purchase History
    purchases: [{
        packageId: String,
        packageName: String,
        coinsAdded: { type: Number, required: true },
        amountPaid: { type: Number, required: true }, // in INR
        paymentMethod: { 
            type: String, 
            enum: ['upi', 'card', 'net_banking', 'wallet'], 
            required: true 
        },
        paymentId: String,
        orderId: String,
        status: { 
            type: String, 
            enum: ['pending', 'completed', 'failed'], 
            default: 'pending' 
        },
        purchasedAt: { type: Date, default: Date.now }
    }],
    
    // Spending History
    expenses: [{
        type: { 
            type: String, 
            enum: ['call', 'message', 'gift'], 
            required: true 
        },
        coinsSpent: { type: Number, required: true },
        recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        callId: String,
        messageId: String,
        giftId: String,
        spentAt: { type: Date, default: Date.now }
    }],
    
    // Statistics
    statistics: {
        totalCoinsAdded: { type: Number, default: 0 },
        totalCoinsSpent: { type: Number, default: 0 },
        totalMoneySpent: { type: Number, default: 0.0 },
        totalCalls: { type: Number, default: 0 },
        totalCallTime: { type: Number, default: 0 }
    }
    
}, { 
    timestamps: true,
    collection: 'men_coin_balances'
});

// Call Session Tracking (for earning calculations)
const CallSessionSchema = new mongoose.Schema({
    callId: { type: String, required: true, unique: true },
    
    // Participants
    callerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Man
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Woman
    
    // Call Details
    callType: { type: String, enum: ['voice', 'video'], required: true },
    status: { 
        type: String, 
        enum: ['initiated', 'connected', 'ended', 'failed'], 
        default: 'initiated' 
    },
    
    // Timing
    startTime: { type: Date, required: true },
    endTime: Date,
    duration: { type: Number, default: 0 }, // in seconds
    durationMinutes: { type: Number, default: 0 }, // calculated field
    
    // Earnings (for woman)
    earnings: {
        heartsEarned: { type: Number, default: 0 },
        coinsEarned: { type: Number, default: 0 },
        moneyEarned: { type: Number, default: 0.0 }
    },
    
    // Cost (for man)
    cost: {
        coinsSpent: { type: Number, default: 0 },
        costPerMinute: { type: Number, default: 5 } // 5 coins per minute
    },
    
    // Call Rating
    rating: {
        callerRating: { type: Number, min: 1, max: 5 },
        receiverRating: { type: Number, min: 1, max: 5 }
    },
    
    // Additional Data
    connectionQuality: { type: String, enum: ['excellent', 'good', 'fair', 'poor'] },
    endReason: { 
        type: String, 
        enum: ['completed', 'caller_ended', 'receiver_ended', 'network_issue', 'insufficient_coins'] 
    }
    
}, { 
    timestamps: true,
    collection: 'call_sessions'
});

// Coin Packages (for men to purchase)
const CoinPackageSchema = new mongoose.Schema({
    packageId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: String,
    
    // Package Details
    coins: { type: Number, required: true },
    price: { type: Number, required: true }, // in INR
    pricePerCoin: { type: Number, required: true },
    
    // Bonus
    bonusCoins: { type: Number, default: 0 },
    bonusDescription: String,
    
    // Visibility
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    
    // Limits
    dailyLimit: Number, // max purchases per day
    monthlyLimit: Number,
    
    // Validity
    validFrom: { type: Date, default: Date.now },
    validUntil: Date
    
}, { 
    timestamps: true,
    collection: 'coin_packages'
});

// Indexes for better performance
WalletSchema.index({ userId: 1 });
WalletSchema.index({ 'earnings.monthlyEarnings.month': 1 });
WalletSchema.index({ 'earnings.dailyEarnings.date': 1 });

MenCoinBalanceSchema.index({ userId: 1 });
CallSessionSchema.index({ callId: 1 });
CallSessionSchema.index({ callerId: 1, receiverId: 1 });
CallSessionSchema.index({ startTime: 1 });

CoinPackageSchema.index({ isActive: 1, sortOrder: 1 });

// Methods for Wallet
WalletSchema.methods.addEarnings = function(callDuration, heartBonus = 0) {
    const minutes = Math.ceil(callDuration / 60);
    const heartsEarned = (minutes * this.rates.heartsPerMinute) + heartBonus;
    const coinsEarned = minutes * this.rates.coinsPerMinute;
    const moneyEarned = coinsEarned * this.rates.moneyPerCoin;
    
    // Update balances
    this.balances.redHearts += heartsEarned;
    this.balances.coins += coinsEarned;
    this.balances.realMoney += moneyEarned;
    this.balances.withdrawableAmount += moneyEarned;
    
    // Update statistics
    this.earnings.totalCallTime += minutes;
    this.earnings.totalCalls += 1;
    this.earnings.totalHeartsEarned += heartsEarned;
    this.earnings.totalCoinsEarned += coinsEarned;
    this.earnings.totalMoneyEarned += moneyEarned;
    
    // Update daily/monthly earnings
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().toISOString().substring(0, 7);
    
    if (this.earnings.dailyEarnings.date !== today) {
        this.earnings.dailyEarnings = {
            date: today,
            hearts: heartsEarned,
            coins: coinsEarned,
            money: moneyEarned,
            callTime: minutes
        };
    } else {
        this.earnings.dailyEarnings.hearts += heartsEarned;
        this.earnings.dailyEarnings.coins += coinsEarned;
        this.earnings.dailyEarnings.money += moneyEarned;
        this.earnings.dailyEarnings.callTime += minutes;
    }
    
    if (this.earnings.monthlyEarnings.month !== currentMonth) {
        this.earnings.monthlyEarnings = {
            month: currentMonth,
            hearts: heartsEarned,
            coins: coinsEarned,
            money: moneyEarned,
            callTime: minutes
        };
    } else {
        this.earnings.monthlyEarnings.hearts += heartsEarned;
        this.earnings.monthlyEarnings.coins += coinsEarned;
        this.earnings.monthlyEarnings.money += moneyEarned;
        this.earnings.monthlyEarnings.callTime += minutes;
    }
    
    return {
        heartsEarned,
        coinsEarned,
        moneyEarned,
        totalBalance: this.balances.withdrawableAmount
    };
};

// Calculate conversion rate for hearts to money
WalletSchema.methods.getConversionRate = function() {
    return {
        heartsToMoney: this.rates.conversionRate,
        coinsToMoney: this.rates.moneyPerCoin,
        callRates: {
            heartsPerMinute: this.rates.heartsPerMinute,
            coinsPerMinute: this.rates.coinsPerMinute
        }
    };
};

const Wallet = mongoose.model('Wallet', WalletSchema);
const MenCoinBalance = mongoose.model('MenCoinBalance', MenCoinBalanceSchema);
const CallSession = mongoose.model('CallSession', CallSessionSchema);
const CoinPackage = mongoose.model('CoinPackage', CoinPackageSchema);

module.exports = { Wallet, MenCoinBalance, CallSession, CoinPackage };