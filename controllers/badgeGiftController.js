const { Wallet, MenCoinBalance } = require('../models/walletModel');
const User = require('../models/userModel');

// Badge System Controller
class BadgeController {
    
    // Get all available badges
    static async getAvailableBadges(req, res) {
        try {
            const availableBadges = [
                // Call Time Badges
                {
                    badgeId: 'first_call',
                    name: 'First Call',
                    description: 'Complete your first call',
                    category: 'call_time',
                    requirement: 'Complete 1 call',
                    icon: '📞',
                    reward: '10 bonus hearts'
                },
                {
                    badgeId: 'call_star',
                    name: 'Call Star',
                    description: 'Complete 10 calls',
                    category: 'call_time',
                    requirement: 'Complete 10 calls',
                    icon: '⭐',
                    reward: '50 bonus hearts'
                },
                {
                    badgeId: 'call_champion',
                    name: 'Call Champion',
                    description: 'Complete 100 calls',
                    category: 'call_time',
                    requirement: 'Complete 100 calls',
                    icon: '🏆',
                    reward: '200 bonus hearts'
                },
                {
                    badgeId: 'time_keeper',
                    name: 'Time Keeper',
                    description: 'Spend 60 minutes on calls',
                    category: 'call_time',
                    requirement: '60 minutes call time',
                    icon: '⏰',
                    reward: '30 bonus hearts'
                },
                {
                    badgeId: 'chat_master',
                    name: 'Chat Master',
                    description: 'Spend 300 minutes on calls',
                    category: 'call_time',
                    requirement: '300 minutes call time',
                    icon: '💬',
                    reward: '100 bonus hearts'
                },
                
                // Hearts Collection Badges
                {
                    badgeId: 'heart_collector',
                    name: 'Heart Collector',
                    description: 'Collect 100 hearts',
                    category: 'hearts',
                    requirement: 'Earn 100 hearts',
                    icon: '💝',
                    reward: '20 bonus hearts'
                },
                {
                    badgeId: 'heart_magnet',
                    name: 'Heart Magnet',
                    description: 'Collect 500 hearts',
                    category: 'hearts',
                    requirement: 'Earn 500 hearts',
                    icon: '💖',
                    reward: '75 bonus hearts'
                },
                {
                    badgeId: 'heart_queen',
                    name: 'Heart Queen',
                    description: 'Collect 1000 hearts',
                    category: 'hearts',
                    requirement: 'Earn 1000 hearts',
                    icon: '👑',
                    reward: '150 bonus hearts'
                },
                
                // Coins Collection Badges
                {
                    badgeId: 'coin_starter',
                    name: 'Coin Starter',
                    description: 'Earn your first 50 coins',
                    category: 'coins',
                    requirement: 'Earn 50 coins',
                    icon: '🪙',
                    reward: '25 bonus hearts'
                },
                {
                    badgeId: 'coin_pro',
                    name: 'Coin Pro',
                    description: 'Earn 200 coins',
                    category: 'coins',
                    requirement: 'Earn 200 coins',
                    icon: '💰',
                    reward: '60 bonus hearts'
                },
                
                // Special Badges
                {
                    badgeId: 'daily_active',
                    name: 'Daily Active',
                    description: 'Active for 7 consecutive days',
                    category: 'special',
                    requirement: '7 days consecutive activity',
                    icon: '🔥',
                    reward: '40 bonus hearts'
                },
                {
                    badgeId: 'top_earner',
                    name: 'Top Earner',
                    description: 'Top 10 earner this month',
                    category: 'monthly',
                    requirement: 'Top 10 monthly earner',
                    icon: '🌟',
                    reward: '100 bonus hearts'
                }
            ];
            
            res.json({
                success: true,
                data: {
                    badges: availableBadges,
                    totalBadges: availableBadges.length,
                    categories: ['call_time', 'hearts', 'coins', 'special', 'monthly']
                }
            });
            
        } catch (error) {
            console.error('Get available badges error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get available badges'
            });
        }
    }
    
    // Check and award badges to user
    static async checkAndAwardBadges(userId) {
        try {
            const wallet = await Wallet.findOne({ userId });
            if (!wallet) return;
            
            const earnedBadgeIds = wallet.badges.map(b => b.badgeId);
            const newBadges = [];
            
            // Check call time badges
            if (wallet.earnings.totalCalls >= 1 && !earnedBadgeIds.includes('first_call')) {
                newBadges.push({
                    badgeId: 'first_call',
                    name: 'First Call',
                    description: 'Complete your first call',
                    category: 'call_time',
                    heartsReward: 10
                });
            }
            
            if (wallet.earnings.totalCalls >= 10 && !earnedBadgeIds.includes('call_star')) {
                newBadges.push({
                    badgeId: 'call_star',
                    name: 'Call Star',
                    description: 'Complete 10 calls',
                    category: 'call_time',
                    heartsReward: 50
                });
            }
            
            if (wallet.earnings.totalCalls >= 100 && !earnedBadgeIds.includes('call_champion')) {
                newBadges.push({
                    badgeId: 'call_champion',
                    name: 'Call Champion',
                    description: 'Complete 100 calls',
                    category: 'call_time',
                    heartsReward: 200
                });
            }
            
            if (wallet.earnings.totalCallTime >= 60 && !earnedBadgeIds.includes('time_keeper')) {
                newBadges.push({
                    badgeId: 'time_keeper',
                    name: 'Time Keeper',
                    description: 'Spend 60 minutes on calls',
                    category: 'call_time',
                    heartsReward: 30
                });
            }
            
            if (wallet.earnings.totalCallTime >= 300 && !earnedBadgeIds.includes('chat_master')) {
                newBadges.push({
                    badgeId: 'chat_master',
                    name: 'Chat Master',
                    description: 'Spend 300 minutes on calls',
                    category: 'call_time',
                    heartsReward: 100
                });
            }
            
            // Check hearts badges
            if (wallet.earnings.totalHeartsEarned >= 100 && !earnedBadgeIds.includes('heart_collector')) {
                newBadges.push({
                    badgeId: 'heart_collector',
                    name: 'Heart Collector',
                    description: 'Collect 100 hearts',
                    category: 'hearts',
                    heartsReward: 20
                });
            }
            
            if (wallet.earnings.totalHeartsEarned >= 500 && !earnedBadgeIds.includes('heart_magnet')) {
                newBadges.push({
                    badgeId: 'heart_magnet',
                    name: 'Heart Magnet',
                    description: 'Collect 500 hearts',
                    category: 'hearts',
                    heartsReward: 75
                });
            }
            
            if (wallet.earnings.totalHeartsEarned >= 1000 && !earnedBadgeIds.includes('heart_queen')) {
                newBadges.push({
                    badgeId: 'heart_queen',
                    name: 'Heart Queen',
                    description: 'Collect 1000 hearts',
                    category: 'hearts',
                    heartsReward: 150
                });
            }
            
            // Check coins badges
            if (wallet.earnings.totalCoinsEarned >= 50 && !earnedBadgeIds.includes('coin_starter')) {
                newBadges.push({
                    badgeId: 'coin_starter',
                    name: 'Coin Starter',
                    description: 'Earn your first 50 coins',
                    category: 'coins',
                    heartsReward: 25
                });
            }
            
            if (wallet.earnings.totalCoinsEarned >= 200 && !earnedBadgeIds.includes('coin_pro')) {
                newBadges.push({
                    badgeId: 'coin_pro',
                    name: 'Coin Pro',
                    description: 'Earn 200 coins',
                    category: 'coins',
                    heartsReward: 60
                });
            }
            
            // Award new badges
            if (newBadges.length > 0) {
                for (const badge of newBadges) {
                    // Add badge to wallet
                    wallet.badges.push({
                        badgeId: badge.badgeId,
                        name: badge.name,
                        description: badge.description,
                        category: badge.category
                    });
                    
                    // Award hearts bonus
                    wallet.balances.redHearts += badge.heartsReward;
                    wallet.earnings.totalHeartsEarned += badge.heartsReward;
                }
                
                await wallet.save();
                return newBadges;
            }
            
            return [];
            
        } catch (error) {
            console.error('Check and award badges error:', error);
            return [];
        }
    }
    
    // Get user's earned badges
    static async getUserBadges(req, res) {
        try {
            const wallet = await Wallet.findOne({ userId: req.user.userId });
            if (!wallet) {
                return res.status(404).json({
                    success: false,
                    message: 'Wallet not found'
                });
            }
            
            const earnedBadges = wallet.badges.filter(badge => badge.isActive);
            
            res.json({
                success: true,
                data: {
                    earnedBadges: earnedBadges,
                    totalBadges: earnedBadges.length,
                    progress: {
                        callTime: wallet.earnings.totalCallTime,
                        totalCalls: wallet.earnings.totalCalls,
                        totalHearts: wallet.earnings.totalHeartsEarned,
                        totalCoins: wallet.earnings.totalCoinsEarned
                    }
                }
            });
            
        } catch (error) {
            console.error('Get user badges error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get user badges'
            });
        }
    }
}

