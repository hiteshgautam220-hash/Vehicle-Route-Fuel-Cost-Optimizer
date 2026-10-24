/**
 * RouteWise — landing.js
 * Hero map (Leaflet instance), load sequence, interactive How-It-Works simulator,
 * Featured Route Examples showcase, scroll reveals, and full-body interactive animations.
 * Depends on: config.js (for FALLBACK_INDIAN_CITIES), map.js (for loadRoutePreset)
 */

// ── Hero Map State ──────────────────────────────────────────────────
let heroMap = null;
let heroRouteLayer = null;
let landingInitDone = false;

// ── Hardcoded route: Delhi → Jaipur → Mumbai ────────────────────────
const HERO_ROUTE_COORDS = [
    [28.6139, 77.2090],   // Delhi
    [28.19, 76.60],
    [27.50, 76.15],
    [26.9124, 75.7873],   // Jaipur
    [26.30, 75.15],
    [25.43, 74.63],
    [24.58, 74.00],
    [23.80, 73.50],
    [23.02, 72.57],       // near Ahmedabad
    [22.30, 72.80],
    [21.17, 72.83],       // Surat area
    [20.40, 73.00],
    [20.00, 72.90],
    [19.0760, 72.8777]    // Mumbai
];

const HERO_CITIES = [
    { name: 'Delhi',  lat: 28.6139, lng: 77.2090, color: '#c97700' },
    { name: 'Jaipur', lat: 26.9124, lng: 75.7873, color: '#2563eb' },
    { name: 'Mumbai', lat: 19.0760, lng: 72.8777, color: '#059669' }
];

const HERO_DISTANCE_KM = 1157;

// ── Featured Route Presets Dataset ──────────────────────────────────
const FEATURED_ROUTES = [
    {
        id: 'golden-triangle',
        title: 'Golden Triangle Heritage Circuit',
        category: 'tourism',
        categoryLabel: 'Heritage & Tourism',
        origin: 'Delhi',
        destination: 'Jaipur',
        stops: ['Agra'],
        distanceKm: 470,
        timeEst: '7.5 hrs',
        tag: 'Must Drive',
        badgeColor: '#f59e0b',
        petrolCost: 3950,
        dieselCost: 2740,
        cngCost: 1880,
        cngSave: 2070,
        description: 'Iconic North Indian circuit traversing the Taj Mahal in Agra and royal palaces in Jaipur.'
    },
    {
        id: 'western-freight',
        title: 'Western Industrial Freightway',
        category: 'freight',
        categoryLabel: 'Commercial Freight',
        origin: 'Delhi',
        destination: 'Mumbai',
        stops: ['Jaipur', 'Ahmedabad', 'Surat'],
        distanceKm: 1418,
        timeEst: '22 hrs',
        tag: 'Heavy Freight',
        badgeColor: '#38bdf8',
        petrolCost: 11940,
        dieselCost: 8290,
        cngCost: 5680,
        cngSave: 6260,
        description: 'The lifeline freight corridor connecting Delhi to Mumbai through Gujarat industrial clusters.'
    },
    {
        id: 'southern-tech',
        title: 'Southern IT & Innovation Corridor',
        category: 'tech',
        categoryLabel: 'Tech & Commerce',
        origin: 'Bengaluru',
        destination: 'Chennai',
        stops: ['Mysuru', 'Coimbatore'],
        distanceKm: 680,
        timeEst: '11 hrs',
        tag: 'Tech Hubs',
        badgeColor: '#10b981',
        petrolCost: 5730,
        dieselCost: 3980,
        cngCost: 2725,
        cngSave: 3005,
        description: 'Traversing southern tech hubs, automotive belts, and port terminals down to Chennai.'
    },
    {
        id: 'himalayan-foothills',
        title: 'Himalayan Foothills & Ganga Gateway',
        category: 'tourism',
        categoryLabel: 'Scenic Mountain',
        origin: 'Delhi',
        destination: 'Rishikesh',
        stops: ['Chandigarh', 'Dehradun'],
        distanceKm: 485,
        timeEst: '8.5 hrs',
        tag: 'Scenic Mountain',
        badgeColor: '#8b5cf6',
        petrolCost: 4090,
        dieselCost: 2840,
        cngCost: 1940,
        cngSave: 2150,
        description: 'From Delhi plains through planned city Chandigarh up to holy Ganges ghats in Rishikesh.'
    },
    {
        id: 'konkan-coast',
        title: 'Western Ghats & Konkan Coast Cruise',
        category: 'coastal',
        categoryLabel: 'Coastal Roadtrip',
        origin: 'Mumbai',
        destination: 'Goa',
        stops: ['Pune', 'Kolhapur'],
        distanceKm: 590,
        timeEst: '10 hrs',
        tag: 'Coastal Expressway',
        badgeColor: '#06b6d4',
        petrolCost: 4980,
        dieselCost: 3450,
        cngCost: 2360,
        cngSave: 2620,
        description: 'Crossing the Mumbai-Pune Expressway, Western Ghats hills, and descending into pristine Goan beaches.'
    }
];

