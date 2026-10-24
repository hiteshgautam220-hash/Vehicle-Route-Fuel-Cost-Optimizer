/**
 * RouteWise — app.js
 * Application bootstrap: loads city data, syncs fuel rates from backend REST API,
 * checks server health, renders initial state, and initiates session restoration.
 * Depends on: api.js, config.js, utils.js, auth.js, cities.js, fuel.js, saved-routes.js
 */

async function initApp() {
    // 1. Check live backend health & update status indicator
    if (typeof checkBackendHealth === 'function') {
        checkBackendHealth();
    }

    // 2. Load Indian cities GIS dataset
    await loadCityData();

    // 3. Sync live city fuel rates from Express REST API
    if (typeof syncFuelRatesFromAPI === 'function') {
        await syncFuelRatesFromAPI();
    }

    // 4. Populate static & interactive views
    if (typeof renderFuelRatesCards === 'function') {
        renderFuelRatesCards();
    }
    if (typeof updateFuelSimulator === 'function') {
        updateFuelSimulator();
    }

    // 5. Trigger initial car drive-in loading screen & session restoration
    const storedUser = typeof getStoredSessionUser === 'function' ? getStoredSessionUser() : null;
    if (typeof triggerInitialLoadingSequence === 'function') {
        triggerInitialLoadingSequence(storedUser);
    } else {
        if (storedUser) {
            currentUser = storedUser;
            unlockApplication();
        } else {
            enterGuestMode();
        }
    }
}

initApp();
