/**
 * RouteWise Backend — Trip Controller
 * Implements complete CRUD REST APIs for user-saved journeys and multi-fuel calculations.
 * Demonstrates Mongoose queries (find, findById, create, update, delete, populate).
 */

const Trip = require('../models/Trip');
const appEvents = require('../utils/appEvents');
const { isDbConnected } = require('../config/db');

// In-memory fallback cache when database is disconnected
const memoryTripsFallback = [];

// @desc    Create and save a new trip
// @route   POST /api/trips
// @access  Private (Protected)
async function createTrip(req, res, next) {
    try {
        const {
            title,
            origin,
            destination,
            stops,
            distanceKm,
            durationMinutes,
            fuelType,
            fuelEfficiency,
            fuelPrice,
            totalCost,
            fuelQuantity,
            co2EmissionsKg,
            comparison,
            cityName,
            notes
        } = req.body;

        if (!title || !origin || !destination || distanceKm === undefined || totalCost === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Missing required trip fields: title, origin, destination, distanceKm, and totalCost are required.'
            });
        }

        const tripData = {
            user: req.user._id,
            title: title.trim(),
            origin,
            destination,
            stops: stops || [],
            distanceKm: parseFloat(distanceKm),
            durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : 0,
            fuelType: fuelType || 'cng',
            fuelEfficiency: fuelEfficiency ? parseFloat(fuelEfficiency) : 25,
            fuelPrice: fuelPrice ? parseFloat(fuelPrice) : 75.09,
            totalCost: parseFloat(totalCost),
            fuelQuantity: fuelQuantity ? parseFloat(fuelQuantity) : 0,
            co2EmissionsKg: co2EmissionsKg ? parseFloat(co2EmissionsKg) : 0,
            comparison: comparison || {},
            cityName: cityName || 'Reference',
            notes: notes ? notes.trim() : ''
        };

        let savedTrip;
        if (isDbConnected()) {
            savedTrip = await Trip.create(tripData);
        } else {
            // Memory fallback with mock ID
            savedTrip = {
                _id: 'mem_' + Date.now(),
                ...tripData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            memoryTripsFallback.unshift(savedTrip);
        }

        // Emit application event
        appEvents.emit('trip:saved', {
            tripId: savedTrip._id,
            userId: req.user._id,
            title: savedTrip.title,
            distanceKm: savedTrip.distanceKm,
            totalCost: savedTrip.totalCost
        });

        res.status(201).json({
            success: true,
            message: `Trip "${savedTrip.title}" saved successfully!`,
            trip: savedTrip
        });
    } catch (err) {
        next(err);
    }
}

// @desc    Get all saved trips for the authenticated user
// @route   GET /api/trips
// @access  Private (Protected)
async function getTrips(req, res, next) {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;
        const search = req.query.q ? req.query.q.trim() : '';

        if (!isDbConnected()) {
            const userTrips = memoryTripsFallback.filter(t => String(t.user) === String(req.user._id));
            return res.status(200).json({
                success: true,
                count: userTrips.length,
                total: userTrips.length,
                page: 1,
                pages: 1,
                trips: userTrips
            });
        }

        const query = { user: req.user._id };
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { 'origin.name': { $regex: search, $options: 'i' } },
                { 'destination.name': { $regex: search, $options: 'i' } }
            ];
        }

        const total = await Trip.countDocuments(query);
        const trips = await Trip.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('user', 'name email');

        res.status(200).json({
            success: true,
            count: trips.length,
            total,
            page,
            pages: Math.ceil(total / limit) || 1,
            trips
        });
    } catch (err) {
        next(err);
    }
}

