/**
 * RouteWise — auth.js
 * Account Management, Backend API Authentication, JWT Session Restore,
 * Profile & Avatar Upload, Guest Mode, and Animated Car Engine Startup.
 * Depends on: api.js, config.js, utils.js
 */

let currentUser = null;

// ── Session Restorer on Page Load ───────────────────────────────────
async function checkAuthSession() {
    const token = RouteWiseAPI.getToken();
    if (!token) {
        currentUser = null;
        renderAuthNavbar();
        return null;
    }

    try {
        const res = await RouteWiseAPI.auth.getMe();
        if (res.success && res.user) {
            currentUser = res.user;
            localStorage.setItem('routeWiseUser', JSON.stringify(currentUser));
            renderAuthNavbar();
            if (typeof refreshSavedRoutesForCurrentUser === 'function') {
                refreshSavedRoutesForCurrentUser();
            }
            return currentUser;
        }
    } catch (err) {
        console.warn('[Auth] Session token expired or invalid:', err.message);
        RouteWiseAPI.clearToken();
        localStorage.removeItem('routeWiseUser');
        currentUser = null;
        renderAuthNavbar();
    }
    return null;
}

function getStoredSessionUser() {
    try {
        const stored = localStorage.getItem('routeWiseUser');
        return stored ? JSON.parse(stored) : null;
    } catch (e) {
        return null;
    }
}

// ── Auth Mode Toggle (Sign In / Sign Up tabs) ────────────────────
window.setGatewayAuthMode = (mode) => {
    const btnSignIn  = document.getElementById('gateway-tab-signin');
    const btnSignUp  = document.getElementById('gateway-tab-signup');
    const formSignIn = document.getElementById('gateway-signin-form');
    const formSignUp = document.getElementById('gateway-signup-form');

    if (mode === 'signin') {
        btnSignIn?.classList.add('active');
        btnSignUp?.classList.remove('active');
        if (formSignIn) formSignIn.style.display = 'block';
        if (formSignUp) formSignUp.style.display = 'none';
    } else {
        btnSignUp?.classList.add('active');
        btnSignIn?.classList.remove('active');
        if (formSignUp) formSignUp.style.display = 'block';
        if (formSignIn) formSignIn.style.display = 'none';
    }
};

// ── Form Submit Handlers (Connected to Express REST API) ───────────

// 1. Sign In Form
document.getElementById('gateway-signin-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailInput    = document.getElementById('gateway-signin-email')?.value.trim();
    const passwordInput = document.getElementById('gateway-signin-password')?.value;
    const submitBtn     = e.target.querySelector('button[type="submit"]');

    if (!emailInput || !passwordInput) {
        showToast("Please enter both email and password.", "warning");
        return;
    }

    const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Authenticating...';
    }

    try {
        const data = await RouteWiseAPI.auth.login({
            email: emailInput,
            password: passwordInput
        });

        RouteWiseAPI.setToken(data.token);
        currentUser = data.user;
        localStorage.setItem('routeWiseUser', JSON.stringify(currentUser));

        hideAuthGateway();
        triggerLoginSequence(currentUser);
    } catch (err) {
        showToast(err.message || 'Login failed. Please verify credentials.', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHtml;
        }
    }
});

// 2. Sign Up Form
document.getElementById('gateway-signup-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name    = document.getElementById('gateway-signup-name')?.value.trim();
    const email   = document.getElementById('gateway-signup-email')?.value.trim().toLowerCase();
    const fuel    = document.getElementById('gateway-signup-fuel')?.value || 'cng';
    const mileage = parseFloat(document.getElementById('gateway-signup-mileage')?.value) || 24;
    const password= document.getElementById('gateway-signup-password')?.value;
    const submitBtn = e.target.querySelector('button[type="submit"]');

    if (!name || !email || !password) {
        showToast("Please fill in all required account fields.", "warning");
        return;
    }

    if (password.length < 6) {
        showToast("Password must be at least 6 characters long.", "warning");
        return;
    }

    const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Registering Account...';
    }

    try {
        const data = await RouteWiseAPI.auth.register({
            name,
            email,
            password,
            fuelPreference: fuel,
            vehicleMileage: mileage
        });

        RouteWiseAPI.setToken(data.token);
        currentUser = data.user;
        localStorage.setItem('routeWiseUser', JSON.stringify(currentUser));

        hideAuthGateway();
        triggerLoginSequence(currentUser);
    } catch (err) {
        showToast(err.message || 'Registration failed.', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHtml;
        }
    }
});

