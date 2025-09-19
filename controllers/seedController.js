const { CoinPackage } = require('../models/walletModel');

// Seed default coin packages
async function seedCoinPackages() {
    try {
        // Check if packages already exist
        const existingCount = await CoinPackage.countDocuments();
        if (existingCount > 0) {
            console.log(`${existingCount} coin packages already exist. Skipping seed.`);
            return;
        }
        
        const defaultPackages = [
            {
                packageId: 'starter_10',
                name: 'Starter Pack',
                description: 'Perfect for trying out the app',
                coins: 10,
                price: 99,
                pricePerCoin: 9.9,
                bonusCoins: 0,
                sortOrder: 1
            },
            {
                packageId: 'basic_25',
                name: 'Basic Pack',
                description: 'Good for short conversations',
                coins: 25,
                price: 199,
                pricePerCoin: 7.96,
                bonusCoins: 5,
                bonusDescription: '5 bonus coins',
                sortOrder: 2
            },
            {
                packageId: 'popular_50',
                name: 'Popular Pack',
                description: 'Most popular choice',
                coins: 50,
                price: 349,
                pricePerCoin: 6.98,
                bonusCoins: 10,
                bonusDescription: '10 bonus coins',
                isFeatured: true,
                sortOrder: 3
            },
            {
                packageId: 'premium_100',
                name: 'Premium Pack',
                description: 'Great value for regular users',
                coins: 100,
                price: 599,
                pricePerCoin: 5.99,
                bonusCoins: 25,
                bonusDescription: '25 bonus coins',
                sortOrder: 4
            },
            {
                packageId: 'mega_200',
                name: 'Mega Pack',
                description: 'Best value for money',
                coins: 200,
                price: 999,
                pricePerCoin: 4.995,
                bonusCoins: 60,
                bonusDescription: '60 bonus coins',
                sortOrder: 5
            },
            {
                packageId: 'ultimate_500',
                name: 'Ultimate Pack',
                description: 'For the ultimate experience',
                coins: 500,
                price: 1999,
                pricePerCoin: 3.998,
                bonusCoins: 200,
                bonusDescription: '200 bonus coins',
                sortOrder: 6
            }
        ];
        
        const insertedPackages = await CoinPackage.insertMany(defaultPackages);
        console.log(`Successfully seeded ${insertedPackages.length} coin packages`);
        
        return insertedPackages;
        
    } catch (error) {
        console.error('Error seeding coin packages:', error);
        throw error;
    }
}

// Seed coin packages controller endpoint
exports.seedCoinPackages = async (req, res) => {
    try {
        const packages = await seedCoinPackages();
        
        res.json({
            success: true,
            message: `Successfully seeded ${packages.length} coin packages`,
            data: { 
                count: packages.length,
                packages: packages.map(p => ({ 
                    id: p.packageId, 
                    name: p.name, 
                    coins: p.coins,
                    price: p.price 
                }))
            }
        });
        
    } catch (error) {
        console.error('Seed coin packages error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to seed coin packages'
        });
    }
};

module.exports = { seedCoinPackages };