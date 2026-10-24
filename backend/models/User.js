/**
 * RouteWise Backend — User Model
 * Demonstrates Mongoose Schema definition, validation, pre-save middleware hooks,
 * password hashing with bcrypt, instance methods, and secure JSON serialization.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters long'],
        maxlength: [60, 'Name cannot exceed 60 characters']
    },
    email: {
        type: String,
        required: [true, 'Email address is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [emailRegex, 'Please provide a valid email address']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false // Do not include in queries by default for security
    },
    role: {
        type: String,
        enum: ['user', 'fleet_manager', 'admin'],
        default: 'user'
    },
    fuelPreference: {
        type: String,
        enum: ['cng', 'petrol', 'diesel'],
        default: 'cng'
    },
    vehicleMileage: {
        type: Number,
        default: 24,
        min: [1, 'Mileage must be at least 1 km/unit']
    },
    avatar: {
        type: String,
        default: null
    }
}, {
    timestamps: true // Adds createdAt and updatedAt automatically
});

// Pre-save hook: Hash password with bcrypt before saving if modified
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// Instance method: Compare entered password with hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Transform to JSON: Strip sensitive fields like password
userSchema.methods.toJSON = function () {
    const userObj = this.toObject();
    delete userObj.password;
    delete userObj.__v;
    return userObj;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
