/**
 * RouteWise — map.js
 * Leaflet map init, markers, OSRM routing, Haversine fallback,
 * intermediate stops, city chip logic, fuel selector sync.
 * Depends on: config.js, utils.js, cities.js
 */

// ── Map State ────────────────────────────────────────────────────
let map          = null;
let markers      = [];
let routeLayer   = null;
let intermediateStops  = [];
let currentTripResult  = null;
// Note: currentFuelType is declared in config.js (shared state)

// ── Leaflet Init ─────────────────────────────────────────────────
function initializeMap() {
    if (map) return;
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    map = L.map('map').setView([20.5937, 78.9629], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
    }).addTo(map);

    map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        intermediateStops.push({ name: `Pin (${lat.toFixed(2)}, ${lng.toFixed(2)})`, lat, lng });
        renderIntermediateStops();
        showToast('Added intermediate waypoint on map', 'info');
    });
}

// ── Intermediate Stops ───────────────────────────────────────────
function renderIntermediateStops() {
    const list = document.getElementById('intermediate-stops-list');
    if (!list) return;
    list.innerHTML = '';

    intermediateStops.forEach((stop, idx) => {
        const li = document.createElement('li');
        li.className = 'd-flex justify-content-between align-items-center p-2 mb-1 bg-white rounded border small';
        li.innerHTML = `
            <div>
                <span class="badge bg-secondary me-1">Via ${idx + 1}</span>
                <strong>${stop.name}</strong>
            </div>
            <button class="btn btn-sm btn-outline-danger py-0 px-2" onclick="removeIntermediateStop(${idx})">
                <i class="fas fa-times"></i>
            </button>`;
        list.appendChild(li);
    });

    const badge = document.getElementById('stops-counter-badge');
    if (badge) badge.textContent = `${2 + intermediateStops.length} places`;
}

window.removeIntermediateStop = (idx) => {
    intermediateStops.splice(idx, 1);
    renderIntermediateStops();
    showToast('Removed waypoint', 'warning');
};

// ── Journey Input Wiring ─────────────────────────────────────────
document.getElementById('btn-swap-from-to')?.addEventListener('click', () => {
    const origin = document.getElementById('origin-city-input');
    const dest   = document.getElementById('dest-city-input');
    if (!origin || !dest) return;
    [origin.value, dest.value] = [dest.value, origin.value];
    showToast('Swapped Origin & Destination', 'info');
});

document.getElementById('btn-add-intermediate')?.addEventListener('click', () => {
    const input   = document.getElementById('intermediate-city-input');
    const cityVal = input?.value.trim();
    if (!cityVal) return;
    const cityObj = findCity(cityVal);
    if (!cityObj) { showToast(`City "${cityVal}" not found in database.`, 'error'); return; }
    intermediateStops.push(cityObj);
    if (input) input.value = '';
    renderIntermediateStops();
    showToast(`Added intermediate stop: ${cityObj.name}`, 'success');
});

document.querySelectorAll('.city-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        const cityName  = chip.getAttribute('data-city');
        const originInput = document.getElementById('origin-city-input');
        const destInput   = document.getElementById('dest-city-input');
        if (!originInput.value)      { originInput.value = cityName; showToast(`Set ${cityName} as Origin`, 'info'); }
        else if (!destInput.value)   { destInput.value   = cityName; showToast(`Set ${cityName} as Destination`, 'info'); }
        else {
            const cityObj = findCity(cityName);
            if (cityObj) { intermediateStops.push(cityObj); renderIntermediateStops(); showToast(`Added ${cityName} as intermediate stop`, 'info'); }
        }
    });
});

