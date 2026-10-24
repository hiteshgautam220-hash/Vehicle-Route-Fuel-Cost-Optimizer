/**
 * RouteWise — fuel.js
 * Fuel comparison simulator, city rates table, commute calculator,
 * apply-city-rates action.
 * Depends on: config.js, utils.js
 */

// Fix #8 — debounce helper to prevent heavy slider redraws on every pixel
function debounce(fn, delay = 120) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

const debouncedSimUpdate = debounce(updateFuelSimulator, 120);

// ── Fuel Simulator (View 2) ───────────────────────────────────────
function updateFuelSimulator() {
    const simRange = document.getElementById('calc-dist-range');
    if (!simRange) return;

    const distance   = parseFloat(simRange.value) || 500;
    const distVal    = document.getElementById('calc-dist-val');
    const distDisplay = document.getElementById('sim-distance-display');
    if (distVal)     distVal.textContent    = distance;
    if (distDisplay) distDisplay.textContent = `${distance} km Trip`;

    const petrolEff   = parseFloat(document.getElementById('sim-petrol-eff')?.value)   || 15;
    const dieselEff   = parseFloat(document.getElementById('sim-diesel-eff')?.value)   || 20;
    const cngEff      = parseFloat(document.getElementById('sim-cng-eff')?.value)      || 25;
    const petrolPrice = parseFloat(document.getElementById('sim-petrol-price')?.value) || 94.72;
    const dieselPrice = parseFloat(document.getElementById('sim-diesel-price')?.value) || 87.62;
    const cngPrice    = parseFloat(document.getElementById('sim-cng-price')?.value)    || 75.09;

    const petrolL = distance / petrolEff, petrolTotal = petrolL * petrolPrice;
    const dieselL = distance / dieselEff, dieselTotal = dieselL * dieselPrice;
    const cngKg   = distance / cngEff,   cngTotal    = cngKg   * cngPrice;

    document.getElementById('sim-petrol-cost').textContent = `₹${petrolTotal.toFixed(2)} (${petrolL.toFixed(1)} L)`;
    document.getElementById('sim-diesel-cost').textContent = `₹${dieselTotal.toFixed(2)} (${dieselL.toFixed(1)} L)`;
    document.getElementById('sim-cng-cost').textContent    = `₹${cngTotal.toFixed(2)} (${cngKg.toFixed(1)} kg)`;

    const dieselBar = document.getElementById('sim-diesel-bar');
    const cngBar    = document.getElementById('sim-cng-bar');
    if (dieselBar) dieselBar.style.width = `${Math.min(100, (dieselTotal / petrolTotal) * 100)}%`;
    if (cngBar)    cngBar.style.width    = `${Math.min(100, (cngTotal    / petrolTotal) * 100)}%`;

    const savings    = petrolTotal - cngTotal;
    const savingsPct = ((savings / petrolTotal) * 100).toFixed(1);
    document.getElementById('sim-savings-amount').textContent = `Save ₹${savings.toFixed(2)}`;
    document.getElementById('sim-savings-pct').textContent    = `${savingsPct}%`;

    updateCommuteCalculator(petrolTotal / distance, cngTotal / distance);
}

function updateCommuteCalculator(petrolPerKm, cngPerKm) {
    const dailyKm   = parseFloat(document.getElementById('commute-daily-km')?.value)   || 40;
    const daysMonth = parseFloat(document.getElementById('commute-days-month')?.value) || 24;
    const monthlyKm     = dailyKm * daysMonth;
    const monthlySave   = monthlyKm * ((petrolPerKm || 6.31) - (cngPerKm || 3.00));
    const annualSave    = monthlySave * 12;
    const mSaveEl = document.getElementById('commute-monthly-save');
    const aSaveEl = document.getElementById('commute-annual-save');
    if (mSaveEl) mSaveEl.textContent = `₹${Math.round(monthlySave).toLocaleString('en-IN')} / month`;
    if (aSaveEl) aSaveEl.textContent = `₹${Math.round(annualSave).toLocaleString('en-IN')} / year`;
}

// Wire simulator input events (all debounced)
document.getElementById('calc-dist-range')?.addEventListener('input', debouncedSimUpdate);
['sim-petrol-eff','sim-diesel-eff','sim-cng-eff','sim-petrol-price','sim-diesel-price','sim-cng-price','commute-daily-km','commute-days-month'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', debouncedSimUpdate);
});

// ── City Fuel Rates Horizontal Slider (View 3) ──────────────────
let ratesSliderDrag = { active: false, startX: 0, scrollLeft: 0 };

