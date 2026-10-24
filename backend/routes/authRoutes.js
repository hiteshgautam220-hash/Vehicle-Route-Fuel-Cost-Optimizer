/**
 * RouteWise Backend — Auth Routes
 * Endpoints for user registration, login, logout, profile, and avatar upload.
 */

const express = require('express');
const router = express.Router();
const {
    register,
    login,
    getMe,
    updateProfile,
    uploadAvatar,
    logout
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { uploadAvatar: avatarUploader } = require('../middleware/upload');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/avatar', protect, avatarUploader, uploadAvatar);

module.exports = router;
