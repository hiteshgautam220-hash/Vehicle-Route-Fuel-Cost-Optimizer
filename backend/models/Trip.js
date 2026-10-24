/**
 * RouteWise Backend — Trip Model
 * Demonstrates Mongoose Schema references (ObjectId ref to User),
 * embedded subdocuments, validation, numbers, and populate() support.
 */

const mongoose = require('mongoose');

const waypointSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
}, { _id: false });

const tripSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Trip must belong to a user']
    },
    title: {
        type: String,
        required: [true, 'Trip title is required'],
        trim: true,
        maxlength: [120, 'Title cannot exceed 120 characters']
    },
    origin: {
        type: waypointSchema,
        required: [true, 'Origin waypoint is required']
    },
    destination: {
        type: waypointSchema,
        required: [true, 'Destination waypoint is required']
    },
    stops: {
        type: [waypointSchema],
        default: []
    },
    distanceKm: {
        type: Number,
        required: [true, 'Trip distance is required'],
        min: [0.1, 'Distance must be positive']
    },
    durationMinutes: {
        type: Number,
        default: 0
    },
    fuelType: {
        type: String,
        enum: ['petrol', 'diesel', 'cng', 'compare'],
        default: 'cng'
    },
    fuelEfficiency: {
        type: Number,
        required: [true, 'Fuel efficiency is required'],
        min: [1, 'Efficiency must be at least 1']
    },
    fuelPrice: {
        type: Number,
        required: [true, 'Fuel price is required'],
        min: [1, 'Price must be positive']
    },
    totalCost: {
        type: Number,
        required: [true, 'Total cost calculation is required']
    },
    fuelQuantity: {
        type: Number,
        default: 0
    },
    co2EmissionsKg: {
        type: Number,
        default: 0
    },
    comparison: {
        petrolCost: { type: Number, default: 0 },
        dieselCost: { type: Number, default: 0 },
        cngCost: { type: Number, default: 0 },
        savingsVsPetrol: { type: Number, default: 0 },
        savingsPercent: { type: Number, default: 0 }
    },
    cityName: {
        type: String,
        default: 'Reference (Delhi)'
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [500, 'Notes cannot exceed 500 characters']
    },
    attachment: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Virtual for formatted summary
tripSchema.virtual('summary').get(function () {
    return `${this.title}: ${this.distanceKm} km (₹${this.totalCost})`;
});

const Trip = mongoose.model('Trip', tripSchema);

module.exports = Trip;