function renderFuelRatesCards(filterText = '') {
    const grid = document.getElementById('fuel-rates-grid');
    const tbody = document.getElementById('fuel-rates-tbody');
    if (!grid) return;

    const filtered = CITY_FUEL_RATES.filter(item =>
        item.city.toLowerCase().includes(filterText.toLowerCase()) ||
        item.state.toLowerCase().includes(filterText.toLowerCase())
    );

    // Update visible count
    const countEl = document.getElementById('rates-visible-count');
    if (countEl) countEl.textContent = filtered.length;

    // Populate insight strip (always from full data)
    if (!filterText) populateInsightStrip();

    // Animate existing cards out before replacing
    const existingCards = grid.querySelectorAll('.fuel-rate-card');
    if (existingCards.length > 0 && filterText !== undefined) {
        existingCards.forEach(card => card.classList.add('card-exit'));
        setTimeout(() => _renderSliderCards(grid, filtered, filterText), 280);
    } else {
        _renderSliderCards(grid, filtered, filterText);
    }

    // Legacy table
    if (tbody) {
        tbody.innerHTML = '';
        filtered.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${row.city}</strong><br><small class="text-muted">${row.state}</small></td>
                <td><span class="badge bg-warning text-dark">₹${row.petrol.toFixed(2)}/L</span></td>
                <td><span class="badge bg-info text-white">₹${row.diesel.toFixed(2)}/L</span></td>
                <td><span class="badge bg-success text-white">₹${row.cng.toFixed(2)}/kg</span></td>
                <td><span class="badge bg-light text-muted border">${row.trend}</span></td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary" onclick="applyCityRates('${row.city}')">
                        <i class="fas fa-check me-1"></i> Apply to Route
                    </button>
                </td>`;
            tbody.appendChild(tr);
        });
    }
}

function _renderSliderCards(grid, filtered, filterText) {
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="rates-empty-state">
                <i class="fas fa-search"></i>
                <p>No cities matched "<strong>${filterText}</strong>". Try a different search.</p>
            </div>`;
        updateScrollIndicator();
        return;
    }

    const maxPrice = Math.max(...CITY_FUEL_RATES.map(r => Math.max(r.petrol, r.diesel, r.cng)));

    grid.innerHTML = '';
    filtered.forEach((row, idx) => {
        const trendClass = row.trend.toLowerCase().includes('up') ? 'trend-up' : 'trend-stable';
        const trendIcon = row.trend.toLowerCase().includes('up') ? 'fa-arrow-up' : 'fa-check';
        const initials = row.city.substring(0, 2).toUpperCase();
        const petrolW = ((row.petrol / maxPrice) * 100).toFixed(1);
        const dieselW = ((row.diesel / maxPrice) * 100).toFixed(1);
        const cngW    = ((row.cng    / maxPrice) * 100).toFixed(1);

        const card = document.createElement('div');
        card.className = 'fuel-rate-card';
        card.style.animationDelay = `${idx * 0.07}s`;
        card.innerHTML = `
            <div class="frc-accent"></div>
            <div class="frc-body">
                <div class="frc-city-row">
                    <div class="frc-city-info">
                        <div class="frc-city-avatar">${initials}</div>
                        <div>
                            <div class="frc-city-name">${row.city}</div>
                            <div class="frc-city-state">${row.state}</div>
                        </div>
                    </div>
                    <span class="frc-trend-badge ${trendClass}">
                        <i class="fas ${trendIcon}"></i> ${row.trend}
                    </span>
                </div>
                <div class="frc-fuel-rows">
                    <div class="frc-fuel-item">
                        <div class="frc-fuel-dot dot-petrol"></div>
                        <div class="frc-fuel-name">Petrol</div>
                        <div class="frc-fuel-bar-wrap">
                            <div class="frc-fuel-bar bar-petrol" style="width: ${petrolW}%"></div>
                        </div>
                        <div class="frc-fuel-price">₹${row.petrol.toFixed(2)}/L</div>
                    </div>
                    <div class="frc-fuel-item">
                        <div class="frc-fuel-dot dot-diesel"></div>
                        <div class="frc-fuel-name">Diesel</div>
                        <div class="frc-fuel-bar-wrap">
                            <div class="frc-fuel-bar bar-diesel" style="width: ${dieselW}%"></div>
                        </div>
                        <div class="frc-fuel-price">₹${row.diesel.toFixed(2)}/L</div>
                    </div>
                    <div class="frc-fuel-item">
                        <div class="frc-fuel-dot dot-cng"></div>
                        <div class="frc-fuel-name">CNG</div>
                        <div class="frc-fuel-bar-wrap">
                            <div class="frc-fuel-bar bar-cng" style="width: ${cngW}%"></div>
                        </div>
                        <div class="frc-fuel-price">₹${row.cng.toFixed(2)}/kg</div>
                    </div>
                </div>
            </div>
            <button class="frc-apply-btn" onclick="applyCityRates('${row.city}')">
                <i class="fas fa-bolt"></i> Apply ${row.city} Rates to Planner
            </button>`;
        grid.appendChild(card);
    });

    // Scroll back to start on search
    grid.scrollLeft = 0;
    updateScrollIndicator();
    updateSliderArrows();
}

