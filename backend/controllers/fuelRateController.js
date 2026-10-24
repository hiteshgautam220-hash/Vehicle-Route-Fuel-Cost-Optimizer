/**
 * RouteWise Backend — Fuel Rate Controller
 * Exposes reference fuel rates for Indian cities (Petrol, Diesel, CNG).
 */

const FuelRate = require('../models/FuelRate');
const { isDbConnected } = require('../config/db');

// Default reference city rates
const DEFAULT_CITY_RATES = [
    { city: "New Delhi",   state: "Delhi",          petrol: 94.72,  diesel: 87.62, cng: 75.09, trend: "Stable" },
    { city: "Mumbai",      state: "Maharashtra",    petrol: 104.21, diesel: 92.15, cng: 76.00, trend: "Stable" },
    { city: "Bengaluru",   state: "Karnataka",      petrol: 102.86, diesel: 88.94, cng: 82.50, trend: "Slight Up" },
    { city: "Kolkata",     state: "West Bengal",    petrol: 103.94, diesel: 90.76, cng: 86.00, trend: "Stable" },
    { city: "Chennai",     state: "Tamil Nadu",     petrol: 100.75, diesel: 92.34, cng: 83.50, trend: "Stable" },
    { city: "Hyderabad",   state: "Telangana",      petrol: 107.41, diesel: 95.65, cng: 89.50, trend: "Slight Up" },
    { city: "Ahmedabad",   state: "Gujarat",        petrol: 96.42,  diesel: 92.17, cng: 78.20, trend: "Stable" },
    { city: "Pune",        state: "Maharashtra",    petrol: 103.77, diesel: 90.31, cng: 78.00, trend: "Stable" },
    { city: "Jaipur",      state: "Rajasthan",      petrol: 104.88, diesel: 90.36, cng: 80.50, trend: "Stable" },
    { city: "Chandigarh",  state: "Chandigarh",     petrol: 94.24,  diesel: 82.40, cng: 82.40, trend: "Stable" },
    { city: "Lucknow",     state: "Uttar Pradesh",  petrol: 94.65,  diesel: 87.76, cng: 85.00, trend: "Stable" },
    { city: "Surat",       state: "Gujarat",        petrol: 96.31,  diesel: 92.08, cng: 77.80, trend: "Stable" },
    { city: "Bhopal",      state: "Madhya Pradesh", petrol: 106.47, diesel: 91.84, cng: 88.00, trend: "Slight Up" },
    { city: "Patna",       state: "Bihar",          petrol: 105.48, diesel: 92.32, cng: 84.50, trend: "Stable" },
    { city: "Kochi",       state: "Kerala",         petrol: 105.72, diesel: 94.66, cng: 83.00, trend: "Stable" }
];

// @desc    Get all city fuel rates
// @route   GET /api/fuel-rates
// @access  Public
async function getFuelRates(req, res, next) {
    try {
        const search = req.query.search ? req.query.search.toLowerCase().trim() : '';

        let rates;
        if (isDbConnected()) {
            const query = search ? {
                $or: [
                    { city: { $regex: search, $options: 'i' } },
                    { state: { $regex: search, $options: 'i' } }
                ]
            } : {};
            rates = await FuelRate.find(query).sort({ city: 1 }).populate('updatedBy', 'name');

            // If DB collection is empty, return default reference data
            if (!rates || rates.length === 0) {
                rates = DEFAULT_CITY_RATES;
            }
        } else {
            rates = DEFAULT_CITY_RATES;
            if (search) {
                rates = rates.filter(r =>
                    r.city.toLowerCase().includes(search) ||
                    r.state.toLowerCase().includes(search)
                );
            }
        }

        res.status(200).json({
            success: true,
            count: rates.length,
            rates
        });
    } catch (err) {
        next(err);
    }
}

// @desc    Get rate for a specific city
// @route   GET /api/fuel-rates/:city
// @access  Public
async function getCityRate(req, res, next) {
    try {
        const cityName = req.params.city.toLowerCase().trim();

        if (isDbConnected()) {
            const rate = await FuelRate.findOne({
                city: { $regex: new RegExp(`^${cityName}$`, 'i') }
            });
            if (rate) {
                return res.status(200).json({ success: true, rate });
            }
        }

        // Search in defaults
        const defaultRate = DEFAULT_CITY_RATES.find(r => r.city.toLowerCase() === cityName);
        if (defaultRate) {
            return res.status(200).json({ success: true, rate: defaultRate });
        }

        return res.status(404).json({
            success: false,
            message: `Fuel rates for city '${req.params.city}' not found.`
        });
    } catch (err) {
        next(err);
    }
}

// @desc    Create or update a city fuel rate
// @route   POST /api/fuel-rates
// @access  Private (Protected / Admin)
async function updateFuelRate(req, res, next) {
    try {
        const { city, state, petrol, diesel, cng, trend } = req.body;

        if (!city || !state || !petrol || !diesel || !cng) {
            return res.status(400).json({
                success: false,
                message: 'Please provide city, state, petrol, diesel, and cng rates.'
            });
        }

        if (!isDbConnected()) {
            return res.status(200).json({
                success: true,
                message: 'Rate updated (in-memory mode).',
                rate: { city, state, petrol, diesel, cng, trend: trend || 'Stable' }
            });
        }

        const rate = await FuelRate.findOneAndUpdate(
            { city: { $regex: new RegExp(`^${city.trim()}$`, 'i') } },
            {
                city: city.trim(),
                state: state.trim(),
                petrol: parseFloat(petrol),
                diesel: parseFloat(diesel),
                cng: parseFloat(cng),
                trend: trend || 'Stable',
                updatedBy: req.user._id,
                lastUpdated: Date.now()
            },
            { upsert: true, new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: `Fuel rates for ${rate.city} updated successfully.`,
            rate
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getFuelRates,
    getCityRate,
    updateFuelRate,
    DEFAULT_CITY_RATES
};
