/**
 * RouteWise Backend — Trip Routes
 * Endpoints for CRUD operations on trips and receipt file attachments.
 */

const express = require('express');
const router = express.Router();
const {
    createTrip,
    getTrips,
    getTripById,
    updateTrip,
    deleteTrip,
    uploadTripAttachment
} = require('../controllers/tripController');
const { protect } = require('../middleware/auth');
const { uploadTripAttachment: attachmentUploader } = require('../middleware/upload');

// All trip routes require authentication
router.use(protect);

router.route('/')
    .get(getTrips)
    .post(createTrip);

router.route('/:id')
    .get(getTripById)
    .put(updateTrip)
    .delete(deleteTrip);

router.post('/:id/attachment', attachmentUploader, uploadTripAttachment);

module.exports = router;