// ── Scroll Indicator ─────────────────────────────────────────────
function updateScrollIndicator() {
    const grid = document.getElementById('fuel-rates-grid');
    const thumb = document.getElementById('rates-scroll-thumb');
    if (!grid || !thumb) return;

    const scrollW = grid.scrollWidth;
    const clientW = grid.clientWidth;
    if (scrollW <= clientW) {
        thumb.style.width = '100%';
        thumb.style.left = '0%';
        return;
    }
    const thumbW = Math.max(15, (clientW / scrollW) * 100);
    const thumbL = (grid.scrollLeft / (scrollW - clientW)) * (100 - thumbW);
    thumb.style.width = `${thumbW}%`;
    thumb.style.left = `${thumbL}%`;
}

// ── Arrow Visibility ─────────────────────────────────────────────
function updateSliderArrows() {
    const grid = document.getElementById('fuel-rates-grid');
    const leftArr = document.getElementById('rates-arrow-left');
    const rightArr = document.getElementById('rates-arrow-right');
    if (!grid || !leftArr || !rightArr) return;

    leftArr.classList.toggle('arrow-hidden', grid.scrollLeft <= 5);
    rightArr.classList.toggle('arrow-hidden', grid.scrollLeft >= grid.scrollWidth - grid.clientWidth - 5);
}

// ── Insight Strip ────────────────────────────────────────────────
function populateInsightStrip() {
    const rates = CITY_FUEL_RATES;
    if (!rates.length) return;

    const cheapestPetrol = rates.reduce((a, b) => a.petrol < b.petrol ? a : b);
    const cheapestDiesel = rates.reduce((a, b) => a.diesel < b.diesel ? a : b);
    const cheapestCng    = rates.reduce((a, b) => a.cng    < b.cng    ? a : b);
    const costliest      = rates.reduce((a, b) => (a.petrol + a.diesel) > (b.petrol + b.diesel) ? a : b);

    const cpEl = document.getElementById('insight-cheapest-petrol');
    const cdEl = document.getElementById('insight-cheapest-diesel');
    const ccEl = document.getElementById('insight-cheapest-cng');
    const coEl = document.getElementById('insight-costliest-city');

    if (cpEl) cpEl.textContent = `${cheapestPetrol.city} · ₹${cheapestPetrol.petrol.toFixed(2)}`;
    if (cdEl) cdEl.textContent = `${cheapestDiesel.city} · ₹${cheapestDiesel.diesel.toFixed(2)}`;
    if (ccEl) ccEl.textContent = `${cheapestCng.city} · ₹${cheapestCng.cng.toFixed(2)}`;
    if (coEl) coEl.textContent = `${costliest.city} · ₹${costliest.petrol.toFixed(2)}`;
}

// Alias for backward compatibility
function renderFuelRatesTable(filterText = '') {
    renderFuelRatesCards(filterText);
}

// ── Wire Search, Arrows, Drag, Scroll Events ────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('fuel-rates-grid');
    const filterInput = document.getElementById('filter-rates-input');
    const leftArr = document.getElementById('rates-arrow-left');
    const rightArr = document.getElementById('rates-arrow-right');

    // Search filter with debounce
    if (filterInput) {
        let searchTimer;
        filterInput.addEventListener('input', (e) => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => renderFuelRatesCards(e.target.value), 200);
        });
    }

    // Arrow navigation
    const SCROLL_AMOUNT = 358; // card width + gap
    if (leftArr) {
        leftArr.addEventListener('click', () => {
            if (grid) grid.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' });
        });
    }
    if (rightArr) {
        rightArr.addEventListener('click', () => {
            if (grid) grid.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' });
        });
    }

    // Scroll event → update indicator + arrows
    if (grid) {
        grid.addEventListener('scroll', () => {
            updateScrollIndicator();
            updateSliderArrows();
        });

        // Drag to scroll (mouse)
        grid.addEventListener('mousedown', (e) => {
            ratesSliderDrag.active = true;
            ratesSliderDrag.startX = e.pageX - grid.offsetLeft;
            ratesSliderDrag.scrollLeft = grid.scrollLeft;
            grid.style.scrollBehavior = 'auto';
        });
        grid.addEventListener('mousemove', (e) => {
            if (!ratesSliderDrag.active) return;
            e.preventDefault();
            const x = e.pageX - grid.offsetLeft;
            const walk = (x - ratesSliderDrag.startX) * 1.5;
            grid.scrollLeft = ratesSliderDrag.scrollLeft - walk;
        });
        grid.addEventListener('mouseup', () => {
            ratesSliderDrag.active = false;
            grid.style.scrollBehavior = 'smooth';
        });
        grid.addEventListener('mouseleave', () => {
            ratesSliderDrag.active = false;
            grid.style.scrollBehavior = 'smooth';
        });
    }
});

