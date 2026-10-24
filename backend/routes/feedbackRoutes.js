/**
 * RouteWise Backend — Feedback Routes
 * Endpoints for submitting suggestions and retrieving feedback list.
 */

const express = require('express');
const router = express.Router();
const { submitFeedback, getFeedback } = require('../controllers/feedbackController');
const { optionalAuth, protect, authorize } = require('../middleware/auth');

router.post('/', optionalAuth, submitFeedback);
router.get('/', protect, authorize('admin', 'fleet_manager'), getFeedback);

module.exports = router;
