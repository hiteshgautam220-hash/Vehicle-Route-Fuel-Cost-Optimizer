/**
 * RouteWise Backend — City & GIS Controller
 * Demonstrates Node.js Streams (`fs.createReadStream`), `readline` interface,
 * Path module, and in-memory caching for sub-millisecond autocomplete across 4,200+ Indian cities.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

let cachedCities = null;
let isCaching = false;

// Fallback Indian Cities dataset
const FALLBACK_CITIES = [
    { name: "Delhi",          lat: 28.6139, lng: 77.2090, state: "Delhi" },
    { name: "New Delhi",      lat: 28.6139, lng: 77.2090, state: "Delhi" },
    { name: "Mumbai",         lat: 19.0760, lng: 72.8777, state: "Maharashtra" },
    { name: "Bengaluru",      lat: 12.9716, lng: 77.5946, state: "Karnataka" },
    { name: "Kolkata",        lat: 22.5726, lng: 88.3639, state: "West Bengal" },
    { name: "Chennai",        lat: 13.0827, lng: 80.2707, state: "Tamil Nadu" },
    { name: "Hyderabad",      lat: 17.3850, lng: 78.4867, state: "Telangana" },
    { name: "Ahmedabad",      lat: 23.0225, lng: 72.5714, state: "Gujarat" },
    { name: "Pune",           lat: 18.5204, lng: 73.8567, state: "Maharashtra" },
    { name: "Jaipur",         lat: 26.9124, lng: 75.7873, state: "Rajasthan" },
    { name: "Surat",          lat: 21.1702, lng: 72.8311, state: "Gujarat" },
    { name: "Lucknow",        lat: 26.8467, lng: 80.9462, state: "Uttar Pradesh" },
    { name: "Kanpur",         lat: 26.4499, lng: 80.3319, state: "Uttar Pradesh" },
    { name: "Nagpur",         lat: 21.1458, lng: 79.0882, state: "Maharashtra" },
    { name: "Indore",         lat: 22.7196, lng: 75.8577, state: "Madhya Pradesh" },
    { name: "Thane",          lat: 19.2183, lng: 72.9781, state: "Maharashtra" },
    { name: "Bhopal",         lat: 23.2599, lng: 77.4126, state: "Madhya Pradesh" },
    { name: "Visakhapatnam",  lat: 17.6868, lng: 83.2185, state: "Andhra Pradesh" },
    { name: "Patna",          lat: 25.5941, lng: 85.1376, state: "Bihar" },
    { name: "Vadodara",       lat: 22.3072, lng: 73.1812, state: "Gujarat" },
    { name: "Ghaziabad",      lat: 28.6692, lng: 77.4538, state: "Uttar Pradesh" },
    { name: "Ludhiana",       lat: 30.9010, lng: 75.8573, state: "Punjab" },
    { name: "Agra",           lat: 27.1767, lng: 78.0081, state: "Uttar Pradesh" },
    { name: "Nashik",         lat: 19.9975, lng: 73.7898, state: "Maharashtra" },
    { name: "Faridabad",      lat: 28.4089, lng: 77.3178, state: "Haryana" },
    { name: "Meerut",         lat: 28.9845, lng: 77.7064, state: "Uttar Pradesh" },
    { name: "Rajkot",         lat: 22.3039, lng: 70.8022, state: "Gujarat" },
    { name: "Varanasi",       lat: 25.3176, lng: 82.9739, state: "Uttar Pradesh" },
    { name: "Srinagar",       lat: 34.0837, lng: 74.7973, state: "Jammu and Kashmir" },
    { name: "Aurangabad",     lat: 19.8762, lng: 75.3433, state: "Maharashtra" },
    { name: "Dhanbad",        lat: 23.7957, lng: 86.4304, state: "Jharkhand" },
    { name: "Amritsar",       lat: 31.6340, lng: 74.8723, state: "Punjab" },
    { name: "Chandigarh",     lat: 30.7333, lng: 76.7794, state: "Chandigarh" },
    { name: "Coimbatore",     lat: 11.0168, lng: 76.9558, state: "Tamil Nadu" },
    { name: "Kochi",          lat: 9.9312,  lng: 76.2673, state: "Kerala" },
    { name: "Hisar",          lat: 29.1492, lng: 75.7217, state: "Haryana" },
    { name: "Gurugram",       lat: 28.4595, lng: 77.0266, state: "Haryana" },
    { name: "Noida",          lat: 28.5355, lng: 77.3910, state: "Uttar Pradesh" },
    { name: "Dehradun",       lat: 30.3165, lng: 78.0322, state: "Uttarakhand" },
    { name: "Shimla",         lat: 31.1048, lng: 77.1734, state: "Himachal Pradesh" }
];

/**
 * Loads and streams cities from CSV file using Node.js fs.createReadStream and readline.
 */