window.applyCityRates = (cityName) => {
    const cityObj = CITY_FUEL_RATES.find(c => c.city.toLowerCase() === cityName.toLowerCase());
    if (!cityObj) return;
    let price = currentFuelType === 'petrol' ? cityObj.petrol : currentFuelType === 'diesel' ? cityObj.diesel : cityObj.cng;
    const priceInput = document.getElementById('fuel-price');
    const syncSelect = document.getElementById('city-rate-sync-select');
    if (priceInput) priceInput.value = price;
    if (syncSelect) syncSelect.value = 'custom';
    switchTab('optimizer');
    showToast(`Loaded ${cityObj.city} fuel prices (₹${price}) to Planner!`, 'success');
};

// ── Sync Fuel Rates from Express REST API ─────────────────────────
async function syncFuelRatesFromAPI() {
    try {
        if (window.RouteWiseAPI) {
            const res = await RouteWiseAPI.fuelRates.getAll();
            if (res.success && Array.isArray(res.rates) && res.rates.length > 0) {
                CITY_FUEL_RATES.length = 0;
                res.rates.forEach(r => CITY_FUEL_RATES.push(r));
                renderFuelRatesCards();
            }
        }
    } catch (e) {
        // Fallback to static reference rates
    }
}
window.syncFuelRatesFromAPI = syncFuelRatesFromAPI;

// ── Contact Form & Interactive Features ───────────────────────────
window.selectContactTopic = function (topic, btnEl) {
    const subjectInput = document.getElementById('contact-subject');
    if (subjectInput) subjectInput.value = topic;

    const allChips = document.querySelectorAll('#contact-topic-chips .topic-chip');
    allChips.forEach(chip => chip.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');
};

window.copySupportEmail = function (btn) {
    const email = 'support@routewise.in';
    navigator.clipboard?.writeText(email).then(() => {
        if (btn) {
            btn.innerHTML = `<i class="fas fa-check text-success"></i>`;
            setTimeout(() => { btn.innerHTML = `<i class="fas fa-copy"></i>`; }, 2000);
        }
        showToast('Email address (support@routewise.in) copied to clipboard!', 'success');
    }).catch(() => {
        showToast('support@routewise.in', 'info');
    });
};

document.getElementById('contact-message')?.addEventListener('input', function (e) {
    const counter = document.getElementById('contact-char-count');
    if (counter) {
        counter.textContent = `${e.target.value.length} / 500`;
    }
});

document.getElementById('contact-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-contact');
    const name = document.getElementById('contact-name')?.value.trim();
    const email = document.getElementById('contact-email')?.value.trim();
    const subject = document.getElementById('contact-subject')?.value.trim();
    const message = document.getElementById('contact-message')?.value.trim();
    const activeChip = document.querySelector('#contact-topic-chips .topic-chip.active');
    const topic = activeChip ? activeChip.textContent.trim() : '✨ Feature Suggestion';

    if (btn) {
        btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Submitting to Server...`;
        btn.disabled = true;
    }

    try {
        if (window.RouteWiseAPI) {
            const res = await RouteWiseAPI.feedback.submit({ name, email, subject, topic, message });
            showToast(`Message received! Feedback Reference: #${String(res.feedbackId).slice(-6)}`, 'success');
        } else {
            showToast('Thank you! Your message has been recorded.', 'success');
        }
        if (btn) {
            btn.innerHTML = `<i class="fas fa-check me-1"></i> Message Sent!`;
            btn.classList.replace('btn-primary-custom', 'btn-success-custom');
        }
        document.getElementById('contact-form')?.reset();
        const charCount = document.getElementById('contact-char-count');
        if (charCount) charCount.textContent = '0 / 500';
        setTimeout(() => {
            if (btn) {
                btn.innerHTML = `<i class="fas fa-paper-plane me-1"></i> Send Message`;
                btn.classList.replace('btn-success-custom', 'btn-primary-custom');
                btn.disabled = false;
            }
        }, 3000);
    } catch (err) {
        showToast(err.message || 'Failed to submit feedback.', 'error');
        if (btn) {
            btn.innerHTML = `<i class="fas fa-paper-plane me-1"></i> Send Message`;
            btn.disabled = false;
        }
    }
});


