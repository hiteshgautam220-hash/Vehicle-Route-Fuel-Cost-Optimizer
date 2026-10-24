/**
 * RouteWise Backend — Route & Fuel Calculation Service
 * Computes road network distances, travel duration, multi-fuel economics
 * (Petrol vs Diesel vs CNG), CO2 emissions, and monetary savings.
 */

const https = require('https');
const http = require('http');

/**
 * Calculates straight-line Haversine distance between two coordinates in kilometers.
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Fallback multi-stop road distance calculation using Haversine with a 1.25x road winding factor.
 */
function calculateFallbackDistance(waypoints) {
    let totalKm = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
        const seg = haversineDistance(
            waypoints[i].lat, waypoints[i].lng,
            waypoints[i + 1].lat, waypoints[i + 1].lng
        );
        totalKm += seg * 1.25; // Indian highway alignment curvature factor
    }
    // Estimate average speed 65 km/h for duration
    const durationMinutes = Math.round((totalKm / 65) * 60);
    return {
        distanceKm: Math.round(totalKm * 10) / 10,
        durationMinutes,
        source: 'haversine_formula_road_calibrated'
    };
}

/**
 * Fetch real road distance from OSRM HTTP API with timeout.
 */
function fetchOsrmRoute(waypoints) {
    return new Promise((resolve, reject) => {
        // Construct coordinate string: lng,lat;lng,lat...
        const coordStr = waypoints.map(w => `${w.lng},${w.lat}`).join(';');
        const url = `http://router.project-osrm.org/route/v1/driving/${coordStr}?overview=false&steps=false`;

        const req = http.get(url, { timeout: 4000 }, (res) => {
            if (res.statusCode !== 200) {
                res.resume();
                return reject(new Error(`OSRM status ${res.statusCode}`));
            }

            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.code === 'Ok' && json.routes && json.routes.length > 0) {
                        const distMeters = json.routes[0].distance;
                        const durationSec = json.routes[0].duration;
                        resolve({
                            distanceKm: Math.round((distMeters / 1000) * 10) / 10,
                            durationMinutes: Math.round(durationSec / 60),
                            source: 'osrm_live_highway_engine'
                        });
                    } else {
                        reject(new Error('No route returned by OSRM'));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('OSRM request timed out'));
        });
    });
}

/**
 * Calculates complete multi-fuel economics given distance and parameters.
 */