window.loadRoutePreset = (origin, dest, stops = []) => {
    const originEl = document.getElementById('origin-city-input');
    const destEl = document.getElementById('dest-city-input');
    if (originEl) originEl.value = origin;
    if (destEl) destEl.value = dest;
    
    intermediateStops = stops.map(s => {
        if (typeof s === 'string') {
            const found = typeof findCity === 'function' ? findCity(s) : null;
            return found || { name: s, lat: 0, lng: 0 };
        }
        return s;
    }).filter(s => s && s.name);

    if (typeof renderIntermediateStops === 'function') renderIntermediateStops();
    if (typeof switchTab === 'function') switchTab('optimizer');
    
    setTimeout(() => {
        if (typeof runRouteOptimization === 'function') runRouteOptimization();
        const resultsEl = document.getElementById('results-card');
        if (resultsEl) resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
    showToast(`Loaded route "${origin} ➔ ${dest}"!`, 'success');
};

document.getElementById('btn-quick-delhi-mumbai')?.addEventListener('click', () => {
    loadRoutePreset('Delhi', 'Mumbai', ['Jaipur', 'Ahmedabad']);
});

// ── Fuel Type Switching ──────────────────────────────────────────
document.querySelectorAll('.fuel-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.fuel-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFuelType = btn.getAttribute('data-fuel');
        updateFuelInputsForType(currentFuelType);
    });
});

function updateFuelInputsForType(fuelType) {
    const cfg = FUEL_DEFAULTS[fuelType] || FUEL_DEFAULTS.cng;
    const effInput   = document.getElementById('fuel-efficiency');
    const priceInput = document.getElementById('fuel-price');
    const effUnit    = document.getElementById('eff-unit');
    const effLabel   = document.getElementById('eff-label');
    const priceLabel = document.getElementById('price-label');
    if (effInput)   effInput.value   = cfg.efficiency;
    if (priceInput) priceInput.value = cfg.price;
    if (effUnit)    effUnit.textContent   = cfg.unit;
    if (effLabel)   effLabel.textContent  = `Mileage (${cfg.unit})`;
    if (priceLabel) priceLabel.textContent = `Fuel Price (${cfg.priceUnit})`;
}

document.getElementById('city-rate-sync-select')?.addEventListener('change', (e) => {
    if (e.target.value === 'custom') return;
    const cityObj = CITY_FUEL_RATES.find(c => c.city.toLowerCase().includes(e.target.value.toLowerCase()));
    if (!cityObj) return;
    let price = currentFuelType === 'petrol' ? cityObj.petrol : currentFuelType === 'diesel' ? cityObj.diesel : cityObj.cng;
    document.getElementById('fuel-price').value = price;
    showToast(`Updated price for ${cityObj.city}: ₹${price}`, 'info');
});

// ── Route Optimization (OSRM) ────────────────────────────────────
document.getElementById('optimize-btn')?.addEventListener('click', runRouteOptimization);

