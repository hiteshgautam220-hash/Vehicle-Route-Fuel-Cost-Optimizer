/**
 * RouteWise Backend — Feedback & Community Controller
 * Saves user suggestions, rate updates, bug reports, and emits notifications.
 */

const Feedback = require('../models/Feedback');
const appEvents = require('../utils/appEvents');
const { isDbConnected } = require('../config/db');

const memoryFeedbackFallback = [];

// @desc    Submit user feedback or inquiry
// @route   POST /api/feedback
// @access  Public (optional auth attaches user ID)
async function submitFeedback(req, res, next) {
    try {
        const { name, email, topic, subject, message } = req.body;

        if (!name || !email || !topic || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'All fields (name, email, topic, subject, message) are required.'
            });
        }

        const feedbackData = {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            topic: topic.trim(),
            subject: subject.trim(),
            message: message.trim(),
            user: req.user ? req.user._id : null
        };

        let savedRecord;
        if (isDbConnected()) {
            savedRecord = await Feedback.create(feedbackData);
        } else {
            savedRecord = {
                _id: 'fb_' + Date.now(),
                ...feedbackData,
                createdAt: new Date().toISOString()
            };
            memoryFeedbackFallback.unshift(savedRecord);
        }

        // Emit application event
        appEvents.emit('feedback:received', {
            id: savedRecord._id,
            name: savedRecord.name,
            email: savedRecord.email,
            topic: savedRecord.topic,
            subject: savedRecord.subject
        });

        res.status(201).json({
            success: true,
            message: 'Thank you for your feedback! The RouteWise team has received your message.',
            feedbackId: savedRecord._id
        });
    } catch (err) {
        next(err);
    }
}

// @desc    Get all feedback messages
// @route   GET /api/feedback
// @access  Private (Admin / Fleet Manager)
async function getFeedback(req, res, next) {
    try {
        if (!isDbConnected()) {
            return res.status(200).json({
                success: true,
                count: memoryFeedbackFallback.length,
                feedback: memoryFeedbackFallback
            });
        }

        const list = await Feedback.find().sort({ createdAt: -1 }).populate('user', 'name email');

        res.status(200).json({
            success: true,
            count: list.length,
            feedback: list
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    submitFeedback,
    getFeedback
};