// 3. Quick 1-Click Instant Logins (Calling Express Authentication API)
async function performQuickLogin(email, password) {
    try {
        showToast('Connecting to Express authentication engine...', 'info');
        const data = await RouteWiseAPI.auth.login({ email, password });
        RouteWiseAPI.setToken(data.token);
        currentUser = data.user;
        localStorage.setItem('routeWiseUser', JSON.stringify(currentUser));
        hideAuthGateway();
        triggerLoginSequence(currentUser);
    } catch (err) {
        // Fallback for offline demo mode
        const fallbackSeed = {
            name: email.includes('fleet') ? 'Ananya Sharma (Fleet Manager)' : 'Vikram Kumar (CNG Driver)',
            email,
            fuelPreference: email.includes('fleet') ? 'diesel' : 'cng',
            vehicleMileage: email.includes('fleet') ? 20 : 25
        };
        currentUser = fallbackSeed;
        localStorage.setItem('routeWiseUser', JSON.stringify(currentUser));
        hideAuthGateway();
        triggerLoginSequence(currentUser);
    }
}

document.getElementById('btn-quick-cng-driver')?.addEventListener('click', () => {
    performQuickLogin('driver@routewise.in', 'password123');
});

document.getElementById('btn-quick-fleet-mgr')?.addEventListener('click', () => {
    performQuickLogin('fleet@routewise.in', 'password123');
});

// ── Car Animation + App Unlock ───────────────────────────────────
function triggerLoginSequence(userObj) {
    currentUser = userObj;
    renderAuthNavbar();
    if (typeof refreshSavedRoutesForCurrentUser === 'function') {
        refreshSavedRoutesForCurrentUser();
    }

    const overlay   = document.getElementById('car-transition-overlay');
    const progress  = document.getElementById('car-anim-progress');
    const title     = document.getElementById('car-anim-title');
    const subtitle  = document.getElementById('car-anim-subtitle');

    if (overlay) {
        overlay.classList.add('active');
        if (progress) progress.style.width = '0%';
        if (title)    title.textContent    = "Starting Your Engine...";
        if (subtitle) subtitle.textContent = `Authenticating profile for ${userObj.name}...`;

        setTimeout(() => {
            if (progress) progress.style.width = '50%';
            if (title)    title.textContent    = "Connecting Highway Satellite Networks...";
            if (subtitle) subtitle.textContent = "Loading 4,000+ Indian road networks and live fuel rates...";
        }, 500);

        setTimeout(() => {
            if (progress) progress.style.width = '100%';
            if (title)    title.textContent    = `Welcome to RouteWise, ${userObj.name}!`;
            if (subtitle) subtitle.textContent = "Launching RouteWise Journey Planner...";
        }, 1100);

        setTimeout(() => {
            overlay.classList.remove('active');
            unlockApplication();
            showToast(`Welcome back to RouteWise, ${userObj.name}!`, 'success');

            if (typeof processPendingTripSave === 'function') {
                processPendingTripSave();
            }
        }, 1700);
    } else {
        unlockApplication();
        if (typeof processPendingTripSave === 'function') {
            processPendingTripSave();
        }
    }
}

// Initial Website Load Screen Animation
window.triggerInitialLoadingSequence = async (storedUser) => {
    const overlay   = document.getElementById('car-transition-overlay');
    const progress  = document.getElementById('car-anim-progress');
    const title     = document.getElementById('car-anim-title');
    const subtitle  = document.getElementById('car-anim-subtitle');

    if (overlay) {
        overlay.classList.add('active');
        if (progress) progress.style.width = '0%';
        if (title)    title.textContent    = "Starting Your Engine...";
        if (subtitle) subtitle.textContent = storedUser ? `Restoring profile for ${storedUser.name}...` : "Calibrating Highway Networks & Fuel Prices...";

        setTimeout(() => {
            if (progress) progress.style.width = '60%';
            if (title)    title.textContent    = "Connecting Satellite Road Graphs...";
            if (subtitle) subtitle.textContent = "Loading 4,000+ Indian road networks and live fuel rates...";
        }, 400);

        setTimeout(() => {
            if (progress) progress.style.width = '100%';
            if (title)    title.textContent    = storedUser ? `Welcome back, ${storedUser.name}!` : "Welcome to RouteWise!";
            if (subtitle) subtitle.textContent = "Launching RouteWise Journey Planner...";
        }, 900);

        setTimeout(async () => {
            overlay.classList.remove('active');
            await checkAuthSession();
            unlockApplication();
        }, 1400);
    } else {
        await checkAuthSession();
        unlockApplication();
    }
};