// @desc    Get a single trip by ID
// @route   GET /api/trips/:id
// @access  Private (Protected)
async function getTripById(req, res, next) {
    try {
        if (!isDbConnected()) {
            const trip = memoryTripsFallback.find(t => String(t._id) === req.params.id);
            if (!trip || String(trip.user) !== String(req.user._id)) {
                return res.status(404).json({ success: false, message: 'Trip not found.' });
            }
            return res.status(200).json({ success: true, trip });
        }

        const trip = await Trip.findById(req.params.id).populate('user', 'name email role');

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: `Trip with ID '${req.params.id}' not found.`
            });
        }

        // Authorization check: User can only view their own trips (unless admin)
        if (String(trip.user._id) !== String(req.user._id) && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: You do not have permission to view this trip.'
            });
        }

        res.status(200).json({
            success: true,
            trip
        });
    } catch (err) {
        next(err);
    }
}

// @desc    Update a trip's details or notes
// @route   PUT /api/trips/:id
// @access  Private (Protected)
async function updateTrip(req, res, next) {
    try {
        const { title, notes, fuelEfficiency, fuelPrice } = req.body;

        if (!isDbConnected()) {
            const index = memoryTripsFallback.findIndex(t => String(t._id) === req.params.id);
            if (index === -1) return res.status(404).json({ success: false, message: 'Trip not found.' });
            if (title) memoryTripsFallback[index].title = title;
            if (notes !== undefined) memoryTripsFallback[index].notes = notes;
            return res.status(200).json({ success: true, trip: memoryTripsFallback[index] });
        }

        let trip = await Trip.findById(req.params.id);

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: `Trip with ID '${req.params.id}' not found.`
            });
        }

        // Authorization check
        if (String(trip.user) !== String(req.user._id) && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: You do not have permission to modify this trip.'
            });
        }

        const updates = {};
        if (title) updates.title = title.trim();
        if (notes !== undefined) updates.notes = notes.trim();
        if (fuelEfficiency) updates.fuelEfficiency = parseFloat(fuelEfficiency);
        if (fuelPrice) updates.fuelPrice = parseFloat(fuelPrice);

        trip = await Trip.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            message: 'Trip updated successfully!',
            trip
        });
    } catch (err) {
        next(err);
    }
}

// @desc    Delete a saved trip
// @route   DELETE /api/trips/:id
// @access  Private (Protected)
async function deleteTrip(req, res, next) {
    try {
        if (!isDbConnected()) {
            const idx = memoryTripsFallback.findIndex(t => String(t._id) === req.params.id);
            if (idx === -1) return res.status(404).json({ success: false, message: 'Trip not found.' });
            memoryTripsFallback.splice(idx, 1);
            return res.status(200).json({ success: true, message: 'Trip deleted successfully.' });
        }

        const trip = await Trip.findById(req.params.id);

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: `Trip with ID '${req.params.id}' not found.`
            });
        }

        // Authorization check
        if (String(trip.user) !== String(req.user._id) && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: You do not have permission to delete this trip.'
            });
        }

        await Trip.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: `Trip "${trip.title}" deleted successfully.`
        });
    } catch (err) {
        next(err);
    }
}

// @desc    Upload an attachment / receipt for a trip
// @route   POST /api/trips/:id/attachment
// @access  Private (Protected)
async function uploadTripAttachment(req, res, next) {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a file attachment.'
            });
        }

        const attachmentUrl = `/uploads/trips/${req.file.filename}`;

        if (!isDbConnected()) {
            return res.status(200).json({
                success: true,
                message: 'Attachment uploaded successfully.',
                attachment: attachmentUrl
            });
        }

        const trip = await Trip.findById(req.params.id);
        if (!trip) {
            return res.status(404).json({ success: false, message: 'Trip not found.' });
        }

        if (String(trip.user) !== String(req.user._id) && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden.' });
        }

        trip.attachment = attachmentUrl;
        await trip.save();

        res.status(200).json({
            success: true,
            message: 'Trip attachment uploaded successfully!',
            attachment: attachmentUrl,
            trip
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    createTrip,
    getTrips,
    getTripById,
    updateTrip,
    deleteTrip,
    uploadTripAttachment
};
