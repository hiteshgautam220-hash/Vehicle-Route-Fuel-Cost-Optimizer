/**
 * RouteWise — cities.js
 * CSV loader, city search (findCity), and datalist population.
 * Depends on: config.js (FALLBACK_INDIAN_CITIES)
 */

let cityData = [];

// ── CSV Loader ────────────────────────────────────────────────────
async function loadCityData() {
    let loadedFromCsv = false;
    try {
        const response = await fetch('data/cities.csv');
        if (response.ok) {
            const csvText = await response.text();
            const rows    = csvText.split('\n');

            for (let i = 1; i < rows.length; i++) {
                if (!rows[i].trim()) continue;
                const cols       = rows[i].split(',');
                let   cityName   = (cols[1] ? cols[1].trim() : '').replace(/Latitude and Longitude/gi, '').trim();
                const lat        = parseFloat(cols[2]);
                const lng        = parseFloat(cols[3]);
                if (cityName && !isNaN(lat) && !isNaN(lng)) cityData.push({ name: cityName, lat, lng });
            }
            if (cityData.length > 0) loadedFromCsv = true;
        }
    } catch (err) {
        console.warn('Using fallback Indian cities dataset.', err);
    }

    if (!loadedFromCsv || cityData.length === 0) {
        cityData = [...FALLBACK_INDIAN_CITIES];
    } else {
        FALLBACK_INDIAN_CITIES.forEach(metro => {
            if (!cityData.some(c => c.name.toLowerCase() === metro.name.toLowerCase())) cityData.unshift(metro);
        });
    }

    // Populate datalist (limit to 1500 for performance)
    const datalist = document.getElementById('city-options');
    if (datalist) {
        datalist.innerHTML = '';
        cityData.slice(0, 1500).forEach(city => {
            const opt   = document.createElement('option');
            opt.value   = city.name;
            datalist.appendChild(opt);
        });
    }
}

// ── City Lookup ───────────────────────────────────────────────────
function findCity(query) {
    if (!query) return null;
    const clean = query.trim().toLowerCase();
    return cityData.find(c => c.name.toLowerCase() === clean) ||
           cityData.find(c => c.name.toLowerCase().includes(clean));
}
