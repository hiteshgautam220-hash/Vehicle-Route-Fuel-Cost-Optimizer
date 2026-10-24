/**
 * RouteWise Backend — City GIS Routes
 * Autocomplete search and statistics for Indian cities.
 */

const express = require('express');
const router = express.Router();
const {
    searchCities,
    getCityStats
} = require('../controllers/cityController');

router.get('/', searchCities);
router.get('/stats', getCityStats);

module.exports = router;
