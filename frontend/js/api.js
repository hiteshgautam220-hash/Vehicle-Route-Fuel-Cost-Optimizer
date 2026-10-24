/**
 * RouteWise — Centralized Backend API Client (api.js)
 * Wraps Fetch API with base URL detection, automatic JWT Bearer token headers,
 * uniform error responses, and clean async/await methods for all endpoints.
 */

const API_BASE_URL = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
    ? '' // Relative path when served from same Express server
    : (window.location.origin || '');

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