// ── Reduced-motion check ────────────────────────────────────────────
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Init Landing Sequence ───────────────────────────────────────────
window.initLandingSequence = function () {
    if (landingInitDone) return;
    landingInitDone = true;

    const mapContainer = document.getElementById('hero-map-container');
    if (mapContainer && typeof L !== 'undefined') {
        heroMap = L.map('hero-map-container', {
            zoomControl: false,
            attributionControl: false,
            dragging: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            touchZoom: false,
            boxZoom: false,
            keyboard: false
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18
        }).addTo(heroMap);

        const bounds = L.latLngBounds(HERO_ROUTE_COORDS);
        heroMap.fitBounds(bounds, { padding: [30, 30] });

        if (reduceMotion) {
            renderHeroStatic();
        } else {
            runHeroAnimation();
        }
    }

    // Initialize interactive widgets and scroll observers
    initInteractiveHowSimulator();
    setupScrollReveals();
    setup3DCardTilt();
};

// ── Static render (reduced motion) ──────────────────────────────────
function renderHeroStatic() {
    if (!heroMap) return;
    const tilePane = document.querySelector('#hero-map-container .leaflet-tile-pane');
    if (tilePane) tilePane.style.opacity = '1';

    heroRouteLayer = L.polyline(HERO_ROUTE_COORDS, {
        color: '#2563eb',
        weight: 5,
        opacity: 0.9
    }).addTo(heroMap);

    HERO_CITIES.forEach(function (city) {
        var dot = L.circleMarker([city.lat, city.lng], {
            radius: 7,
            fillColor: city.color,
            fillOpacity: 1,
            color: '#fff',
            weight: 2,
            className: 'hero-city-dot'
        }).addTo(heroMap);
        dot.bindTooltip(city.name, {
            permanent: false,
            direction: 'top',
            offset: [0, -10],
            className: 'route-polyline-tooltip'
        });
    });

    setCounterValue('hero-counter-petrol', '₹6.31');
    setCounterValue('hero-counter-diesel', '₹4.38');
    setCounterValue('hero-counter-cng', '₹3.00');
    setCounterValue('hero-counter-distance', HERO_DISTANCE_KM.toLocaleString('en-IN'));

    const h1Petrol = document.getElementById('hero-h1-petrol');
    const h1Cng = document.getElementById('hero-h1-cng');
    if (h1Petrol) h1Petrol.textContent = '₹6.31';
    if (h1Cng) h1Cng.textContent = '₹3.00';

    revealAllProofFigures();
}

// ── Animated Hero Sequence ──────────────────────────────────────────
function runHeroAnimation() {
    if (!heroMap) return;
    var tilePane = document.querySelector('#hero-map-container .leaflet-tile-pane');
    if (tilePane) {
        tilePane.style.opacity = '0';
        tilePane.style.transition = 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)';
    }

    setTimeout(function () {
        if (tilePane) tilePane.style.opacity = '1';
    }, 0);

    HERO_CITIES.forEach(function (city, idx) {
        setTimeout(function () {
            var dot = L.circleMarker([city.lat, city.lng], {
                radius: 7,
                fillColor: city.color,
                fillOpacity: 1,
                color: '#fff',
                weight: 2,
                className: 'hero-city-dot'
            }).addTo(heroMap);
            dot.bindTooltip(city.name, {
                permanent: false,
                direction: 'top',
                offset: [0, -10],
                className: 'route-polyline-tooltip'
            });

            var el = dot.getElement();
            if (el) {
                el.style.transform = 'scale(0.6)';
                el.style.transition = 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)';
                requestAnimationFrame(function () {
                    requestAnimationFrame(function () {
                        el.style.transform = 'scale(1)';
                    });
                });
            }
        }, 200 + idx * 90);
    });

    setTimeout(function () {
        heroRouteLayer = L.polyline(HERO_ROUTE_COORDS, {
            color: '#2563eb',
            weight: 5,
            opacity: 0.9
        }).addTo(heroMap);

        var svgPath = null;
        heroMap.eachLayer(function (layer) {
            if (layer === heroRouteLayer && layer.getElement) {
                svgPath = layer.getElement();
            }
        });

        if (!svgPath) {
            var overlayPane = document.querySelector('#hero-map-container .leaflet-overlay-pane svg path');
            if (overlayPane) svgPath = overlayPane;
        }

        if (svgPath) {
            var pathLength = svgPath.getTotalLength();
            svgPath.style.strokeDasharray = pathLength;
            svgPath.style.strokeDashoffset = pathLength;
            svgPath.style.transition = 'stroke-dashoffset 930ms cubic-bezier(0.4, 0, 0.2, 1)';

            requestAnimationFrame(function () {
                svgPath.style.strokeDashoffset = '0';
            });
        }
    }, 470);

    setTimeout(function () {
        countUp('hero-counter-petrol', 0, 6.31, 700, '₹', '');
        countUp('hero-counter-diesel', 0, 4.38, 700, '₹', '');
        countUp('hero-counter-cng', 0, 3.00, 700, '₹', '');
        countUp('hero-counter-distance', 0, HERO_DISTANCE_KM, 700, '', '');

        countUp('hero-h1-petrol', 0, 6.31, 500, '₹', '');
        countUp('hero-h1-cng', 0, 3.00, 500, '₹', '');
    }, 900);
}

