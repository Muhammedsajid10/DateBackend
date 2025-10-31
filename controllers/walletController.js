const { Wallet, MenCoinBalance, CallSession, CoinPackage } = require('../models/walletModel');
const User = require('../models/userModel');
const Joi = require('joi');

// ======================
// WOMEN'S WALLET SYSTEM
// ======================

// Get Women's Wallet Dashboard
exports.getWomenWallet = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        
        // Only women can access wallet
        if (!user || user.gender !== 'Female') {
            return res.status(403).json({
                success: false,
                message: 'Only women can access the wallet system'
            });
        }
        
        // Get or create wallet
        let wallet = await Wallet.findOne({ userId: req.user.userId });
        if (!wallet) {
            wallet = new Wallet({ userId: req.user.userId });
            await wallet.save();
        }
        
        // Update daily/monthly tracking if needed
        const today = new Date().toISOString().split('T')[0];
        const currentMonth = new Date().toISOString().substring(0, 7);
        
        if (wallet.earnings.dailyEarnings.date !== today) {
            wallet.earnings.dailyEarnings = {
                date: today,
                hearts: 0,
                coins: 0,
                money: 0.0,
                callTime: 0
            };
        }
        
        if (wallet.earnings.monthlyEarnings.month !== currentMonth) {
            wallet.earnings.monthlyEarnings = {
                month: currentMonth,
                hearts: 0,
                coins: 0,
                money: 0.0,
                callTime: 0
            };
        }
        
        await wallet.save();
        
        // Calculate conversion rates
        const conversionRates = wallet.getConversionRate();
        
        res.json({
            success: true,
            data: {
                // Current Balances
                balances: {
                    redHearts: wallet.balances.redHearts,
                    coins: wallet.balances.coins,
                    realMoney: parseFloat(wallet.balances.realMoney.toFixed(2)),
                    withdrawableAmount: parseFloat(wallet.balances.withdrawableAmount.toFixed(2))
                },
                
                // Today's Earnings
                todayEarnings: {
                    hearts: wallet.earnings.dailyEarnings.hearts,
                    coins: wallet.earnings.dailyEarnings.coins,
                    money: parseFloat(wallet.earnings.dailyEarnings.money.toFixed(2)),
                    callTime: wallet.earnings.dailyEarnings.callTime
                },
                
                // This Month's Earnings
                monthlyEarnings: {
                    hearts: wallet.earnings.monthlyEarnings.hearts,
                    coins: wallet.earnings.monthlyEarnings.coins,
                    money: parseFloat(wallet.earnings.monthlyEarnings.money.toFixed(2)),
                    callTime: wallet.earnings.monthlyEarnings.callTime
                },
                
                // Overall Statistics
                statistics: {
                    totalCallTime: wallet.earnings.totalCallTime,
                    totalCalls: wallet.earnings.totalCalls,
                    totalHeartsEarned: wallet.earnings.totalHeartsEarned,
                    totalCoinsEarned: wallet.earnings.totalCoinsEarned,
                    totalMoneyEarned: parseFloat(wallet.earnings.totalMoneyEarned.toFixed(2))
                },
                
                // Conversion Rates
                conversionRates: conversionRates,
                
                // Badges
                badges: wallet.badges.filter(badge => badge.isActive),
                
                // Recent Gifts (last 10)
                recentGifts: wallet.giftsReceived.slice(-10),
                
                // Withdrawal Settings
                withdrawalSettings: {
                    minimumAmount: wallet.settings.minimumWithdrawal,
                    canWithdraw: wallet.balances.withdrawableAmount >= wallet.settings.minimumWithdrawal
                }
            }
        });
        
    } catch (error) {
        console.error('Get women wallet error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get wallet information'
        });
    }
};

// Convert Hearts to Real Money
exports.convertHeartsToMoney = async (req, res) => {
    try {
        const { hearts } = req.body;
        
        if (!hearts || hearts <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid hearts amount'
            });
        }
        
        const wallet = await Wallet.findOne({ userId: req.user.userId });
        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: 'Wallet not found'
            });
        }
        
        if (wallet.balances.redHearts < hearts) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient hearts balance'
            });
        }
        
        // Convert hearts to money
        const moneyToAdd = hearts * wallet.rates.conversionRate;
        
        wallet.balances.redHearts -= hearts;
        wallet.balances.realMoney += moneyToAdd;
        wallet.balances.withdrawableAmount += moneyToAdd;
        
        await wallet.save();
        
        res.json({
            success: true,
            message: `Successfully converted ${hearts} hearts to ₹${moneyToAdd.toFixed(2)}`,
            data: {
                heartsConverted: hearts,
                moneyAdded: parseFloat(moneyToAdd.toFixed(2)),
                newBalances: {
                    redHearts: wallet.balances.redHearts,
                    realMoney: parseFloat(wallet.balances.realMoney.toFixed(2)),
                    withdrawableAmount: parseFloat(wallet.balances.withdrawableAmount.toFixed(2))
                }
            }
        });
        
    } catch (error) {
        console.error('Convert hearts error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to convert hearts'
        });
    }
};

