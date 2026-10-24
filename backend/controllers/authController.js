/**
 * RouteWise Backend — Auth Controller
 * Handles user registration, login, profile updates, JWT generation,
 * and avatar uploads.
 * Demonstrates bcrypt password hashing, JWT generation, and graceful in-memory
 * fallback when MongoDB is offline.
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const appEvents = require('../utils/appEvents');
const { JWT_SECRET } = require('../middleware/auth');
const { isDbConnected } = require('../config/db');

// In-memory user registry for fallback when database is disconnected
const memoryUsers = [
    {
        _id: 'seed_user_driver_1',
        name: 'Vikram Kumar (CNG Driver)',
        email: 'driver@routewise.in',
        passwordHash: bcrypt.hashSync('password123', 10),
        role: 'user',
        fuelPreference: 'cng',
        vehicleMileage: 25,
        avatar: null,
        createdAt: new Date().toISOString()
    },
    {
        _id: 'seed_user_fleet_2',
        name: 'Ananya Sharma (Fleet Manager)',
        email: 'fleet@routewise.in',
        passwordHash: bcrypt.hashSync('password123', 10),
        role: 'fleet_manager',
        fuelPreference: 'diesel',
        vehicleMileage: 20,
        avatar: null,
        createdAt: new Date().toISOString()
    }
];

function getMemoryUsers() {
    return memoryUsers;
}

/**
 * Helper to generate JWT token
 */
function generateToken(id) {
    const expire = process.env.JWT_EXPIRE || '7d';
    return jwt.sign({ id: String(id) }, JWT_SECRET, { expiresIn: expire });
}

/**
 * Helper to send token response
 */
function sendTokenResponse(user, statusCode, res, message = 'Success') {
    const token = generateToken(user._id);

    res.status(statusCode).json({
        success: true,
        message,
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            fuelPreference: user.fuelPreference,
            vehicleMileage: user.vehicleMileage,
            avatar: user.avatar,
            createdAt: user.createdAt
        }
    });
}

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
async function register(req, res, next) {
    try {
        const { name, email, password, fuelPreference, vehicleMileage } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide full name, email address, and password.'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long.'
            });
        }

        const cleanEmail = email.toLowerCase().trim();

        if (isDbConnected()) {
            const existingUser = await User.findOne({ email: cleanEmail });
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: `An account with email '${email}' is already registered. Please sign in.`
                });
            }

            const user = await User.create({
                name: name.trim(),
                email: cleanEmail,
                password,
                fuelPreference: fuelPreference || 'cng',
                vehicleMileage: vehicleMileage ? parseFloat(vehicleMileage) : 24
            });

            appEvents.emit('user:registered', {
                id: user._id,
                email: user.email,
                name: user.name
            });

            return sendTokenResponse(user, 201, res, 'Account created successfully!');
        }

        // Memory fallback mode
        const existingMemUser = memoryUsers.find(u => u.email === cleanEmail);
        if (existingMemUser) {
            return res.status(409).json({
                success: false,
                message: `An account with email '${email}' is already registered. Please sign in.`
            });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newMemUser = {
            _id: 'usr_' + Date.now() + Math.floor(Math.random() * 1000),
            name: name.trim(),
            email: cleanEmail,
            passwordHash,
            role: 'user',
            fuelPreference: fuelPreference || 'cng',
            vehicleMileage: vehicleMileage ? parseFloat(vehicleMileage) : 24,
            avatar: null,
            createdAt: new Date().toISOString()
        };
        memoryUsers.push(newMemUser);

        appEvents.emit('user:registered', {
            id: newMemUser._id,
            email: newMemUser.email,
            name: newMemUser.name
        });

        sendTokenResponse(newMemUser, 201, res, 'Account created successfully!');
    } catch (err) {
        next(err);
    }
}

// @desc    Login existing user
// @route   POST /api/auth/login
// @access  Public
async function login(req, res, next) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both email and password.'
            });
        }

        const cleanEmail = email.toLowerCase().trim();

        if (isDbConnected()) {
            const user = await User.findOne({ email: cleanEmail }).select('+password');
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials. User with this email does not exist.'
                });
            }

            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials. Password does not match.'
                });
            }

            appEvents.emit('user:login', { id: user._id, email: user.email });
            return sendTokenResponse(user, 200, res, `Welcome back, ${user.name}!`);
        }

        // Memory fallback mode
        const memUser = memoryUsers.find(u => u.email === cleanEmail);
        if (!memUser) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials. User with this email does not exist.'
            });
        }

        const isMatch = await bcrypt.compare(password, memUser.passwordHash);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials. Password does not match.'
            });
        }

        appEvents.emit('user:login', { id: memUser._id, email: memUser.email });
        sendTokenResponse(memUser, 200, res, `Welcome back, ${memUser.name}!`);
    } catch (err) {
        next(err);
    }
}

// @desc    Get current logged in user profile
// @route   GET /api/auth/me
// @access  Private (Protected)
async function getMe(req, res, next) {
    try {
        res.status(200).json({
            success: true,
            user: req.user
        });
    } catch (err) {
        next(err);
    }
}

// @desc    Update current user profile
// @route   PUT /api/auth/profile
// @access  Private (Protected)
async function updateProfile(req, res, next) {
    try {
        const { name, fuelPreference, vehicleMileage } = req.body;

        if (isDbConnected()) {
            const updates = {};
            if (name) updates.name = name.trim();
            if (fuelPreference) updates.fuelPreference = fuelPreference;
            if (vehicleMileage !== undefined) updates.vehicleMileage = parseFloat(vehicleMileage);

            const updatedUser = await User.findByIdAndUpdate(
                req.user._id,
                updates,
                { new: true, runValidators: true }
            );

            return res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                user: updatedUser
            });
        }

        // Memory fallback mode
        const user = memoryUsers.find(u => String(u._id) === String(req.user._id));
        if (user) {
            if (name) user.name = name.trim();
            if (fuelPreference) user.fuelPreference = fuelPreference;
            if (vehicleMileage !== undefined) user.vehicleMileage = parseFloat(vehicleMileage);
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: user || req.user
        });
    } catch (err) {
        next(err);
    }
}

// @desc    Upload profile avatar image
// @route   POST /api/auth/avatar
// @access  Private (Protected)
async function uploadAvatar(req, res, next) {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please select an image file to upload as your avatar.'
            });
        }

        const avatarUrl = `/uploads/avatars/${req.file.filename}`;

        if (isDbConnected()) {
            const user = await User.findByIdAndUpdate(
                req.user._id,
                { avatar: avatarUrl },
                { new: true }
            );

            return res.status(200).json({
                success: true,
                message: 'Avatar uploaded and updated successfully!',
                avatar: avatarUrl,
                user
            });
        }

        const user = memoryUsers.find(u => String(u._id) === String(req.user._id));
        if (user) user.avatar = avatarUrl;

        res.status(200).json({
            success: true,
            message: 'Avatar uploaded and updated successfully!',
            avatar: avatarUrl,
            user: user || req.user
        });
    } catch (err) {
        next(err);
    }
}

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public
async function logout(req, res) {
    res.status(200).json({
        success: true,
        message: 'Successfully logged out. Client token cleared.'
    });
}

module.exports = {
    register,
    login,
    getMe,
    updateProfile,
    uploadAvatar,
    logout,
    getMemoryUsers
};
