/**
 * RouteWise Backend — Fuel Rate Routes
 * Endpoints for viewing reference city rates and administrative updates.
 */

const express = require('express');
const router = express.Router();
const {
    getFuelRates,
    getCityRate,
    updateFuelRate
} = require('../controllers/fuelRateController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getFuelRates);
router.get('/:city', getCityRate);
router.post('/', protect, authorize('admin', 'fleet_manager'), updateFuelRate);

module.exports = router;