// Request Money Withdrawal
exports.requestWithdrawal = async (req, res) => {
    try {
        const withdrawalSchema = Joi.object({
            amount: Joi.number().positive().required(),
            method: Joi.string().valid('bank_transfer', 'upi', 'paytm').required(),
            accountNumber: Joi.string().when('method', { is: 'bank_transfer', then: Joi.required() }),
            ifscCode: Joi.string().when('method', { is: 'bank_transfer', then: Joi.required() }),
            accountHolder: Joi.string().when('method', { is: 'bank_transfer', then: Joi.required() }),
            upiId: Joi.string().when('method', { is: Joi.valid('upi', 'paytm'), then: Joi.required() })
        });
        
        const { error, value } = withdrawalSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                details: error.details[0].message
            });
        }
        
        const wallet = await Wallet.findOne({ userId: req.user.userId });
        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: 'Wallet not found'
            });
        }
        
        // Check minimum withdrawal amount
        if (value.amount < wallet.settings.minimumWithdrawal) {
            return res.status(400).json({
                success: false,
                message: `Minimum withdrawal amount is ₹${wallet.settings.minimumWithdrawal}`
            });
        }
        
        // Check available balance
        if (wallet.balances.withdrawableAmount < value.amount) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient withdrawable balance'
            });
        }
        
        // Check for pending withdrawals
        const pendingWithdrawals = wallet.withdrawals.filter(w => w.status === 'pending' || w.status === 'processing');
        if (pendingWithdrawals.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'You have a pending withdrawal request. Please wait for it to be processed.'
            });
        }
        
        // Create withdrawal request
        const withdrawalRequest = {
            amount: value.amount,
            method: value.method,
            accountDetails: {
                accountNumber: value.accountNumber,
                ifscCode: value.ifscCode,
                accountHolder: value.accountHolder,
                upiId: value.upiId
            },
            status: 'pending'
        };
        
        // Deduct amount from withdrawable balance
        wallet.balances.withdrawableAmount -= value.amount;
        wallet.withdrawals.push(withdrawalRequest);
        
        await wallet.save();
        
        res.json({
            success: true,
            message: 'Withdrawal request submitted successfully',
            data: {
                withdrawalId: wallet.withdrawals[wallet.withdrawals.length - 1]._id,
                amount: value.amount,
                method: value.method,
                status: 'pending',
                estimatedProcessingTime: '2-3 business days',
                remainingBalance: parseFloat(wallet.balances.withdrawableAmount.toFixed(2))
            }
        });
        
    } catch (error) {
        console.error('Request withdrawal error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process withdrawal request'
        });
    }
};

// Get Withdrawal History
exports.getWithdrawalHistory = async (req, res) => {
    try {
        const wallet = await Wallet.findOne({ userId: req.user.userId });
        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: 'Wallet not found'
            });
        }
        
        const withdrawals = wallet.withdrawals.map(withdrawal => ({
            id: withdrawal._id,
            amount: withdrawal.amount,
            method: withdrawal.method,
            status: withdrawal.status,
            requestedAt: withdrawal.requestedAt,
            processedAt: withdrawal.processedAt,
            transactionId: withdrawal.transactionId
        })).reverse(); // Most recent first
        
        res.json({
            success: true,
            data: {
                withdrawals: withdrawals,
                totalWithdrawals: withdrawals.length,
                totalAmount: withdrawals.reduce((sum, w) => sum + w.amount, 0)
            }
        });
        
    } catch (error) {
        console.error('Get withdrawal history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get withdrawal history'
        });
    }
};

// ======================
// MEN'S COIN RECHARGE SYSTEM
// ======================