function getUserInitials(name) {
    if (!name) return 'U';
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
        return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
    }
    return words[0].charAt(0).toUpperCase();
}

// ── Dynamic Navbar Rendering (Guest vs Logged In) ────────────────
function renderAuthNavbar() {
    const authNavContainer = document.getElementById('auth-nav-container');
    if (!authNavContainer) return;

    if (currentUser) {
        const initials = getUserInitials(currentUser.name);
        const fuelUpper = (currentUser.fuelPreference || currentUser.fuel || 'CNG').toUpperCase();
        const mileage = currentUser.vehicleMileage || currentUser.mileage || 25;
        const avatarHtml = currentUser.avatar
            ? `<img src="${currentUser.avatar}" alt="Avatar" class="user-avatar-mini" style="object-fit: cover; width:34px; height:34px; border-radius:50%;">`
            : `<span class="user-avatar-mini">${initials}</span>`;

        authNavContainer.innerHTML = `
            <div class="dropdown">
                <div class="user-profile-badge dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" title="Click to view account">
                    ${avatarHtml}
                    <span class="d-none d-sm-inline fw-bold">${currentUser.name}</span>
                </div>
                <ul class="dropdown-menu dropdown-menu-end shadow-sm" style="min-width: 260px;">
                    <li>
                        <div class="px-3 py-2 border-bottom">
                            <div class="fw-bold text-dark">${currentUser.name}</div>
                            <div class="small text-muted">${currentUser.email}</div>
                            <div class="mt-1">
                                <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">${fuelUpper} (${mileage} km/unit)</span>
                                ${currentUser.role === 'admin' ? '<span class="badge bg-danger ms-1">Admin</span>' : ''}
                            </div>
                        </div>
                    </li>
                    <li>
                        <a class="dropdown-item py-2" href="#" onclick="openProfileModal()">
                            <i class="fas fa-user-cog me-2 text-primary"></i> Edit Profile & Avatar
                        </a>
                    </li>
                    <li>
                        <a class="dropdown-item py-2" href="#" onclick="openSavedRoutesModal()">
                            <i class="fas fa-bookmark me-2 text-primary"></i> My Saved Trips (<span id="saved-count-badge-menu">0</span>)
                        </a>
                    </li>
                    <li>
                        <a class="dropdown-item py-2" href="#" onclick="openSyllabusExplorerModal()">
                            <i class="fas fa-graduation-cap me-2 text-warning"></i> Syllabus Demo Hub
                        </a>
                    </li>
                    <li><hr class="dropdown-divider"></li>
                    <li>
                        <a class="dropdown-item text-danger py-2" href="#" onclick="logoutUser()">
                            <i class="fas fa-sign-out-alt me-2"></i> Log Out
                        </a>
                    </li>
                </ul>
            </div>`;
    } else {
        // Guest State
        authNavContainer.innerHTML = `
            <div class="dropdown">
                <div class="user-profile-badge dropdown-toggle guest-badge-glow" data-bs-toggle="dropdown" aria-expanded="false" title="Guest Mode Active - Click to Sign In">
                    <span class="user-avatar-mini guest-avatar-bg"><i class="fas fa-user"></i></span>
                    <span class="d-none d-sm-inline fw-bold">Guest Mode</span>
                </div>
                <ul class="dropdown-menu dropdown-menu-end shadow-sm" style="min-width: 250px;">
                    <li>
                        <h6 class="dropdown-header d-flex justify-content-between align-items-center">
                            <span><i class="fas fa-user-clock me-1 text-primary"></i> Guest Mode</span>
                            <span class="badge bg-primary-subtle text-primary border border-primary-subtle">Active</span>
                        </h6>
                    </li>
                    <li><span class="dropdown-item-text small text-muted">All route & fuel calculations free</span></li>
                    <li><hr class="dropdown-divider"></li>
                    <li>
                        <a class="dropdown-item text-primary fw-bold" href="#" onclick="showAuthGateway('signin')">
                            <i class="fas fa-sign-in-alt me-2"></i> Sign In / Register
                        </a>
                    </li>
                    <li>
                        <a class="dropdown-item" href="#" onclick="openSyllabusExplorerModal()">
                            <i class="fas fa-graduation-cap me-2 text-warning"></i> Syllabus Demo Hub
                        </a>
                    </li>
                    <li>
                        <a class="dropdown-item text-secondary small" href="#" onclick="openSavedRoutesModal()">
                            <i class="fas fa-bookmark me-2"></i> My Saved Trips
                        </a>
                    </li>
                </ul>
            </div>`;
    }
}

