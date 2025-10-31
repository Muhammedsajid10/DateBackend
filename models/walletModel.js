const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        unique: true
    },
    
    balances: {
        redHearts: { type: Number, default: 0 },
        coins: { type: Number, default: 0 },
        realMoney: { type: Number, default: 0.0 },
        withdrawableAmount: { type: Number, default: 0.0 }
    },
    
    earnings: {
        totalCallTime: { type: Number, default: 0 },
        totalCalls: { type: Number, default: 0 },
        totalHeartsEarned: { type: Number, default: 0 },
        totalCoinsEarned: { type: Number, default: 0 },
        totalMoneyEarned: { type: Number, default: 0.0 },
        monthlyEarnings: {
            month: { type: String },
            hearts: { type: Number, default: 0 },
            coins: { type: Number, default: 0 },
            money: { type: Number, default: 0.0 },
            callTime: { type: Number, default: 0 }
        },
        dailyEarnings: {
            date: { type: String },
            hearts: { type: Number, default: 0 },
            coins: { type: Number, default: 0 },
            money: { type: Number, default: 0.0 },
            callTime: { type: Number, default: 0 }
        }
    },
    
    rates: {
        heartsPerMinute: { type: Number, default: 2 },
        coinsPerMinute: { type: Number, default: 1 },
        moneyPerCoin: { type: Number, default: 0.5 },
        conversionRate: { type: Number, default: 2.0 }
    },
    
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
    
    giftsReceived: [{
        giftId: { type: String, required: true },
        giftName: { type: String, required: true },
        giftValue: { type: Number, required: true },
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        receivedAt: { type: Date, default: Date.now },
        callId: String
    }],
    
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
    
    settings: {
        minimumWithdrawal: { type: Number, default: 100.0 },
        autoWithdraw: { type: Boolean, default: false },
        autoWithdrawThreshold: { type: Number, default: 1000.0 },
        enableEarnings: { type: Boolean, default: true },
        showEarningsToUsers: { type: Boolean, default: false }
    }
    
}, { 
    timestamps: true,
    collection: 'women_wallets'
});

const MenCoinBalanceSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        unique: true
    },
    
    coinBalance: { type: Number, default: 0 },
    
    purchases: [{
        packageId: String,
        packageName: String,
        coinsAdded: { type: Number, required: true },
        amountPaid: { type: Number, required: true },
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

const CallSessionSchema = new mongoose.Schema({
    callId: { type: String, required: true, unique: true },
    
    callerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    callType: { type: String, enum: ['voice', 'video'], required: true },
    status: { 
        type: String, 
        enum: ['initiated', 'connected', 'ended', 'failed'], 
        default: 'initiated' 
    },
    
    startTime: { type: Date, required: true },
    endTime: Date,
    duration: { type: Number, default: 0 },
    durationMinutes: { type: Number, default: 0 },
    
    earnings: {
        heartsEarned: { type: Number, default: 0 },
        coinsEarned: { type: Number, default: 0 },
        moneyEarned: { type: Number, default: 0.0 }
    },
    
    cost: {
        coinsSpent: { type: Number, default: 0 },
        costPerMinute: { type: Number, default: 5 }
    },
    
    rating: {
        callerRating: { type: Number, min: 1, max: 5 },
        receiverRating: { type: Number, min: 1, max: 5 }
    },
    
    connectionQuality: { type: String, enum: ['excellent', 'good', 'fair', 'poor'] },
    endReason: { 
        type: String, 
        enum: ['completed', 'caller_ended', 'receiver_ended', 'network_issue', 'insufficient_coins'] 
    }
    
}, { 
    timestamps: true,
    collection: 'call_sessions'
});

const CoinPackageSchema = new mongoose.Schema({
    packageId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: String,
    
    coins: { type: Number, required: true },
    price: { type: Number, required: true },
    pricePerCoin: { type: Number, required: true },
    
    bonusCoins: { type: Number, default: 0 },
    bonusDescription: String,
    
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    
    dailyLimit: Number,
    monthlyLimit: Number,
    
    validFrom: { type: Date, default: Date.now },
    validUntil: Date
    
}, { 
    timestamps: true,
    collection: 'coin_packages'
});

WalletSchema.index({ userId: 1 });
WalletSchema.index({ 'earnings.monthlyEarnings.month': 1 });
WalletSchema.index({ 'earnings.dailyEarnings.date': 1 });

MenCoinBalanceSchema.index({ userId: 1 });
CallSessionSchema.index({ callId: 1 });
CallSessionSchema.index({ callerId: 1, receiverId: 1 });
CallSessionSchema.index({ startTime: 1 });

CoinPackageSchema.index({ isActive: 1, sortOrder: 1 });
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