// Get Men's Coin Balance
exports.getMenCoinBalance = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        
        // Only men can access coin system
        if (!user || user.gender !== 'Male') {
            return res.status(403).json({
                success: false,
                message: 'Only men can access the coin system'
            });
        }
        
        // Get or create coin balance
        let coinBalance = await MenCoinBalance.findOne({ userId: req.user.userId });
        if (!coinBalance) {
            coinBalance = new MenCoinBalance({ userId: req.user.userId });
            await coinBalance.save();
        }
        
        res.json({
            success: true,
            data: {
                coinBalance: coinBalance.coinBalance,
                statistics: {
                    totalCoinsAdded: coinBalance.statistics.totalCoinsAdded,
                    totalCoinsSpent: coinBalance.statistics.totalCoinsSpent,
                    totalMoneySpent: parseFloat(coinBalance.statistics.totalMoneySpent.toFixed(2)),
                    totalCalls: coinBalance.statistics.totalCalls,
                    totalCallTime: coinBalance.statistics.totalCallTime
                },
                recentPurchases: coinBalance.purchases.slice(-5).reverse(),
                recentExpenses: coinBalance.expenses.slice(-10).reverse()
            }
        });
        
    } catch (error) {
        console.error('Get men coin balance error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get coin balance'
        });
    }
};

// Get Available Coin Packages
exports.getCoinPackages = async (req, res) => {
    try {
        const packages = await CoinPackage.find({ 
            isActive: true,
            $or: [
                { validUntil: { $exists: false } },
                { validUntil: null },
                { validUntil: { $gte: new Date() } }
            ]
        }).sort({ sortOrder: 1, price: 1 });
        
        const formattedPackages = packages.map(pkg => ({
            packageId: pkg.packageId,
            name: pkg.name,
            description: pkg.description,
            coins: pkg.coins,
            bonusCoins: pkg.bonusCoins,
            totalCoins: pkg.coins + pkg.bonusCoins,
            price: pkg.price,
            pricePerCoin: parseFloat(pkg.pricePerCoin.toFixed(2)),
            bonusDescription: pkg.bonusDescription,
            isFeatured: pkg.isFeatured,
            savings: pkg.bonusCoins > 0 ? `Save ₹${(pkg.bonusCoins * pkg.pricePerCoin).toFixed(2)}` : null
        }));
        
        res.json({
            success: true,
            data: {
                packages: formattedPackages,
                callRates: {
                    voiceCallPerMinute: 3, // 3 coins per minute
                    videoCallPerMinute: 5, // 5 coins per minute
                    messagePrice: 1 // 1 coin per message
                }
            }
        });
        
    } catch (error) {
        console.error('Get coin packages error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get coin packages'
        });
    }
};

// Purchase Coins (Simulate Payment)
exports.purchaseCoins = async (req, res) => {
    try {
        const { packageId, paymentMethod } = req.body;
        
        if (!packageId || !paymentMethod) {
            return res.status(400).json({
                success: false,
                message: 'Package ID and payment method are required'
            });
        }
        
        // Get package details
        const package = await CoinPackage.findOne({ packageId: packageId, isActive: true });
        if (!package) {
            return res.status(404).json({
                success: false,
                message: 'Package not found or inactive'
            });
        }
        
        // Get user's coin balance
        let coinBalance = await MenCoinBalance.findOne({ userId: req.user.userId });
        if (!coinBalance) {
            coinBalance = new MenCoinBalance({ userId: req.user.userId });
        }
        
        // Simulate payment processing
        const orderId = 'ORDER_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const paymentId = 'PAY_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Calculate total coins (base + bonus)
        const totalCoins = package.coins + package.bonusCoins;
        
        // Add purchase record
        const purchase = {
            packageId: package.packageId,
            packageName: package.name,
            coinsAdded: totalCoins,
            amountPaid: package.price,
            paymentMethod: paymentMethod,
            paymentId: paymentId,
            orderId: orderId,
            status: 'completed' // Simulated successful payment
        };
        
        // Update balances
        coinBalance.coinBalance += totalCoins;
        coinBalance.statistics.totalCoinsAdded += totalCoins;
        coinBalance.statistics.totalMoneySpent += package.price;
        coinBalance.purchases.push(purchase);
        
        await coinBalance.save();
        
        res.json({
            success: true,
            message: `Successfully purchased ${totalCoins} coins`,
            data: {
                orderId: orderId,
                paymentId: paymentId,
                packageName: package.name,
                coinsAdded: totalCoins,
                bonusCoins: package.bonusCoins,
                amountPaid: package.price,
                newCoinBalance: coinBalance.coinBalance,
                transactionStatus: 'completed'
            }
        });
        
    } catch (error) {
        console.error('Purchase coins error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process coin purchase'
        });
    }
};

// ======================
// CALL EARNING SYSTEM
// ======================

