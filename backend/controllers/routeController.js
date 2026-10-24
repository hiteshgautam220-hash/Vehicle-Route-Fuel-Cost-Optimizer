/**
 * RouteWise Backend — Route Calculation Controller
 * Exposes REST API to calculate route road distances and complete multi-fuel economics.
 */

const { calculateRouteAndFuel } = require('../services/routeService');

// @desc    Calculate distance and fuel prices for waypoints
// @route   POST /api/routes/calculate
// @access  Public
async function calculateRoute(req, res, next) {
    try {
        const { waypoints, fuelType, fuelEfficiency, fuelPrice, rates, efficiencies } = req.body;

        if (!waypoints || !Array.isArray(waypoints) || waypoints.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Please provide at least 2 valid waypoints (origin and destination) with lat and lng coordinates.'
            });
        }

        // Validate coordinate values
        for (let i = 0; i < waypoints.length; i++) {
            const w = waypoints[i];
            if (typeof w.lat !== 'number' || typeof w.lng !== 'number' || isNaN(w.lat) || isNaN(w.lng)) {
                return res.status(400).json({
                    success: false,
                    message: `Waypoint #${i + 1} (${w.name || 'unnamed'}) contains invalid geographic coordinates.`
                });
            }
        }

        const result = await calculateRouteAndFuel({
            waypoints,
            fuelParams: {
                fuelType: fuelType || 'cng',
                fuelEfficiency: parseFloat(fuelEfficiency) || 25,
                fuelPrice: parseFloat(fuelPrice) || 75.09,
                rates: rates || { petrol: 94.72, diesel: 87.62, cng: 75.09 },
                efficiencies: efficiencies || { petrol: 15, diesel: 20, cng: 25 }
            }
        });

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    calculateRoute
};
