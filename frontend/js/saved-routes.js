/**
 * RouteWise — saved-routes.js
 * Trip Bookmarks & Itineraries connected to MongoDB via Express REST API.
 * Features:
 * - Persistent CRUD via GET /api/trips, POST /api/trips, DELETE /api/trips/:id
 * - Guest mode protection with account prompt
 * - One-click load itinerary back into map & optimizer
 * Depends on: api.js, utils.js, map.js
 */

let pendingTripToSave = null;
let savedRoutes = [];

// ── Refresh Saved Routes from Backend REST API ────────────────────
window.refreshSavedRoutesForCurrentUser = async () => {
    if (!currentUser) {
        savedRoutes = [];
        updateSavedCountBadge();
        return;
    }

    try {
        const res = await RouteWiseAPI.trips.getAll({ limit: 50 });
        if (res.success && Array.isArray(res.trips)) {
            savedRoutes = res.trips;
        } else {
            savedRoutes = [];
        }
    } catch (err) {
        console.warn('[SavedRoutes] Failed to fetch trips from API:', err.message);
        // Fallback to local storage if API is unreachable
        try {
            const fallbackKey = `routeWiseSavedRoutes:${currentUser.email}`;
            savedRoutes = JSON.parse(localStorage.getItem(fallbackKey)) || [];
        } catch (e) {
            savedRoutes = [];
        }
    }

    updateSavedCountBadge();
};

// ── Badge Counter ─────────────────────────────────────────────────
function updateSavedCountBadge() {
    const badge = document.getElementById('saved-count-badge');
    const badgeMenu = document.getElementById('saved-count-badge-menu');
    if (badge) badge.textContent = savedRoutes.length;
    if (badgeMenu) badgeMenu.textContent = savedRoutes.length;
}

// ── Save Current Trip via Backend REST API ────────────────────────
async function saveTripData(tripObj) {
    if (!tripObj) return;

    try {
        showToast('Saving trip to your account in MongoDB...', 'info');

        const payload = {
            title: tripObj.title,
            origin: tripObj.origin,
            destination: tripObj.destination,
            stops: tripObj.stops || [],
            distanceKm: tripObj.distance,
            durationMinutes: tripObj.durationMinutes || 0,
            fuelType: tripObj.fuelType || 'cng',
            fuelEfficiency: tripObj.fuelEff || 25,
            fuelPrice: tripObj.fuelPrice || 75.09,
            totalCost: tripObj.cost,
            fuelQuantity: tripObj.fuelQuantity || 0,
            co2EmissionsKg: tripObj.co2EmissionsKg || 0,
            cityName: tripObj.cityName || 'Reference',
            comparison: tripObj.comparison || {}
        };

        const res = await RouteWiseAPI.trips.create(payload);

        if (res.success && res.trip) {
            savedRoutes.unshift(res.trip);
            updateSavedCountBadge();
            showToast(`Saved trip "${res.trip.title}" to your account!`, 'success');
        }
    } catch (err) {
        showToast(err.message || 'Failed to save trip to server.', 'error');
    }
}

// ── Process Pending Trip Saved from Guest Prompt ──────────────────
window.processPendingTripSave = () => {
    if (pendingTripToSave && currentUser) {
        saveTripData(pendingTripToSave);
        pendingTripToSave = null;
    }
};

// ── Save Current Trip Button Listener ─────────────────────────────
document.getElementById('btn-save-current-route')?.addEventListener('click', () => {
    if (!currentTripResult) { 
        showToast('Please calculate a route first before saving.', 'warning'); 
        return; 
    }

    const orderedStops = currentTripResult.orderedStops || [];
    const originStop = orderedStops[0] || { name: 'Origin', lat: 0, lng: 0 };
    const destStop = orderedStops[orderedStops.length - 1] || { name: 'Destination', lat: 0, lng: 0 };
    const intermediateStopsList = orderedStops.slice(1, -1);

    const tripObj = {
        title: `${currentTripResult.origin} to ${currentTripResult.destination}`,
        origin: originStop,
        destination: destStop,
        stops: intermediateStopsList,
        distance: currentTripResult.distanceKm,
        durationMinutes: currentTripResult.durationMinutes || 0,
        cost: currentTripResult.userTripCost,
        fuelType: currentFuelType,
        fuelEff: parseFloat(document.getElementById('fuel-efficiency')?.value)  || 25,
        fuelPrice: parseFloat(document.getElementById('fuel-price')?.value)        || 75.09,
        cityName: currentTripResult.selectedCityName || 'Reference (Delhi)',
        comparison: currentTripResult.comparison || {}
    };

    // If currently in Guest Mode, prompt for account sign in / register
    if (!currentUser) {
        pendingTripToSave = tripObj;
        const promptModalEl = document.getElementById('guestSavePromptModal');
        if (promptModalEl) {
            new bootstrap.Modal(promptModalEl).show();
        } else {
            showToast('Saving trips requires an account. Please sign in or register.', 'warning');
            showAuthGateway('signin');
        }
        return;
    }

    // Authenticated user
    saveTripData(tripObj);
});