// Start Call Session (for tracking earnings)
exports.startCallSession = async (req, res) => {
    try {
        const { receiverId, callType } = req.body;
        
        if (!receiverId || !callType) {
            return res.status(400).json({
                success: false,
                message: 'Receiver ID and call type are required'
            });
        }
        
        // Validate receiver is a woman
        const receiver = await User.findById(receiverId);
        if (!receiver || receiver.gender !== 'Female') {
            return res.status(400).json({
                success: false,
                message: 'Can only call female users'
            });
        }
        
        // Check caller's coin balance
        const coinBalance = await MenCoinBalance.findOne({ userId: req.user.userId });
        if (!coinBalance || coinBalance.coinBalance < 5) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient coins to start call'
            });
        }
        
        // Create call session
        const callId = 'CALL_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const costPerMinute = callType === 'video' ? 5 : 3;
        
        const callSession = new CallSession({
            callId: callId,
            callerId: req.user.userId,
            receiverId: receiverId,
            callType: callType,
            startTime: new Date(),
            status: 'initiated',
            cost: {
                costPerMinute: costPerMinute
            }
        });
        
        await callSession.save();
        
        res.json({
            success: true,
            message: 'Call session started',
            data: {
                callId: callId,
                callType: callType,
                receiverName: receiver.username,
                costPerMinute: costPerMinute,
                yourCoinBalance: coinBalance.coinBalance,
                estimatedCostPer10Min: costPerMinute * 10
            }
        });
        
    } catch (error) {
        console.error('Start call session error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to start call session'
        });
    }
};

// End Call Session (calculate earnings and costs)
exports.endCallSession = async (req, res) => {
    try {
        const { callId, endReason } = req.body;
        
        if (!callId) {
            return res.status(400).json({
                success: false,
                message: 'Call ID is required'
            });
        }
        
        // Find call session
        const callSession = await CallSession.findOne({ callId: callId });
        if (!callSession) {
            return res.status(404).json({
                success: false,
                message: 'Call session not found'
            });
        }
        
        if (callSession.status === 'ended') {
            return res.status(400).json({
                success: false,
                message: 'Call session already ended'
            });
        }
        
        // Calculate call duration
        const endTime = new Date();
        const duration = Math.floor((endTime - callSession.startTime) / 1000); // in seconds
        const minutes = Math.ceil(duration / 60);
        
        // Update call session
        callSession.endTime = endTime;
        callSession.duration = duration;
        callSession.durationMinutes = minutes;
        callSession.status = 'ended';
        callSession.endReason = endReason || 'completed';
        
        // Calculate costs and earnings
        const costPerMinute = callSession.cost.costPerMinute;
        const totalCost = minutes * costPerMinute;
        
        callSession.cost.coinsSpent = totalCost;
        
        // Deduct coins from caller (man)
        const callerCoinBalance = await MenCoinBalance.findOne({ userId: callSession.callerId });
        if (callerCoinBalance) {
            callerCoinBalance.coinBalance = Math.max(0, callerCoinBalance.coinBalance - totalCost);
            callerCoinBalance.statistics.totalCoinsSpent += totalCost;
            callerCoinBalance.statistics.totalCalls += 1;
            callerCoinBalance.statistics.totalCallTime += minutes;
            
            // Add expense record
            callerCoinBalance.expenses.push({
                type: 'call',
                coinsSpent: totalCost,
                recipientId: callSession.receiverId,
                callId: callId,
                spentAt: endTime
            });
            
            await callerCoinBalance.save();
        }
        
        // Add earnings to receiver (woman)
        const receiverWallet = await Wallet.findOne({ userId: callSession.receiverId });
        if (receiverWallet) {
            const earnings = receiverWallet.addEarnings(duration, 0); // 0 bonus hearts
            
            callSession.earnings = {
                heartsEarned: earnings.heartsEarned,
                coinsEarned: earnings.coinsEarned,
                moneyEarned: earnings.moneyEarned
            };
            
            await receiverWallet.save();
        }
        
        await callSession.save();
        
        res.json({
            success: true,
            message: 'Call session ended successfully',
            data: {
                callId: callId,
                duration: {
                    seconds: duration,
                    minutes: minutes,
                    formatted: `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`
                },
                caller: {
                    coinsSpent: totalCost,
                    remainingBalance: callerCoinBalance ? callerCoinBalance.coinBalance : 0
                },
                receiver: {
                    heartsEarned: callSession.earnings.heartsEarned,
                    coinsEarned: callSession.earnings.coinsEarned,
                    moneyEarned: parseFloat(callSession.earnings.moneyEarned.toFixed(2))
                },
                endReason: callSession.endReason
            }
        });
        
    } catch (error) {
        console.error('End call session error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to end call session'
        });
    }
};