// ── Profile & Avatar Modal Handler ──────────────────────────────
window.openProfileModal = () => {
    if (!currentUser) return;

    let modalEl = document.getElementById('userProfileModal');
    if (!modalEl) {
        modalEl = document.createElement('div');
        modalEl.id = 'userProfileModal';
        modalEl.className = 'modal fade';
        modalEl.tabIndex = -1;
        modalEl.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow-lg" style="border-radius: 16px; overflow: hidden;">
                    <div class="modal-header bg-dark text-white border-0 py-3">
                        <h5 class="modal-title fw-bold">
                            <i class="fas fa-user-edit text-primary me-2"></i> My Profile & Vehicle Settings
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4">
                        <!-- Avatar Section -->
                        <div class="text-center mb-4">
                            <div class="position-relative d-inline-block">
                                <div id="modal-avatar-preview" class="rounded-circle d-flex align-items-center justify-content-center bg-primary text-white fw-bold shadow-sm" style="width: 80px; height: 80px; font-size: 32px; overflow: hidden; margin: 0 auto;">
                                    ${currentUser.avatar ? `<img src="${currentUser.avatar}" style="width:100%; height:100%; object-fit:cover;">` : getUserInitials(currentUser.name)}
                                </div>
                                <label for="avatar-file-input" class="btn btn-sm btn-primary rounded-circle position-absolute bottom-0 end-0 p-1 shadow" style="width: 28px; height: 28px; cursor: pointer;" title="Upload Avatar">
                                    <i class="fas fa-camera" style="font-size: 12px;"></i>
                                </label>
                                <input type="file" id="avatar-file-input" accept="image/png,image/jpeg,image/webp" style="display: none;">
                            </div>
                            <div class="small text-muted mt-2">Click camera icon to upload profile picture (PNG, JPG, max 2MB)</div>
                        </div>

                        <!-- Profile Form -->
                        <form id="profile-edit-form">
                            <div class="mb-3">
                                <label class="form-label small fw-semibold text-muted">Full Name</label>
                                <input type="text" class="form-control" id="profile-name-input" value="${currentUser.name}" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label small fw-semibold text-muted">Email Address (Read-only)</label>
                                <input type="email" class="form-control bg-light" value="${currentUser.email}" readonly>
                            </div>
                            <div class="row g-2 mb-3">
                                <div class="col-6">
                                    <label class="form-label small fw-semibold text-muted">Default Fuel</label>
                                    <select class="form-select" id="profile-fuel-input">
                                        <option value="cng" ${(currentUser.fuelPreference === 'cng' || currentUser.fuel === 'cng') ? 'selected' : ''}>CNG</option>
                                        <option value="petrol" ${(currentUser.fuelPreference === 'petrol' || currentUser.fuel === 'petrol') ? 'selected' : ''}>Petrol</option>
                                        <option value="diesel" ${(currentUser.fuelPreference === 'diesel' || currentUser.fuel === 'diesel') ? 'selected' : ''}>Diesel</option>
                                    </select>
                                </div>
                                <div class="col-6">
                                    <label class="form-label small fw-semibold text-muted">Vehicle Mileage</label>
                                    <input type="number" class="form-control" id="profile-mileage-input" value="${currentUser.vehicleMileage || currentUser.mileage || 24}" min="1" step="0.5">
                                </div>
                            </div>
                            <button type="submit" class="btn btn-primary-custom w-100 py-2">
                                <i class="fas fa-save me-2"></i> Save Profile Changes
                            </button>
                        </form>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(modalEl);

        // Avatar file upload handler
        document.getElementById('avatar-file-input')?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (file.size > 2 * 1024 * 1024) {
                showToast('File too large. Maximum size is 2MB.', 'error');
                return;
            }

            const formData = new FormData();
            formData.append('avatar', file);

            try {
                showToast('Uploading profile picture...', 'info');
                const res = await RouteWiseAPI.auth.uploadAvatar(formData);
                if (res.success) {
                    currentUser.avatar = res.avatar;
                    localStorage.setItem('routeWiseUser', JSON.stringify(currentUser));
                    const preview = document.getElementById('modal-avatar-preview');
                    if (preview) {
                        preview.innerHTML = `<img src="${res.avatar}" style="width:100%; height:100%; object-fit:cover;">`;
                    }
                    renderAuthNavbar();
                    showToast('Avatar updated successfully!', 'success');
                }
            } catch (err) {
                showToast(err.message || 'Avatar upload failed.', 'error');
            }
        });

        // Profile form submit
        document.getElementById('profile-edit-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('profile-name-input')?.value.trim();
            const fuelPreference = document.getElementById('profile-fuel-input')?.value;
            const vehicleMileage = parseFloat(document.getElementById('profile-mileage-input')?.value) || 24;

            try {
                const res = await RouteWiseAPI.auth.updateProfile({ name, fuelPreference, vehicleMileage });
                if (res.success) {
                    currentUser = { ...currentUser, ...res.user };
                    localStorage.setItem('routeWiseUser', JSON.stringify(currentUser));
                    renderAuthNavbar();
                    bootstrap.Modal.getInstance(modalEl)?.hide();
                    showToast('Profile updated successfully!', 'success');
                }
            } catch (err) {
                showToast(err.message || 'Profile update failed.', 'error');
            }
        });
    }

    new bootstrap.Modal(modalEl).show();
};