// Gift System Controller
class GiftController {
    
    // Get available gifts
    static async getAvailableGifts(req, res) {
        try {
            const gifts = [
                {
                    giftId: 'rose',
                    name: 'Rose',
                    description: 'A beautiful rose to show your appreciation',
                    value: 5, // hearts value
                    coinCost: 3, // cost for men
                    icon: '🌹',
                    category: 'romantic',
                    rarity: 'common'
                },
                {
                    giftId: 'heart',
                    name: 'Heart',
                    description: 'Send your love with a heart',
                    value: 10,
                    coinCost: 5,
                    icon: '💝',
                    category: 'romantic',
                    rarity: 'common'
                },
                {
                    giftId: 'chocolate',
                    name: 'Chocolate',
                    description: 'Sweet chocolate gift',
                    value: 15,
                    coinCost: 8,
                    icon: '🍫',
                    category: 'sweet',
                    rarity: 'uncommon'
                },
                {
                    giftId: 'diamond',
                    name: 'Diamond',
                    description: 'Precious diamond gift',
                    value: 50,
                    coinCost: 25,
                    icon: '💎',
                    category: 'luxury',
                    rarity: 'rare'
                },
                {
                    giftId: 'crown',
                    name: 'Crown',
                    description: 'Royal crown for the queen',
                    value: 100,
                    coinCost: 50,
                    icon: '👑',
                    category: 'luxury',
                    rarity: 'legendary'
                },
                {
                    giftId: 'teddy',
                    name: 'Teddy Bear',
                    description: 'Cute teddy bear',
                    value: 20,
                    coinCost: 12,
                    icon: '🧸',
                    category: 'cute',
                    rarity: 'uncommon'
                },
                {
                    giftId: 'perfume',
                    name: 'Perfume',
                    description: 'Elegant perfume bottle',
                    value: 30,
                    coinCost: 18,
                    icon: '🍾',
                    category: 'luxury',
                    rarity: 'uncommon'
                },
                {
                    giftId: 'kiss',
                    name: 'Kiss',
                    description: 'Sweet kiss',
                    value: 8,
                    coinCost: 4,
                    icon: '💋',
                    category: 'romantic',
                    rarity: 'common'
                }
            ];
            
            res.json({
                success: true,
                data: {
                    gifts: gifts,
                    categories: ['romantic', 'sweet', 'cute', 'luxury'],
                    rarities: ['common', 'uncommon', 'rare', 'legendary']
                }
            });
            
        } catch (error) {
            console.error('Get available gifts error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get available gifts'
            });
        }
    }
    
    // Send gift to a woman
    static async sendGift(req, res) {
        try {
            const { recipientId, giftId, callId } = req.body;
            
            if (!recipientId || !giftId) {
                return res.status(400).json({
                    success: false,
                    message: 'Recipient ID and gift ID are required'
                });
            }
            
            // Validate recipient is a woman
            const recipient = await User.findById(recipientId);
            if (!recipient || recipient.gender !== 'Female') {
                return res.status(400).json({
                    success: false,
                    message: 'Can only send gifts to female users'
                });
            }
            
            // Get gift details (you would normally get this from a gifts collection)
            const gifts = {
                'rose': { name: 'Rose', value: 5, coinCost: 3, icon: '🌹' },
                'heart': { name: 'Heart', value: 10, coinCost: 5, icon: '💝' },
                'chocolate': { name: 'Chocolate', value: 15, coinCost: 8, icon: '🍫' },
                'diamond': { name: 'Diamond', value: 50, coinCost: 25, icon: '💎' },
                'crown': { name: 'Crown', value: 100, coinCost: 50, icon: '👑' },
                'teddy': { name: 'Teddy Bear', value: 20, coinCost: 12, icon: '🧸' },
                'perfume': { name: 'Perfume', value: 30, coinCost: 18, icon: '🍾' },
                'kiss': { name: 'Kiss', value: 8, coinCost: 4, icon: '💋' }
            };
            
            const gift = gifts[giftId];
            if (!gift) {
                return res.status(404).json({
                    success: false,
                    message: 'Gift not found'
                });
            }
            
            // Check sender's coin balance
            const senderCoinBalance = await MenCoinBalance.findOne({ userId: req.user.userId });
            if (!senderCoinBalance || senderCoinBalance.coinBalance < gift.coinCost) {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient coins to send this gift'
                });
            }
            
            // Deduct coins from sender
            senderCoinBalance.coinBalance -= gift.coinCost;
            senderCoinBalance.statistics.totalCoinsSpent += gift.coinCost;
            
            // Add expense record
            senderCoinBalance.expenses.push({
                type: 'gift',
                coinsSpent: gift.coinCost,
                recipientId: recipientId,
                giftId: giftId,
                callId: callId
            });
            
            await senderCoinBalance.save();
            
            // Add gift to recipient's wallet
            let recipientWallet = await Wallet.findOne({ userId: recipientId });
            if (!recipientWallet) {
                recipientWallet = new Wallet({ userId: recipientId });
            }
            
            // Add hearts value to recipient
            recipientWallet.balances.redHearts += gift.value;
            recipientWallet.earnings.totalHeartsEarned += gift.value;
            
            // Add gift to history
            recipientWallet.giftsReceived.push({
                giftId: giftId,
                giftName: gift.name,
                giftValue: gift.value,
                senderId: req.user.userId,
                callId: callId
            });
            
            await recipientWallet.save();
            
            // Check for new badges
            const newBadges = await BadgeController.checkAndAwardBadges(recipientId);
            
            res.json({
                success: true,
                message: `${gift.name} sent successfully!`,
                data: {
                    gift: {
                        name: gift.name,
                        icon: gift.icon,
                        value: gift.value,
                        coinCost: gift.coinCost
                    },
                    sender: {
                        coinsSpent: gift.coinCost,
                        remainingCoins: senderCoinBalance.coinBalance
                    },
                    recipient: {
                        heartsReceived: gift.value,
                        newBadges: newBadges.length > 0 ? newBadges : null
                    }
                }
            });
            
        } catch (error) {
            console.error('Send gift error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to send gift'
            });
        }
    }
    
    // Get received gifts for a woman
    static async getReceivedGifts(req, res) {
        try {
            const wallet = await Wallet.findOne({ userId: req.user.userId }).populate('giftsReceived.senderId', 'username');
            if (!wallet) {
                return res.status(404).json({
                    success: false,
                    message: 'Wallet not found'
                });
            }
            
            const recentGifts = wallet.giftsReceived.slice(-20).reverse(); // Last 20 gifts
            
            res.json({
                success: true,
                data: {
                    gifts: recentGifts,
                    totalGifts: wallet.giftsReceived.length,
                    totalValue: wallet.giftsReceived.reduce((sum, gift) => sum + gift.giftValue, 0)
                }
            });
            
        } catch (error) {
            console.error('Get received gifts error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get received gifts'
            });
        }
    }
}

module.exports = { BadgeController, GiftController };