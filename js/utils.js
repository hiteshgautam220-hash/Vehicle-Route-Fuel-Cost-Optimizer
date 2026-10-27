/**
 * RouteWise — utils.js
 * Shared helpers: toast notifications, one-page scroll router, theme toggle,
 * live system status ping, contact form handler, and interactive Academic Syllabus Explorer.
 * Depends on: api.js, config.js
 */

// ── Toast Notifications ──────────────────────────────────────────
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `custom-toast toast-${type}`;

    const icons = {
        success: 'check-circle',
        warning: 'exclamation-triangle',
        error: 'times-circle',
        info: 'info-circle'
    };
    const icon = icons[type] || 'info-circle';

    toast.innerHTML = `
        <i class="fas fa-${icon} fs-5"></i>
        <div class="flex-grow-1">${message}</div>
        <button type="button" class="btn-close btn-close-white btn-sm ms-2" onclick="this.parentElement.remove()" style="font-size: 10px;"></button>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ── One-page scroll router ───────────────────────────────────────
const RW_SECTIONS = ['optimizer', 'comparison', 'rates', 'about'];
let spyLockedUntil = 0;
let spyQueued = false;

function setActiveSection(tabName) {
    document.querySelectorAll('.tab-view-container').forEach(el => el.classList.remove('active-tab'));
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));

    const targetView = document.getElementById(`view-${tabName}`);
    const targetNav  = document.getElementById(`nav-btn-${tabName}`);

    if (targetView) targetView.classList.add('active-tab');
    if (targetNav)  targetNav.classList.add('active');
}

function switchTab(tabName) {
    setActiveSection(tabName);
    spyLockedUntil = Date.now() + 900;

    const targetView = document.getElementById(`view-${tabName}`);
    if (targetView) {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        targetView.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }

    if (tabName === 'optimizer' && typeof map !== 'undefined' && map) {
        setTimeout(() => map.invalidateSize(), 200);
    }

    const navbarCollapse = document.getElementById('navbarContent');
    if (navbarCollapse && navbarCollapse.classList.contains('show')) {
        const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
        if (bsCollapse) bsCollapse.hide();
    }
}
window.switchTab = switchTab;

RW_SECTIONS.forEach(name => {
    document.getElementById(`nav-btn-${name}`)?.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.hash = name;
        switchTab(name);
    });
});

window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '');
    if (RW_SECTIONS.includes(hash)) switchTab(hash);
});

function updateActiveOnScroll() {
    spyQueued = false;
    if (Date.now() < spyLockedUntil) return;

    let current = null;
    for (const name of RW_SECTIONS) {
        const el = document.getElementById(`view-${name}`);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= 90) current = name;
    }

    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        current = RW_SECTIONS[RW_SECTIONS.length - 1];
    }

    if (current) setActiveSection(current);
}

window.addEventListener('scroll', () => {
    if (spyQueued) return;
    spyQueued = true;
    requestAnimationFrame(updateActiveOnScroll);
}, { passive: true });

// ── Dark / Light Theme Toggle ────────────────────────────────────
function initTheme() {
    const savedTheme = localStorage.getItem('routeWiseTheme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    applyTheme(initialTheme, false);
}

function applyTheme(theme, notify = false) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('routeWiseTheme', theme);

    const icon = document.getElementById('theme-toggle-icon');
    const btn = document.getElementById('theme-toggle-btn');
    if (icon) {
        if (theme === 'dark') {
            icon.className = 'fas fa-sun text-warning';
            if (btn) btn.setAttribute('title', 'Switch to Light Mode');
        } else {
            icon.className = 'fas fa-moon text-light';
            if (btn) btn.setAttribute('title', 'Switch to Dark Mode');
        }
    }

    if (notify && typeof showToast === 'function') {
        showToast(`${theme === 'dark' ? '🌙 Dark' : '☀️ Light'} Mode activated`, 'info');
    }
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next, true);
}
window.toggleTheme = toggleTheme;
window.applyTheme = applyTheme;

initTheme();

// Footer dynamic year
const yearEl = document.getElementById('current-year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ── Live Backend & Database Health Ping ───────────────────────────
async function checkBackendHealth() {
    try {
        const res = await RouteWiseAPI.health();
        if (res.success) {
            const statusCard = document.querySelector('.footer-status-card');
            if (statusCard) {
                const dbStatus = res.database.connected ? 'Online (MongoDB Atlas/Local)' : 'Fallback Mode';
                statusCard.innerHTML = `
                    <div class="footer-status-line">
                        <span class="ticker-dot" style="background:#10b981;"></span>
                        <span>Node.js & Express API: Online (v2.0)</span>
                    </div>
                    <div class="footer-status-meta mt-1">
                        <div><i class="fas fa-database text-success me-1"></i> Database: ${dbStatus}</div>
                        <div><i class="fas fa-bolt text-warning me-1"></i> Uptime: ${res.uptimeSeconds}s | REST APIs: Ready</div>
                    </div>`;
            }
        }
    } catch (e) {
        console.warn('[Health Check] Express backend not responding, running in standalone client mode.');
    }
}

setTimeout(checkBackendHealth, 1000);

// ── Contact & Community Feedback Form ─────────────────────────────
let selectedContactTopic = '✨ Feature Suggestion';

window.selectContactTopic = (topic, btnEl) => {
    selectedContactTopic = topic;
    const chips = document.querySelectorAll('#contact-topic-chips .topic-chip');
    chips.forEach(c => c.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');

    const subjectInput = document.getElementById('contact-subject');
    if (subjectInput) subjectInput.value = topic;
};

window.copySupportEmail = (btnEl) => {
    const emailVal = document.getElementById('support-email-val')?.textContent || 'support@routewise.in';
    navigator.clipboard?.writeText(emailVal).then(() => {
        showToast(`Copied ${emailVal} to clipboard!`, 'success');
        if (btnEl) {
            const old = btnEl.innerHTML;
            btnEl.innerHTML = '<i class="fas fa-check text-success"></i>';
            setTimeout(() => { btnEl.innerHTML = old; }, 1500);
        }
    }).catch(() => {
        showToast(`Email: ${emailVal}`, 'info');
    });
};

document.getElementById('contact-message')?.addEventListener('input', (e) => {
    const len = e.target.value.length;
    const countEl = document.getElementById('contact-char-count');
    if (countEl) countEl.textContent = `${len} / 500`;
});

document.getElementById('contact-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('contact-name')?.value.trim();
    const email = document.getElementById('contact-email')?.value.trim();
    const subject = document.getElementById('contact-subject')?.value.trim();
    const message = document.getElementById('contact-message')?.value.trim();
    const submitBtn = document.getElementById('btn-submit-contact');

    if (!name || !email || !subject || !message) {
        showToast('Please fill out all message fields.', 'warning');
        return;
    }

    const origHtml = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Submitting to Server...';
    }

    try {
        const payload = {
            name,
            email,
            topic: selectedContactTopic,
            subject,
            message
        };

        const res = await RouteWiseAPI.feedback.submit(payload);

        showToast(`Message submitted! Ticket ID: #${String(res.feedbackId).slice(-6)}`, 'success');
        document.getElementById('contact-form')?.reset();
        const charCount = document.getElementById('contact-char-count');
        if (charCount) charCount.textContent = '0 / 500';
    } catch (err) {
        showToast(err.message || 'Failed to submit feedback to server.', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = origHtml;
        }
    }
});