// ── Logout ────────────────────────────────────────────────────────
window.logoutUser = async () => {
    try {
        await RouteWiseAPI.auth.logout();
    } catch (e) {
        // Ignore logout errors
    }
    RouteWiseAPI.clearToken();
    localStorage.removeItem('routeWiseUser');
    currentUser = null;
    renderAuthNavbar();
    if (typeof refreshSavedRoutesForCurrentUser === 'function') {
        refreshSavedRoutesForCurrentUser();
    }
    showToast('You have been logged out. Switched to Guest Mode.', 'info');
};

// ── Application Visibility Controls ──────────────────────────────
function unlockApplication() {
    const mainApp = document.getElementById('main-app-wrapper');
    if (mainApp) mainApp.style.display = 'block';

    const authGateway = document.getElementById('auth-gateway-view');
    if (authGateway) authGateway.style.display = 'none';

    renderAuthNavbar();

    if (typeof initializeMap === 'function') {
        initializeMap();
    }
}

window.showAuthGateway = (mode = 'signin') => {
    setGatewayAuthMode(mode);
    const authGateway = document.getElementById('auth-gateway-view');
    if (authGateway) {
        authGateway.style.display = 'flex';
        authGateway.classList.add('active');
        authGateway.scrollIntoView({ behavior: 'smooth' });
    }
};

window.hideAuthGateway = () => {
    const authGateway = document.getElementById('auth-gateway-view');
    if (authGateway) {
        authGateway.style.display = 'none';
        authGateway.classList.remove('active');
    }
};

window.enterGuestMode = () => {
    currentUser = null;
    hideAuthGateway();
    unlockApplication();
    showToast('Guest Mode active: All routing and fuel calculators unlocked!', 'info');
};

window.handleGuestPromptSignIn = () => {
    const promptModalEl = document.getElementById('guestSavePromptModal');
    const modalInstance = bootstrap.Modal.getInstance(promptModalEl);
    if (modalInstance) modalInstance.hide();
    showAuthGateway('signin');
};
