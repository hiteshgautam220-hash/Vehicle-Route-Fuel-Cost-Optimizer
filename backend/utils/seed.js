/**
 * RouteWise Backend — Database Seeding Script
 * Automatically populates initial demonstration accounts and Indian metro city fuel rates.
 * Run manually via `npm run seed` or invoked on initial startup.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const FuelRate = require('../models/FuelRate');
const { DEFAULT_CITY_RATES } = require('../controllers/fuelRateController');

const SEED_USERS = [
    {
        name: 'Vikram Kumar (CNG Driver)',
        email: 'driver@routewise.in',
        password: 'password123',
        role: 'user',
        fuelPreference: 'cng',
        vehicleMileage: 25
    },
    {
        name: 'Ananya Sharma (Fleet Manager)',
        email: 'fleet@routewise.in',
        password: 'password123',
        role: 'fleet_manager',
        fuelPreference: 'diesel',
        vehicleMileage: 20
    },
    {
        name: 'System Admin',
        email: 'admin@routewise.in',
        password: 'adminpassword123',
        role: 'admin',
        fuelPreference: 'petrol',
        vehicleMileage: 18
    }
];

async function seedDatabase(log = true) {
    try {
        if (log) console.log('[Seed] Checking database seeding...');

        // 1. Seed Users
        for (const u of SEED_USERS) {
            const exists = await User.findOne({ email: u.email });
            if (!exists) {
                await User.create(u);
                if (log) console.log(`[Seed] Created seed user: ${u.email}`);
            }
        }

        // 2. Seed City Fuel Rates
        for (const rate of DEFAULT_CITY_RATES) {
            const exists = await FuelRate.findOne({ city: rate.city });
            if (!exists) {
                await FuelRate.create(rate);
            }
        }

        if (log) console.log('[Seed] Database seeding completed successfully.');
    } catch (err) {
        if (log) console.error('[Seed Error]', err.message);
    }
}

// If executed directly from command line
if (require.main === module) {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/routewise';
    console.log(`[Seed CLI] Connecting to: ${mongoUri}`);
    mongoose.connect(mongoUri)
        .then(async () => {
            console.log('[Seed CLI] Connected.');
            await seedDatabase(true);
            await mongoose.disconnect();
            console.log('[Seed CLI] Disconnected.');
            process.exit(0);
        })
        .catch(err => {
            console.error('[Seed CLI Error]', err.message);
            process.exit(1);
        });
}

module.exports = { seedDatabase };
