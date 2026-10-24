/**
 * RouteWise Backend — Route Calculation Routes
 * Endpoints for distance optimization and multi-fuel price matrix calculations.
 */

const express = require('express');
const router = express.Router();
const { calculateRoute } = require('../controllers/routeController');

router.post('/calculate', calculateRoute);

module.exports = router;
