/**
 * RouteWise Backend — Express Application Setup
 * Configures middleware, static file serving, CORS, REST routes,
 * health status, and centralized error handling.
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { isDbConnected } = require('./config/db');

// Route handlers
const authRoutes = require('./routes/authRoutes');
const tripRoutes = require('./routes/tripRoutes');
const fuelRateRoutes = require('./routes/fuelRateRoutes');
const cityRoutes = require('./routes/cityRoutes');
const routeRoutes = require('./routes/routeRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const demoRoutes = require('./routes/demoRoutes');

const app = express();

// 1. CORS Middleware
app.use(cors({
    origin: '*',
    credentials: true
}));

// 2. Request Body Parsing Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3. Static Files Serving
// Uploaded files directory
const uploadsDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Frontend static assets
const frontendDir = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendDir));

// 4. API Health & System Status Endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        service: 'RouteWise Vehicle Route & Multi-Fuel Cost Optimizer API',
        version: '2.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptimeSeconds: Math.round(process.uptime()),
        database: {
            connected: isDbConnected(),
            provider: 'MongoDB via Mongoose',
            status: isDbConnected() ? 'Online' : 'Fallback (In-Memory / Degraded)'
        },
        syllabusTopics: [
            'Asynchronous JavaScript (Promises, Async/Await)',
            'Node.js Runtime & V8 Engine Concepts',
            'EventEmitter, Streams, Buffers, File System (fs)',
            'Express REST API & CRUD Operations',
            'JWT Authentication & bcrypt Password Hashing',
            'Mongoose Models, Schema Validation & populate()',
            'Multer Safe File Uploads'
        ]
    });
});

// 5. API Routes Registration
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/fuel-rates', fuelRateRoutes);
app.use('/api/cities', cityRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/demo', demoRoutes);

// 6. Serve Frontend index.html for Root and Non-API Single-Page Routing
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
        return next();
    }
    res.sendFile(path.join(frontendDir, 'index.html'));
});

// 7. 404 & Centralized Error Handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;
