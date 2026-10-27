/**
 * RouteWise — Centralized Backend API Client (api.js)
 * Wraps Fetch API with base URL detection, automatic JWT Bearer token headers,
 * uniform error responses, and clean async/await methods for all endpoints.
 */

// ============================================================================
// EVALUATION 2 CONFIGURATION: Deployed Backend API Integration (Guideline 5)
// ============================================================================
// When your backend is deployed (e.g., on Render or Railway), paste your live
// deployed backend URL below (without trailing slash):
// Example: const DEPLOYED_BACKEND_URL = 'https://vehicle-route-fuel-cost-optimizer.onrender.com';
// Leave empty ('') when running both frontend & backend locally on localhost:5000.
const DEPLOYED_BACKEND_URL = 'https://vehicle-route-fuel-cost-optimizer.onrender.com';

const API_BASE_URL = (() => {
    // 1. If running on local Express server on port 5000: use relative path
    if (window.location.port === '5000') {
        return '';
    }
    // 2. If running locally via Live Server (port 5500/3000) or opened via file://
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') {
        return DEPLOYED_BACKEND_URL || 'http://localhost:5000';
    }
    // 3. If running on GitHub Pages / Vercel with deployed backend
    if (DEPLOYED_BACKEND_URL) {
        return DEPLOYED_BACKEND_URL.replace(/\/+$/, '');
    }
    // 4. Default: served by full-stack Express server on cloud provider
    return window.location.origin || '';
})();

// Expose globally for utility scripts
window.API_BASE_URL = API_BASE_URL;
window.DEPLOYED_BACKEND_URL = DEPLOYED_BACKEND_URL;

class ApiClient {
    constructor() {
        this.tokenKey = 'routeWiseToken';
    }

    getToken() {
        return localStorage.getItem(this.tokenKey) || null;
    }

    setToken(token) {
        if (token) {
            localStorage.setItem(this.tokenKey, token);
        } else {
            localStorage.removeItem(this.tokenKey);
        }
    }

    clearToken() {
        localStorage.removeItem(this.tokenKey);
    }

    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const headers = options.headers || {};

        const token = this.getToken();
        if (token && !headers['Authorization']) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Only set Content-Type to JSON if not uploading FormData
        if (!(options.body instanceof FormData) && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                // If token expired, clear token and notify
                if (response.status === 401 && token) {
                    this.clearToken();
                }
                const error = new Error(data.message || `HTTP ${response.status}: Request failed`);
                error.status = response.status;
                error.data = data;
                throw error;
            }

            return data;
        } catch (err) {
            if (!err.status) {
                // Network failure or backend unreachable
                err.isNetworkError = true;
                err.message = 'Unable to connect to the Node.js backend server. Please verify the server is running.';
            }
            throw err;
        }
    }

    get(endpoint, headers = {}) {
        return this.request(endpoint, { method: 'GET', headers });
    }

    post(endpoint, body = {}, headers = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: body instanceof FormData ? body : JSON.stringify(body),
            headers
        });
    }

    put(endpoint, body = {}, headers = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: body instanceof FormData ? body : JSON.stringify(body),
            headers
        });
    }

    delete(endpoint, headers = {}) {
        return this.request(endpoint, { method: 'DELETE', headers });
    }
}

const apiClient = new ApiClient();

// High-level API Modules
const RouteWiseAPI = {
    // Health & System Status
    health: () => apiClient.get('/api/health'),

    // Auth Module
    auth: {
        register: (userData) => apiClient.post('/api/auth/register', userData),
        login: (credentials) => apiClient.post('/api/auth/login', credentials),
        logout: () => apiClient.post('/api/auth/logout'),
        getMe: () => apiClient.get('/api/auth/me'),
        updateProfile: (profileData) => apiClient.put('/api/auth/profile', profileData),
        uploadAvatar: (formData) => apiClient.post('/api/auth/avatar', formData)
    },

    // Trips Module (Saved Bookmarks CRUD)
    trips: {
        getAll: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return apiClient.get(`/api/trips${query ? '?' + query : ''}`);
        },
        getById: (id) => apiClient.get(`/api/trips/${id}`),
        create: (tripData) => apiClient.post('/api/trips', tripData),
        update: (id, updates) => apiClient.put(`/api/trips/${id}`, updates),
        delete: (id) => apiClient.delete(`/api/trips/${id}`),
        uploadAttachment: (id, formData) => apiClient.post(`/api/trips/${id}/attachment`, formData)
    },

    // City Fuel Rates Module
    fuelRates: {
        getAll: (search = '') => {
            const query = search ? `?search=${encodeURIComponent(search)}` : '';
            return apiClient.get(`/api/fuel-rates${query}`);
        },
        getCity: (city) => apiClient.get(`/api/fuel-rates/${encodeURIComponent(city)}`),
        update: (rateData) => apiClient.post('/api/fuel-rates', rateData)
    },

    // Indian Cities GIS Module
    cities: {
        search: (q, limit = 50) => {
            const query = `?q=${encodeURIComponent(q || '')}&limit=${limit}`;
            return apiClient.get(`/api/cities${query}`);
        },
        getStats: () => apiClient.get('/api/cities/stats')
    },

    // Route & Multi-Fuel Calculation Engine
    routes: {
        calculate: (payload) => apiClient.post('/api/routes/calculate', payload)
    },

    // Feedback & Community Module
    feedback: {
        submit: (feedbackData) => apiClient.post('/api/feedback', feedbackData),
        getAll: () => apiClient.get('/api/feedback')
    },

    // Academic Syllabus Demo Endpoints
    demo: {
        getNodeInfo: () => apiClient.get('/api/demo/node-info'),
        getAsyncComparison: () => apiClient.get('/api/demo/async-comparison'),
        getStreamsBuffers: () => apiClient.get('/api/demo/streams-buffers'),
        getEventEmitter: () => apiClient.get('/api/demo/event-emitter')
    },

    // Token helpers
    setToken: (t) => apiClient.setToken(t),
    getToken: () => apiClient.getToken(),
    clearToken: () => apiClient.clearToken()
};

window.RouteWiseAPI = RouteWiseAPI;