// ── Open Saved Trips Modal ────────────────────────────────────────
window.openSavedRoutesModal = async () => {
    const listEl = document.getElementById('saved-routes-list-modal');
    if (!listEl) return;

    if (!currentUser) {
        listEl.innerHTML = `
            <div class="text-center py-4">
                <div class="mb-3">
                    <span class="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle" style="width: 60px; height: 60px; font-size: 26px;">
                        <i class="fas fa-bookmark"></i>
                    </span>
                </div>
                <h5 class="fw-bold text-dark mb-2">Guest Mode Active</h5>
                <p class="text-muted small mb-4" style="max-width: 440px; margin: 0 auto;">
                    You are exploring in <strong>Guest Mode</strong>. Saved trips are securely stored in MongoDB under user accounts so you can access them across sessions and devices.
                </p>
                <div class="d-flex justify-content-center gap-2 flex-wrap">
                    <button class="btn btn-sm btn-primary px-3 py-2 fw-semibold" onclick="bootstrap.Modal.getInstance(document.getElementById('savedRoutesModal'))?.hide(); showAuthGateway('signin');">
                        <i class="fas fa-sign-in-alt me-1"></i> Sign In / Create Account
                    </button>
                </div>
            </div>`;
        new bootstrap.Modal(document.getElementById('savedRoutesModal')).show();
        return;
    }

    listEl.innerHTML = `
        <div class="text-center py-3 text-muted">
            <i class="fas fa-spinner fa-spin me-2"></i> Loading saved journeys from database...
        </div>`;
    new bootstrap.Modal(document.getElementById('savedRoutesModal')).show();

    // Fetch latest from API
    await refreshSavedRoutesForCurrentUser();

    if (savedRoutes.length === 0) {
        listEl.innerHTML = `
            <div class="text-center py-4 text-muted">
                <i class="fas fa-bookmark fa-2x mb-2 text-secondary opacity-50 d-block"></i>
                <h6 class="fw-bold text-dark">No Saved Trips Found</h6>
                <p class="small text-muted mb-0">Plan a journey in the Route Planner and click <strong>"Save Trip"</strong> to bookmark it to your MongoDB database!</p>
            </div>`;
        return;
    }

    listEl.innerHTML = '';
    savedRoutes.forEach((route, i) => {
        const div = document.createElement('div');
        div.className = 'p-3 border rounded-3 mb-2 bg-light d-flex justify-content-between align-items-center flex-wrap gap-2 hover-shadow transition';
        const stopsCount = (route.stops ? route.stops.length : 0) + 2;
        const fuelUpper = (route.fuelType || 'CNG').toUpperCase();
        const costVal = route.totalCost !== undefined ? route.totalCost : route.cost;
        const distVal = route.distanceKm !== undefined ? route.distanceKm : route.distance;
        const tripDate = route.createdAt ? new Date(route.createdAt).toLocaleDateString() : (route.date || 'Recent');

        div.innerHTML = `
            <div>
                <h6 class="fw-bold mb-1 text-primary">
                    <i class="fas fa-map-marker-alt me-1"></i> ${route.title}
                </h6>
                <small class="text-muted">
                    ${stopsCount} places &bull; ${distVal.toFixed(1)} km &bull; ₹${costVal.toFixed(0)} &bull; 
                    <span class="badge bg-secondary-subtle text-dark border">${fuelUpper}</span> &bull; 
                    Saved ${tripDate}
                </small>
            </div>
            <div class="d-flex gap-2">
                <button class="btn btn-sm btn-primary" onclick="loadSavedRoute(${i})">
                    <i class="fas fa-external-link-alt me-1"></i> Load Route
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteSavedRoute('${route._id || i}', ${i})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>`;
        listEl.appendChild(div);
    });
};

document.getElementById('btn-show-saved-routes')?.addEventListener('click', openSavedRoutesModal);

// ── Load Saved Route into Planner & Map ───────────────────────────
window.loadSavedRoute = (index) => {
    const route = savedRoutes[index];
    if (!route) return;

    const originName = route.origin ? route.origin.name : (route.stops && route.stops[0] ? route.stops[0].name : 'Delhi');
    const destName = route.destination ? route.destination.name : (route.stops && route.stops[route.stops.length - 1] ? route.stops[route.stops.length - 1].name : 'Mumbai');

    const originInput = document.getElementById('origin-city-input');
    const destInput = document.getElementById('dest-city-input');
    if (originInput) originInput.value = originName;
    if (destInput) destInput.value = destName;

    intermediateStops = (route.stops && Array.isArray(route.stops))
        ? (route.origin ? [...route.stops] : route.stops.slice(1, -1))
        : [];

    renderIntermediateStops();

    if (route.fuelType) {
        const fuelBtn = document.querySelector(`.fuel-btn[data-fuel="${route.fuelType}"]`);
        if (fuelBtn) fuelBtn.click();
    }
    const eff = route.fuelEfficiency || route.fuelEff;
    if (eff) {
        const effInput = document.getElementById('fuel-efficiency');
        if (effInput) effInput.value = eff;
    }
    const price = route.fuelPrice;
    if (price) {
        const priceInput = document.getElementById('fuel-price');
        if (priceInput) priceInput.value = price;
    }

    const modalEl = document.getElementById('savedRoutesModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    switchTab('optimizer');
    setTimeout(() => {
        if (typeof runRouteOptimization === 'function') {
            runRouteOptimization();
        }
    }, 200);

    showToast(`Loaded "${route.title}" to planner!`, 'success');
};

// ── Delete Saved Trip with Confirmation ───────────────────────────
window.deleteSavedRoute = async (tripId, localIndex) => {
    const route = savedRoutes[localIndex];
    const title = route?.title || 'this trip';

    if (!confirm(`Are you sure you want to permanently delete "${title}"?`)) {
        return;
    }

    try {
        if (route && route._id && !String(route._id).startsWith('mem_')) {
            await RouteWiseAPI.trips.delete(route._id);
        }
        savedRoutes.splice(localIndex, 1);
        updateSavedCountBadge();
        openSavedRoutesModal();
        showToast('Trip removed from database.', 'info');
    } catch (err) {
        showToast(err.message || 'Failed to delete trip.', 'error');
    }
};