async function runRouteOptimization() {
    const originName = document.getElementById('origin-city-input')?.value.trim();
    const destName   = document.getElementById('dest-city-input')?.value.trim();

    if (!originName || !destName) { showToast('Please enter both a Starting Place and Destination.', 'warning'); return; }

    const originCity = findCity(originName);
    const destCity   = findCity(destName);
    if (!originCity) { showToast(`Origin "${originName}" could not be found.`, 'error'); return; }
    if (!destCity)   { showToast(`Destination "${destName}" could not be found.`, 'error'); return; }

    // Fix #2 — same city guard
    if (originCity.name.toLowerCase() === destCity.name.toLowerCase()) {
        showToast('Origin and Destination cannot be the same city!', 'warning');
        return;
    }

    const activeStops = [
        { ...originCity, type: 'origin' },
        ...intermediateStops.map(s => ({ ...s, type: 'intermediate' })),
        { ...destCity, type: 'destination' }
    ];

    // Trigger calculation progress bars and stream animation
    const fromToContainer = document.querySelector('.from-to-container');
    const fromToProgress  = document.getElementById('from-to-progress-bar');
    const btnProgress     = document.getElementById('btn-calc-progress-bar');
    const optBtn          = document.getElementById('optimize-btn');

    if (fromToContainer) fromToContainer.classList.add('is-calculating');
    if (fromToProgress)  fromToProgress.classList.add('active');
    if (btnProgress)     btnProgress.classList.add('active');
    if (optBtn) {
        optBtn.disabled = true;
        optBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span> Calculating Distance & Rates...`;
    }

    const resultsEl = document.getElementById('results-container');
    if (resultsEl) {
        resultsEl.innerHTML = `
            <div class="text-center py-4 animate-fade-in">
                <div class="spinner-border text-primary mb-3" role="status" style="width: 2.2rem; height: 2.2rem;"></div>
                <div class="fw-bold text-dark fs-5 mb-1">Calculating Highway Distance & Fuel Prices...</div>
                <small class="text-muted">Fetching OpenStreetMap routing for <strong>${originCity.name} ➔ ${destCity.name}</strong></small>
            </div>`;
    }

    renderMapWaypoints(activeStops);

    const coordsStr = activeStops.map(s => `${s.lng},${s.lat}`).join(';');
    const osrmUrl   = `https://router.project-osrm.org/trip/v1/driving/${coordsStr}?source=first&roundtrip=false&geometries=geojson&overview=full`;

    try {
        let distanceKm = 0, durationMinutes = 0;
        let orderedStops = [...activeStops];

        const res  = await fetch(osrmUrl);
        const data = await res.json();

        if (data.code === 'Ok' && data.trips?.length > 0) {
            distanceKm      = data.trips[0].distance / 1000;
            durationMinutes = Math.round(data.trips[0].duration / 60);

            if (routeLayer) map.removeLayer(routeLayer);
            routeLayer = L.geoJSON(data.trips[0].geometry, { style: { color: '#2563eb', weight: 6, opacity: 0.9 } }).addTo(map);
            routeLayer.bindTooltip(`🚗 <strong>${originCity.name} ➔ ${destCity.name}</strong><br>Distance: <strong>${distanceKm.toFixed(1)} km</strong>`, { sticky: true, className: 'route-polyline-tooltip' });
            map.fitBounds(routeLayer.getBounds(), { padding: [40, 40] });

            if (data.waypoints?.length === activeStops.length) {
                orderedStops = data.waypoints.map(wp => activeStops[wp.waypoint_index]);
            }
        } else {
            distanceKm      = calculateHaversineTotal(activeStops) * 1.25;
            durationMinutes = Math.round((distanceKm / 55) * 60);
        }

        // Update map banner
        const banner = document.getElementById('map-distance-banner');
        if (banner) {
            banner.style.display = 'flex';
            document.getElementById('map-route-title').innerHTML = `<i class="fas fa-map-marker-alt text-danger me-1"></i> ${originCity.name} ➔ ${destCity.name}`;
            document.getElementById('map-dist-val').textContent  = `${distanceKm.toFixed(1)} km`;
        }

        // Fix #1 — use prices from the user's selected city, not hardcoded Delhi defaults
        const citySelectVal  = document.getElementById('city-rate-sync-select')?.value;
        const selectedCity   = (citySelectVal && citySelectVal !== 'custom')
            ? CITY_FUEL_RATES.find(c => c.city.toLowerCase().includes(citySelectVal.toLowerCase()))
            : null;
        const selCityName    = selectedCity ? selectedCity.city : 'Reference (Delhi)';

        const petrolPrice = selectedCity ? selectedCity.petrol : FUEL_DEFAULTS.petrol.price;
        const dieselPrice = selectedCity ? selectedCity.diesel : FUEL_DEFAULTS.diesel.price;
        const cngPrice    = selectedCity ? selectedCity.cng    : FUEL_DEFAULTS.cng.price;

        const petrolAmountL  = distanceKm / FUEL_DEFAULTS.petrol.efficiency;
        const dieselAmountL  = distanceKm / FUEL_DEFAULTS.diesel.efficiency;
        const cngAmountKg    = distanceKm / FUEL_DEFAULTS.cng.efficiency;

        const petrolTotalCost = petrolAmountL * petrolPrice;
        const dieselTotalCost = dieselAmountL * dieselPrice;
        const cngTotalCost    = cngAmountKg   * cngPrice;

        const userEff      = parseFloat(document.getElementById('fuel-efficiency')?.value) || FUEL_DEFAULTS.cng.efficiency;
        const userPrice    = parseFloat(document.getElementById('fuel-price')?.value)      || cngPrice;
        const userTripCost = (distanceKm / userEff) * userPrice;

        // Fix #4 — Compare All: apply user efficiency to all fuel types
        const isCompareMode  = currentFuelType === 'compare';
        const userPetrolCost = isCompareMode ? (distanceKm / userEff) * petrolPrice : null;
        const userDieselCost = isCompareMode ? (distanceKm / userEff) * dieselPrice : null;
        const userCngCost    = isCompareMode ? (distanceKm / userEff) * cngPrice    : null;

        const cngSavings    = petrolTotalCost - cngTotalCost;
        const cngSavingsPct = ((cngSavings / petrolTotalCost) * 100).toFixed(1);
        const hours = Math.floor(durationMinutes / 60), mins = durationMinutes % 60;
        const durationText  = hours > 0 ? `${hours}h ${mins}m` : `${mins} mins`;

        currentTripResult = {
            origin: originCity.name, destination: destCity.name,
            distanceKm, durationText, orderedStops,
            petrolAmountL, petrolPricePerL: petrolPrice, petrolTotalCost,
            dieselAmountL, dieselPricePerL: dieselPrice, dieselTotalCost,
            cngAmountKg, cngPricePerKg: cngPrice, cngTotalCost,
            userTripCost, userEff, userPrice,
            isCompareMode, userPetrolCost, userDieselCost, userCngCost,
            selectedCityName: selCityName,
            date: new Date().toLocaleDateString()
        };

        renderDetailedResults(currentTripResult, cngSavings, cngSavingsPct);
        showToast(`RouteWise Distance: ${distanceKm.toFixed(1)} km calculated!`, 'success');

    } catch (err) {
        console.error('Routing error:', err);
        const fallbackDist = calculateHaversineTotal(activeStops) * 1.25;
        const fallbackCost = (fallbackDist / 25) * 75;
        if (resultsEl) resultsEl.innerHTML = `<div class="alert alert-warning"><i class="fas fa-exclamation-triangle me-2"></i><strong>Estimated Road Distance:</strong> ${fallbackDist.toFixed(1)} km. Estimated CNG Fuel Cost: <strong>₹${fallbackCost.toFixed(2)}</strong>.</div>`;
    } finally {
        if (fromToContainer) fromToContainer.classList.remove('is-calculating');
        if (fromToProgress)  fromToProgress.classList.remove('active');
        if (btnProgress)     btnProgress.classList.remove('active');
        if (optBtn) {
            optBtn.disabled = false;
            optBtn.innerHTML = `<i class="fas fa-bolt me-2"></i> Calculate Distance & Fuel Prices`;
        }
    }
}

// ── Map Waypoint Rendering ────────────────────────────────────────
function renderMapWaypoints(stopsList) {
    if (!map) return;
    markers.forEach(m => map.removeLayer(m));
    markers = [];
    if (routeLayer) map.removeLayer(routeLayer);

    const bounds = L.latLngBounds();
    stopsList.forEach((stop, idx) => {
        let pinColor = '#64748b', pinIcon = idx + 1, label = `Via Stop #${idx}`;
        if (stop.type === 'origin')      { pinColor = '#2563eb'; pinIcon = '<i class="fas fa-play" style="font-size:10px;margin-left:2px;"></i>'; label = 'From (Origin)'; }
        if (stop.type === 'destination') { pinColor = '#10b981'; pinIcon = '<i class="fas fa-flag-checkered" style="font-size:10px;"></i>';          label = 'To (Destination)'; }

        const icon   = L.divIcon({ className: 'custom-leaflet-pin', html: `<div style="background-color:${pinColor};width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:11px;box-shadow:0 4px 10px rgba(0,0,0,0.35);border:2.5px solid white;">${pinIcon}</div>`, iconSize: [30, 30], iconAnchor: [15, 15] });
        const marker = L.marker([stop.lat, stop.lng], { icon }).addTo(map).bindPopup(`<strong>${stop.name}</strong><br><small class="text-muted">${label}</small>`);
        markers.push(marker);
        bounds.extend([stop.lat, stop.lng]);
    });
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
}

// ── Results Renderer ──────────────────────────────────────────────
function renderDetailedResults(res, cngSavings, cngSavingsPct) {
    const el = document.getElementById('results-container');
    if (!el) return;

    const stopsHtml = res.orderedStops.map((s, idx) =>
        `<span class="badge ${s.type === 'origin' ? 'bg-primary' : s.type === 'destination' ? 'bg-success' : 'bg-light text-dark border'} me-1 mb-1">${idx + 1}. ${s.name}</span>`
    ).join(' <i class="fas fa-arrow-right text-muted small me-1"></i> ');

    // Fix #4 — Compare All: build extra user-efficiency comparison section
    const compareSection = res.isCompareMode ? `
        <div class="mt-3 p-3 rounded-3 border border-primary" style="background:rgba(37,99,235,0.06);">
            <div class="fw-bold text-primary small mb-2">
                <i class="fas fa-layer-group me-1"></i>Your Vehicle Comparison &mdash; ${res.userEff} km/unit at your rates
            </div>
            <div class="row g-2">
                <div class="col-4">
                    <div class="text-center p-2 rounded border border-warning" style="background:rgba(245,158,11,0.08);">
                        <small class="fw-bold d-block" style="color:#b45309;">⛽ Petrol</small>
                        <div class="fw-bold">₹${res.userPetrolCost.toFixed(2)}</div>
                        <small class="text-muted">₹${(res.userPetrolCost/res.distanceKm).toFixed(2)}/km</small>
                    </div>
                </div>
                <div class="col-4">
                    <div class="text-center p-2 rounded border border-info" style="background:rgba(2,132,199,0.08);">
                        <small class="fw-bold d-block" style="color:#0369a1;">🚛 Diesel</small>
                        <div class="fw-bold">₹${res.userDieselCost.toFixed(2)}</div>
                        <small class="text-muted">₹${(res.userDieselCost/res.distanceKm).toFixed(2)}/km</small>
                    </div>
                </div>
                <div class="col-4">
                    <div class="text-center p-2 rounded border border-success" style="background:rgba(16,185,129,0.08);">
                        <small class="fw-bold text-success d-block">🍃 CNG ⭐</small>
                        <div class="fw-bold text-success">₹${res.userCngCost.toFixed(2)}</div>
                        <small class="text-muted">₹${(res.userCngCost/res.distanceKm).toFixed(2)}/km</small>
                    </div>
                </div>
            </div>
        </div>` : '';

    el.innerHTML = `
        <div class="animate-fade-in">
            <div class="route-distance-hero-box">
                <div>
                    <span class="badge bg-primary text-white rounded-pill px-2 py-1 mb-1" style="font-size:0.72rem;">ROAD DISTANCE</span>
                    <div class="route-distance-hero-title"><i class="fas fa-map-marker-alt text-danger"></i><span>${res.origin} ➔ ${res.destination}</span></div>
                    <small class="text-light opacity-75">Estimated Highway Drive Time: <strong>${res.durationText}</strong></small>
                </div>
                <div class="route-distance-hero-stat">
                    <div class="route-distance-large-num">${res.distanceKm.toFixed(1)} <span class="fs-6 fw-normal text-light">km</span></div>
                    <small class="text-light opacity-75">Total Road Distance</small>
                </div>
            </div>

            <div class="p-2 bg-light rounded border mb-3 small">
                <div class="text-muted fw-bold mb-1"><i class="fas fa-directions text-primary me-1"></i>Optimized Waypoint Sequence:</div>
                <div class="d-flex flex-wrap align-items-center">${stopsHtml}</div>
            </div>

            <div class="d-flex justify-content-between align-items-center mb-2">
                <div class="fw-bold text-dark small"><i class="fas fa-gas-pump text-primary me-1"></i>Fuel Amount, Unit Price &amp; Total Trip Cost:</div>
                <span class="badge bg-light text-muted border" style="font-size:0.7rem;"><i class="fas fa-map-pin me-1"></i>${res.selectedCityName} Rates</span>
            </div>
            <div class="fuel-comp-grid">
                <div class="fuel-card petrol">
                    <div><div class="fuel-card-title"><i class="fas fa-gas-pump"></i> Petrol</div><div class="fuel-card-cost">₹${res.petrolTotalCost.toFixed(2)}</div></div>
                    <div class="fuel-card-details-box">
                        <div class="fuel-card-row"><span>Amount Needed:</span><strong>${res.petrolAmountL.toFixed(1)} Litres</strong></div>
                        <div class="fuel-card-row"><span>Unit Rate:</span><span>₹${res.petrolPricePerL.toFixed(2)} / L</span></div>
                        <div class="fuel-card-row"><span>Running Cost:</span><span>₹${(res.petrolTotalCost/res.distanceKm).toFixed(2)} / km</span></div>
                        <div class="fuel-card-row"><span>Efficiency:</span><span>${FUEL_DEFAULTS.petrol.efficiency} km/L</span></div>
                    </div>
                </div>
                <div class="fuel-card diesel">
                    <div><div class="fuel-card-title"><i class="fas fa-truck"></i> Diesel</div><div class="fuel-card-cost">₹${res.dieselTotalCost.toFixed(2)}</div></div>
                    <div class="fuel-card-details-box">
                        <div class="fuel-card-row"><span>Amount Needed:</span><strong>${res.dieselAmountL.toFixed(1)} Litres</strong></div>
                        <div class="fuel-card-row"><span>Unit Rate:</span><span>₹${res.dieselPricePerL.toFixed(2)} / L</span></div>
                        <div class="fuel-card-row"><span>Running Cost:</span><span>₹${(res.dieselTotalCost/res.distanceKm).toFixed(2)} / km</span></div>
                        <div class="fuel-card-row"><span>Efficiency:</span><span>${FUEL_DEFAULTS.diesel.efficiency} km/L</span></div>
                    </div>
                </div>
                <div class="fuel-card cng">
                    <span class="fuel-best-badge">BEST VALUE</span>
                    <div><div class="fuel-card-title"><i class="fas fa-leaf"></i> CNG</div><div class="fuel-card-cost">₹${res.cngTotalCost.toFixed(2)}</div></div>
                    <div class="fuel-card-details-box">
                        <div class="fuel-card-row"><span>Amount Needed:</span><strong class="text-success">${res.cngAmountKg.toFixed(1)} kg</strong></div>
                        <div class="fuel-card-row"><span>Unit Rate:</span><span>₹${res.cngPricePerKg.toFixed(2)} / kg</span></div>
                        <div class="fuel-card-row"><span>Running Cost:</span><span class="text-success fw-bold">₹${(res.cngTotalCost/res.distanceKm).toFixed(2)} / km</span></div>
                        <div class="fuel-card-row"><span>Efficiency:</span><span>${FUEL_DEFAULTS.cng.efficiency} km/kg</span></div>
                    </div>
                </div>
            </div>
            <div class="savings-banner">
                <div class="savings-banner-text"><i class="fas fa-leaf me-1 text-warning"></i><strong>CNG Green Savings:</strong> Save <span class="fw-bold text-white">₹${cngSavings.toFixed(2)}</span> (${cngSavingsPct}%) vs Petrol on this ${res.distanceKm.toFixed(0)} km journey!</div>
                <div class="savings-banner-amount">Save Budget</div>
            </div>
            ${compareSection}
        </div>`;
}

// ── Haversine Math ───────────────────────────────────────────────
function calculateHaversineTotal(stops) {
    let total = 0;
    for (let i = 0; i < stops.length - 1; i++) total += haversineDistance(stops[i].lat, stops[i].lng, stops[i+1].lat, stops[i+1].lng);
    return total;
}
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371, dLat = (lat2-lat1)*Math.PI/180, dLon = (lon2-lon1)*Math.PI/180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ── Map Control Buttons ───────────────────────────────────────────
document.getElementById('btn-fit-map')?.addEventListener('click', () => { if (map && markers.length) map.fitBounds(L.latLngBounds(markers.map(m => m.getLatLng())), { padding: [40, 40] }); });

// Fix #7 — Reverse route now auto-recalculates
document.getElementById('btn-reverse-route')?.addEventListener('click', () => {
    const o = document.getElementById('origin-city-input');
    const d = document.getElementById('dest-city-input');
    if (o && d && o.value && d.value) {
        [o.value, d.value] = [d.value, o.value];
        showToast('Route reversed! Recalculating...', 'info');
        runRouteOptimization();
    } else {
        showToast('Enter origin and destination cities first.', 'warning');
    }
});