// ── Interactive "How It Works" Live Step Simulator ──────────────────
function initInteractiveHowSimulator() {
    const slider = document.getElementById('how-sim-slider');
    const distText = document.getElementById('how-sim-dist-text');
    const pCostEl = document.getElementById('how-sim-petrol');
    const dCostEl = document.getElementById('how-sim-diesel');
    const cCostEl = document.getElementById('how-sim-cng');
    const saveBadge = document.getElementById('how-sim-savings');
    const pBar = document.getElementById('how-sim-pbar');
    const cBar = document.getElementById('how-sim-cbar');

    if (!slider) return;

    function recalc() {
        const km = parseFloat(slider.value) || 350;
        if (distText) distText.textContent = `${km} km`;

        // Baseline: Petrol (15 km/l @ ₹94.72), Diesel (20 km/l @ ₹87.62), CNG (25 km/kg @ ₹75.09)
        const pTotal = Math.round((km / 15) * 94.72);
        const dTotal = Math.round((km / 20) * 87.62);
        const cTotal = Math.round((km / 25) * 75.09);
        const saved = Math.max(0, pTotal - cTotal);

        if (pCostEl) pCostEl.textContent = `₹${pTotal.toLocaleString('en-IN')}`;
        if (dCostEl) dCostEl.textContent = `₹${dTotal.toLocaleString('en-IN')}`;
        if (cCostEl) cCostEl.textContent = `₹${cTotal.toLocaleString('en-IN')}`;
        if (saveBadge) saveBadge.textContent = `Save ₹${saved.toLocaleString('en-IN')} on CNG`;

        if (pBar) pBar.style.width = '100%';
        if (cBar && pTotal > 0) {
            const ratio = Math.round((cTotal / pTotal) * 100);
            cBar.style.width = `${Math.min(100, Math.max(25, ratio))}%`;
        }
    }

    slider.addEventListener('input', recalc);
    recalc();
}

// ── Featured Example Routes Handlers ────────────────────────────────
window.filterExampleRoutes = function (category) {
    document.querySelectorAll('.example-filter-pill').forEach(function (btn) {
        btn.classList.toggle('active', btn.getAttribute('data-filter') === category);
    });

    const cards = document.querySelectorAll('.example-route-card');
    cards.forEach(function (card) {
        const cardCat = card.getAttribute('data-category');
        if (category === 'all' || cardCat === category) {
            card.style.display = 'flex';
            card.classList.remove('animate-fade-in');
            void card.offsetWidth; // Trigger reflow
            card.classList.add('animate-fade-in');
        } else {
            card.style.display = 'none';
        }
    });
};

window.launchExampleFromCard = function (routeId) {
    const route = FEATURED_ROUTES.find(function (r) { return r.id === routeId; });
    if (!route) return;
    if (typeof loadRoutePreset === 'function') {
        loadRoutePreset(route.origin, route.destination, route.stops);
    }
};

