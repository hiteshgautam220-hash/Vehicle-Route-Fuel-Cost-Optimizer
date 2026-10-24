/**
 * RouteWise Backend — FuelRate Model
 * Stores Indian Metro City reference fuel rates for Petrol, Diesel, and CNG.
 */

const mongoose = require('mongoose');

const fuelRateSchema = new mongoose.Schema({
    city: {
        type: String,
        required: [true, 'City name is required'],
        unique: true,
        trim: true
    },
    state: {
        type: String,
        required: [true, 'State name is required'],
        trim: true
    },
    petrol: {
        type: Number,
        required: [true, 'Petrol rate is required'],
        min: [1, 'Price must be greater than zero']
    },
    diesel: {
        type: Number,
        required: [true, 'Diesel rate is required'],
        min: [1, 'Price must be greater than zero']
    },
    cng: {
        type: Number,
        required: [true, 'CNG rate is required'],
        min: [1, 'Price must be greater than zero']
    },
    trend: {
        type: String,
        enum: ['Stable', 'Slight Up', 'Slight Down'],
        default: 'Stable'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const FuelRate = mongoose.model('FuelRate', fuelRateSchema);

module.exports = FuelRate;