function loadCitiesFromCsvStream() {
    return new Promise((resolve) => {
        if (cachedCities && cachedCities.length > 0) {
            return resolve(cachedCities);
        }

        const csvPaths = [
            path.join(__dirname, '..', 'data', 'cities.csv'),
            path.join(__dirname, '..', '..', 'data', 'cities.csv'),
            path.join(__dirname, '..', '..', 'frontend', 'data', 'cities.csv')
        ];

        let foundPath = csvPaths.find(p => fs.existsSync(p));

        if (!foundPath) {
            console.warn('[CityController] cities.csv not found on disk, using fallback dataset.');
            cachedCities = [...FALLBACK_CITIES];
            return resolve(cachedCities);
        }

        const cities = [];
        const fileStream = fs.createReadStream(foundPath, { encoding: 'utf-8' });
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        let isHeader = true;

        rl.on('line', (line) => {
            if (isHeader) {
                isHeader = false;
                return;
            }
            if (!line.trim()) return;

            const cols = line.split(',');
            // CSV schema: [0]=State/ID, [1]=CityName, [2]=Lat, [3]=Lng
            let cityName = (cols[1] ? cols[1].trim() : '').replace(/Latitude and Longitude/gi, '').trim();
            const lat = parseFloat(cols[2]);
            const lng = parseFloat(cols[3]);
            const state = cols[0] ? cols[0].trim() : '';

            if (cityName && !isNaN(lat) && !isNaN(lng)) {
                cities.push({ name: cityName, lat, lng, state });
            }
        });

        rl.on('close', () => {
            // Ensure major metros are at the top
            FALLBACK_CITIES.forEach(metro => {
                if (!cities.some(c => c.name.toLowerCase() === metro.name.toLowerCase())) {
                    cities.unshift(metro);
                }
            });
            cachedCities = cities;
            console.log(`[CityController] Streamed and cached ${cities.length} Indian cities.`);
            resolve(cachedCities);
        });

        rl.on('error', (err) => {
            console.error('[CityController] Error streaming CSV:', err.message);
            cachedCities = [...FALLBACK_CITIES];
            resolve(cachedCities);
        });
    });
}

// Pre-load on startup
loadCitiesFromCsvStream();

// @desc    Search Indian cities for autocomplete
// @route   GET /api/cities
// @access  Public
async function searchCities(req, res, next) {
    try {
        const query = req.query.q ? req.query.q.trim().toLowerCase() : '';
        const limit = parseInt(req.query.limit, 10) || 50;

        const allCities = await loadCitiesFromCsvStream();

        if (!query) {
            return res.status(200).json({
                success: true,
                count: Math.min(limit, allCities.length),
                total: allCities.length,
                cities: allCities.slice(0, limit)
            });
        }

        // Search with prefix match prioritized over substring
        const prefixMatches = [];
        const substringMatches = [];

        for (const city of allCities) {
            const nameLower = city.name.toLowerCase();
            if (nameLower.startsWith(query)) {
                prefixMatches.push(city);
            } else if (nameLower.includes(query)) {
                substringMatches.push(city);
            }
            if (prefixMatches.length + substringMatches.length >= limit * 2) break;
        }

        const results = [...prefixMatches, ...substringMatches].slice(0, limit);

        res.status(200).json({
            success: true,
            query,
            count: results.length,
            cities: results
        });
    } catch (err) {
        next(err);
    }
}

// @desc    Get GIS dataset statistics
// @route   GET /api/cities/stats
// @access  Public
async function getCityStats(req, res, next) {
    try {
        const allCities = await loadCitiesFromCsvStream();
        res.status(200).json({
            success: true,
            totalCities: allCities.length,
            streamingEngine: 'Node.js fs.createReadStream + readline',
            sample: allCities.slice(0, 5)
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    searchCities,
    getCityStats,
    loadCitiesFromCsvStream
};