// ── Academic Syllabus Explorer Modal ──────────────────────────────
window.openSyllabusExplorerModal = () => {
    let modalEl = document.getElementById('syllabusExplorerModal');
    if (!modalEl) {
        modalEl = document.createElement('div');
        modalEl.id = 'syllabusExplorerModal';
        modalEl.className = 'modal fade';
        modalEl.tabIndex = -1;
        modalEl.innerHTML = `
            <div class="modal-dialog modal-dialog-centered modal-xl">
                <div class="modal-content border-0 shadow-lg" style="border-radius: 16px; overflow: hidden;">
                    <div class="modal-header bg-dark text-white border-0 py-3">
                        <div class="d-flex align-items-center gap-2">
                            <span class="badge bg-warning text-dark px-2 py-1"><i class="fas fa-graduation-cap me-1"></i> Academic Hub</span>
                            <h5 class="modal-title fw-bold mb-0">Syllabus Concepts & Live Demo Hub</h5>
                        </div>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4 bg-light">
                        <p class="text-muted small mb-3">
                            This application transforms RouteWise into a full-stack educational showcase covering all topics from your Node.js, Express, MongoDB, and Asynchronous JavaScript curriculum. Click any tab below to inspect the concept and trigger live server execution:
                        </p>

                        <!-- Nav tabs -->
                        <ul class="nav nav-pills mb-3 gap-2 flex-wrap" id="syllabusTabs" role="tablist">
                            <li class="nav-item">
                                <button class="nav-link active" id="tab-node-runtime" data-bs-toggle="pill" data-bs-target="#content-node-runtime" type="button">
                                    <i class="fab fa-node-js me-1 text-success"></i> 1. Node & V8 Runtime
                                </button>
                            </li>
                            <li class="nav-item">
                                <button class="nav-link" id="tab-async-js" data-bs-toggle="pill" data-bs-target="#content-async-js" type="button">
                                    <i class="fas fa-random me-1 text-primary"></i> 2. Async (Callbacks/Promises/Await)
                                </button>
                            </li>
                            <li class="nav-item">
                                <button class="nav-link" id="tab-streams-buffers" data-bs-toggle="pill" data-bs-target="#content-streams-buffers" type="button">
                                    <i class="fas fa-stream me-1 text-info"></i> 3. Streams & Buffers
                                </button>
                            </li>
                            <li class="nav-item">
                                <button class="nav-link" id="tab-event-emitter" data-bs-toggle="pill" data-bs-target="#content-event-emitter" type="button">
                                    <i class="fas fa-bell me-1 text-warning"></i> 4. EventEmitter Pattern
                                </button>
                            </li>
                            <li class="nav-item">
                                <button class="nav-link" id="tab-rest-mongo" data-bs-toggle="pill" data-bs-target="#content-rest-mongo" type="button">
                                    <i class="fas fa-database me-1 text-danger"></i> 5. Express REST & MongoDB
                                </button>
                            </li>
                        </ul>

                        <!-- Tab contents -->
                        <div class="tab-content bg-white p-4 rounded-3 border" id="syllabusTabContent">
                            
                            <!-- 1. Node Runtime & V8 -->
                            <div class="tab-pane fade show active" id="content-node-runtime" role="tabpanel">
                                <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                                    <div>
                                        <h5 class="fw-bold mb-1">Node.js Runtime, V8 Engine & Process Global</h5>
                                        <p class="text-muted small mb-0">Demonstrates process global, V8 memory usage heap stats, OS architecture, and Event Loop phases.</p>
                                    </div>
                                    <button class="btn btn-sm btn-primary" onclick="runLiveSyllabusDemo('node-info', 'node-output')">
                                        <i class="fas fa-play me-1"></i> Run Live Server Probe
                                    </button>
                                </div>
                                <div class="p-3 bg-dark text-light rounded-3 font-monospace small" id="node-output" style="max-height: 320px; overflow-y: auto;">
                                    // Click "Run Live Server Probe" to query GET /api/demo/node-info
                                </div>
                            </div>

                            <!-- 2. Async JS -->
                            <div class="tab-pane fade" id="content-async-js" role="tabpanel">
                                <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                                    <div>
                                        <h5 class="fw-bold mb-1">Asynchronous JavaScript Progression</h5>
                                        <p class="text-muted small mb-0">Compares traditional Callbacks, Promise Chaining (.then/.catch), and modern Async/Await in a single live pipeline.</p>
                                    </div>
                                    <button class="btn btn-sm btn-primary" onclick="runLiveSyllabusDemo('async-comparison', 'async-output')">
                                        <i class="fas fa-play me-1"></i> Execute Async Comparison
                                    </button>
                                </div>
                                <div class="p-3 bg-dark text-light rounded-3 font-monospace small" id="async-output" style="max-height: 320px; overflow-y: auto;">
                                    // Click "Execute Async Comparison" to query GET /api/demo/async-comparison
                                </div>
                            </div>

                            <!-- 3. Streams & Buffers -->
                            <div class="tab-pane fade" id="content-streams-buffers" role="tabpanel">
                                <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                                    <div>
                                        <h5 class="fw-bold mb-1">Node.js Buffers & fs Streams</h5>
                                        <p class="text-muted small mb-0">Demonstrates binary Buffer allocation, Base64 encoding/decoding, and streaming file reading with highWaterMark chunk control.</p>
                                    </div>
                                    <button class="btn btn-sm btn-primary" onclick="runLiveSyllabusDemo('streams-buffers', 'streams-output')">
                                        <i class="fas fa-play me-1"></i> Stream File Chunks & Buffers
                                    </button>
                                </div>
                                <div class="p-3 bg-dark text-light rounded-3 font-monospace small" id="streams-output" style="max-height: 320px; overflow-y: auto;">
                                    // Click "Stream File Chunks & Buffers" to query GET /api/demo/streams-buffers
                                </div>
                            </div>

                            <!-- 4. EventEmitter -->
                            <div class="tab-pane fade" id="content-event-emitter" role="tabpanel">
                                <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                                    <div>
                                        <h5 class="fw-bold mb-1">Node.js EventEmitter Pattern</h5>
                                        <p class="text-muted small mb-0">Demonstrates application domain events emitted via events.EventEmitter and handled asynchronously by decoupled audit listeners.</p>
                                    </div>
                                    <button class="btn btn-sm btn-primary" onclick="runLiveSyllabusDemo('event-emitter', 'events-output')">
                                        <i class="fas fa-play me-1"></i> Dispatch Custom Event
                                    </button>
                                </div>
                                <div class="p-3 bg-dark text-light rounded-3 font-monospace small" id="events-output" style="max-height: 320px; overflow-y: auto;">
                                    // Click "Dispatch Custom Event" to query GET /api/demo/event-emitter
                                </div>
                            </div>

                            <!-- 5. Express REST & MongoDB -->
                            <div class="tab-pane fade" id="content-rest-mongo" role="tabpanel">
                                <h5 class="fw-bold mb-2">Express REST API & Mongoose Architecture</h5>
                                <p class="text-muted small mb-3">Overview of active production endpoints and Mongoose models in this application:</p>
                                <div class="table-responsive">
                                    <table class="table table-sm table-bordered">
                                        <thead class="table-light">
                                            <tr><th>Method</th><th>Endpoint</th><th>Purpose</th><th>Authentication</th></tr>
                                        </thead>
                                        <tbody class="small font-monospace">
                                            <tr><td><span class="badge bg-success">POST</span></td><td>/api/auth/register</td><td>Register account (bcrypt hash)</td><td>Public</td></tr>
                                            <tr><td><span class="badge bg-success">POST</span></td><td>/api/auth/login</td><td>Login & issue signed JWT</td><td>Public</td></tr>
                                            <tr><td><span class="badge bg-primary">GET</span></td><td>/api/auth/me</td><td>Get current user profile</td><td><span class="badge bg-warning text-dark">JWT Bearer</span></td></tr>
                                            <tr><td><span class="badge bg-success">POST</span></td><td>/api/auth/avatar</td><td>Upload user avatar (Multer)</td><td><span class="badge bg-warning text-dark">JWT Bearer</span></td></tr>
                                            <tr><td><span class="badge bg-primary">GET</span></td><td>/api/trips</td><td>List saved trips (paginated, query)</td><td><span class="badge bg-warning text-dark">JWT Bearer</span></td></tr>
                                            <tr><td><span class="badge bg-success">POST</span></td><td>/api/trips</td><td>Create saved journey (MongoDB)</td><td><span class="badge bg-warning text-dark">JWT Bearer</span></td></tr>
                                            <tr><td><span class="badge bg-danger">DELETE</span></td><td>/api/trips/:id</td><td>Delete saved journey</td><td><span class="badge bg-warning text-dark">JWT Bearer</span></td></tr>
                                            <tr><td><span class="badge bg-success">POST</span></td><td>/api/routes/calculate</td><td>Server-side OSRM & fuel price matrix</td><td>Public</td></tr>
                                            <tr><td><span class="badge bg-primary">GET</span></td><td>/api/cities</td><td>4,200+ cities autocomplete stream</td><td>Public</td></tr>
                                            <tr><td><span class="badge bg-success">POST</span></td><td>/api/feedback</td><td>Submit feedback inquiry & audit log</td><td>Public</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(modalEl);
    }

    new bootstrap.Modal(modalEl).show();
};

window.runLiveSyllabusDemo = async (endpoint, outputElementId) => {
    const el = document.getElementById(outputElementId);
    if (!el) return;

    el.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span> Executing GET /api/demo/${endpoint} on Node.js Express server...`;

    try {
        const baseUrl = window.API_BASE_URL || (typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : '');
        const res = await fetch(`${baseUrl}/api/demo/${endpoint}`);
        const data = await res.json();
        el.innerHTML = `// Response from http://localhost:5000/api/demo/${endpoint}\n// HTTP Status: ${res.status} OK\n\n` + JSON.stringify(data, null, 2);
    } catch (err) {
        el.innerHTML = `// Error executing demo: ${err.message}\n// Please make sure the backend server is running (npm run dev)`;
    }
};