// ── 3D Card Hover Physics ───────────────────────────────────────────
function setup3DCardTilt() {
    if (reduceMotion) return;
    const cards = document.querySelectorAll('.tilt-card');
    cards.forEach(function (card) {
        card.addEventListener('mousemove', function (e) {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const cx = rect.width / 2;
            const cy = rect.height / 2;
            const dx = (x - cx) / cx;
            const dy = (y - cy) / cy;
            const rx = -dy * 6;
            const ry = dx * 6;
            card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px)`;
        });

        card.addEventListener('mouseleave', function () {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
        });
    });
}

// ── Count-up utility ────────────────────────────────────────────────
function countUp(elementId, start, end, duration, prefix, suffix) {
    var el = document.getElementById(elementId);
    if (!el) return;

    if (reduceMotion) {
        el.textContent = prefix + formatCounterValue(end) + suffix;
        return;
    }

    var startTime = null;
    var isInteger = Number.isInteger(end);

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        var t = Math.min((timestamp - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - t, 3);
        var current = start + (end - start) * eased;

        el.textContent = prefix + formatCounterValue(current, isInteger) + suffix;

        if (t < 1) {
            requestAnimationFrame(step);
        } else {
            el.textContent = prefix + formatCounterValue(end, isInteger) + suffix;
        }
    }

    requestAnimationFrame(step);
}

function formatCounterValue(value, isInteger) {
    if (isInteger || value >= 100) {
        return Math.round(value).toLocaleString('en-IN');
    }
    return value.toFixed(2);
}

function setCounterValue(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
}

// ── Scroll Reveals & Dynamic Animations ─────────────────────────────
function setupScrollReveals() {
    if (reduceMotion) {
        document.querySelectorAll('.landing-reveal, .rw-reveal, .how-step-interactive, .example-route-card').forEach(function (el) {
            el.classList.add('revealed', 'rw-visible');
            el.style.opacity = '1';
            el.style.transform = 'none';
        });
        revealAllProofFigures();
        return;
    }

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            var target = entry.target;
            observer.unobserve(target);

            if (target.id === 'landing-proof') {
                var figures = target.querySelectorAll('.proof-figure');
                figures.forEach(function (fig, idx) {
                    setTimeout(function () {
                        var endVal = parseFloat(fig.getAttribute('data-value'));
                        var prefix = fig.getAttribute('data-prefix') || '';
                        var suffix = fig.getAttribute('data-suffix') || '';
                        countUp(fig.id, 0, endVal, 600, prefix, suffix);
                    }, idx * 60);
                });
            }

            if (target.id === 'landing-how') {
                var steps = target.querySelectorAll('.how-step-interactive');
                var connector = target.querySelector('.how-interactive-pipeline-track');
                if (connector) connector.classList.add('active');

                steps.forEach(function (step, idx) {
                    setTimeout(function () {
                        step.classList.add('revealed');
                    }, idx * 130);
                });
            }

            if (target.id === 'landing-examples') {
                var cards = target.querySelectorAll('.example-route-card');
                cards.forEach(function (card, idx) {
                    setTimeout(function () {
                        card.classList.add('revealed');
                    }, idx * 100);
                });
            }

            if (target.id === 'landing-receipt') {
                target.classList.add('revealed');
                countUp('receipt-annual-save', 0, 38131, 800, '₹', '');

                setTimeout(function () {
                    var petrolBar = document.getElementById('receipt-bar-petrol');
                    var cngBar = document.getElementById('receipt-bar-cng');
                    if (petrolBar) petrolBar.style.width = '100%';
                    if (cngBar) cngBar.style.width = '47.5%';
                }, 200);
            }
        });
    }, { threshold: 0.25 });

    ['landing-proof', 'landing-how', 'landing-examples', 'landing-receipt'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) observer.observe(el);
    });

    var rwRevealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            rwRevealObserver.unobserve(entry.target);
            var delay = parseFloat(entry.target.getAttribute('data-delay') || '0');
            setTimeout(function () {
                entry.target.classList.add('rw-visible');
            }, delay * 1000);
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.rw-reveal').forEach(function (el) {
        rwRevealObserver.observe(el);
    });
}

function revealAllProofFigures() {
    var figures = document.querySelectorAll('#landing-proof .proof-figure');
    figures.forEach(function (fig) {
        var val = fig.getAttribute('data-value');
        var prefix = fig.getAttribute('data-prefix') || '';
        var suffix = fig.getAttribute('data-suffix') || '';
        var isInt = fig.getAttribute('data-integer') === 'true';
        if (isInt) {
            fig.textContent = prefix + parseInt(val).toLocaleString('en-IN') + suffix;
        } else {
            fig.textContent = prefix + val + suffix;
        }
    });
}