function computeFuelEconomics({
    distanceKm,
    durationMinutes,
    selectedFuel = 'cng',
    userEfficiency = 25,
    userPrice = 75.09,
    rates = { petrol: 94.72, diesel: 87.62, cng: 75.09 },
    efficiencies = { petrol: 15, diesel: 20, cng: 25 }
}) {
    // 1. Petrol calculation
    const petrolQty = distanceKm / efficiencies.petrol;
    const petrolCost = Math.round(petrolQty * rates.petrol * 100) / 100;
    const petrolCo2 = Math.round(petrolQty * 2.31 * 10) / 10;

    // 2. Diesel calculation
    const dieselQty = distanceKm / efficiencies.diesel;
    const dieselCost = Math.round(dieselQty * rates.diesel * 100) / 100;
    const dieselCo2 = Math.round(dieselQty * 2.68 * 10) / 10;

    // 3. CNG calculation
    const cngQty = distanceKm / efficiencies.cng;
    const cngCost = Math.round(cngQty * rates.cng * 100) / 100;
    const cngCo2 = Math.round(cngQty * 1.85 * 10) / 10;

    // Savings vs Petrol
    const cngSavingsVsPetrol = Math.round((petrolCost - cngCost) * 100) / 100;
    const cngSavingsPct = petrolCost > 0 ? Math.round((cngSavingsVsPetrol / petrolCost) * 1000) / 10 : 0;

    // Determine user selected fuel figures
    let totalCost, fuelQuantity, costPerKm, co2EmissionsKg, fuelUnit;

    switch (selectedFuel) {
        case 'petrol':
            fuelQuantity = Math.round((distanceKm / (userEfficiency || efficiencies.petrol)) * 10) / 10;
            totalCost = Math.round(fuelQuantity * (userPrice || rates.petrol) * 100) / 100;
            costPerKm = distanceKm > 0 ? Math.round((totalCost / distanceKm) * 100) / 100 : 0;
            co2EmissionsKg = Math.round(fuelQuantity * 2.31 * 10) / 10;
            fuelUnit = 'L';
            break;
        case 'diesel':
            fuelQuantity = Math.round((distanceKm / (userEfficiency || efficiencies.diesel)) * 10) / 10;
            totalCost = Math.round(fuelQuantity * (userPrice || rates.diesel) * 100) / 100;
            costPerKm = distanceKm > 0 ? Math.round((totalCost / distanceKm) * 100) / 100 : 0;
            co2EmissionsKg = Math.round(fuelQuantity * 2.68 * 10) / 10;
            fuelUnit = 'L';
            break;
        case 'cng':
        default:
            fuelQuantity = Math.round((distanceKm / (userEfficiency || efficiencies.cng)) * 10) / 10;
            totalCost = Math.round(fuelQuantity * (userPrice || rates.cng) * 100) / 100;
            costPerKm = distanceKm > 0 ? Math.round((totalCost / distanceKm) * 100) / 100 : 0;
            co2EmissionsKg = Math.round(fuelQuantity * 1.85 * 10) / 10;
            fuelUnit = 'kg';
            break;
    }

    return {
        distanceKm,
        durationMinutes,
        selectedFuel,
        totalCost,
        fuelQuantity,
        fuelUnit,
        costPerKm,
        co2EmissionsKg,
        comparison: {
            petrol: {
                quantityL: Math.round(petrolQty * 10) / 10,
                cost: petrolCost,
                costPerKm: distanceKm > 0 ? Math.round((petrolCost / distanceKm) * 100) / 100 : 0,
                co2Kg: petrolCo2
            },
            diesel: {
                quantityL: Math.round(dieselQty * 10) / 10,
                cost: dieselCost,
                costPerKm: distanceKm > 0 ? Math.round((dieselCost / distanceKm) * 100) / 100 : 0,
                co2Kg: dieselCo2
            },
            cng: {
                quantityKg: Math.round(cngQty * 10) / 10,
                cost: cngCost,
                costPerKm: distanceKm > 0 ? Math.round((cngCost / distanceKm) * 100) / 100 : 0,
                co2Kg: cngCo2
            },
            savingsVsPetrol: cngSavingsVsPetrol,
            savingsPercent: cngSavingsPct
        }
    };
}

/**
 * Primary calculation orchestration function
 */
async function calculateRouteAndFuel({ waypoints, fuelParams }) {
    if (!waypoints || waypoints.length < 2) {
        throw new Error('At least two valid waypoints (origin and destination) are required.');
    }

    let routeDistanceResult;
    try {
        routeDistanceResult = await fetchOsrmRoute(waypoints);
    } catch (err) {
        // Fallback to high-precision haversine road model
        routeDistanceResult = calculateFallbackDistance(waypoints);
    }

    const economics = computeFuelEconomics({
        distanceKm: routeDistanceResult.distanceKm,
        durationMinutes: routeDistanceResult.durationMinutes,
        selectedFuel: fuelParams.fuelType || 'cng',
        userEfficiency: fuelParams.fuelEfficiency,
        userPrice: fuelParams.fuelPrice,
        rates: fuelParams.rates,
        efficiencies: fuelParams.efficiencies
    });

    return {
        ...economics,
        calculationEngine: routeDistanceResult.source,
        waypoints
    };
}

module.exports = {
    haversineDistance,
    calculateFallbackDistance,
    computeFuelEconomics,
    calculateRouteAndFuel
};
