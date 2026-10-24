/**
 * RouteWise Backend — HTTP Server Entrypoint
 * Loads environment variables, starts Express HTTP server with non-blocking I/O,
 * establishes MongoDB connection asynchronously, and seeds initial data.
 */

const path = require('path');
const dotenv = require('dotenv');

// Load environment configuration
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = require('./app');
const { connectDB, isDbConnected } = require('./config/db');
const { seedDatabase } = require('./utils/seed');

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

async function startServer() {
    console.log('====================================================');
    console.log('   RouteWise - Vehicle Route & Fuel Cost Optimizer  ');
    console.log('      Full-Stack Node.js & Express Application      ');
    console.log('====================================================');

    // 1. Start Express HTTP server immediately (Non-blocking I/O)
    const server = app.listen(PORT, () => {
        console.log(`[Server] Express server running in ${NODE_ENV} mode on http://localhost:${PORT}`);
        console.log(`[Server] Web Application: http://localhost:${PORT}`);
        console.log(`[Server] API Health Check: http://localhost:${PORT}/api/health`);
        console.log(`[Server] Academic Syllabus Demo: http://localhost:${PORT}/api/demo/node-info`);
    });

    // 2. Connect to MongoDB in the background without blocking server startup
    connectDB()
        .then(async () => {
            if (isDbConnected()) {
                await seedDatabase(false);
            }
        })
        .catch((err) => {
            console.warn('[MongoDB Notice] Running in resilient fallback mode:', err.message);
        });

    // Handle Unhandled Promise Rejections
    process.on('unhandledRejection', (err) => {
        console.error(`[UnhandledRejection Error] ${err.message}`);
    });

    // Handle Uncaught Exceptions
    process.on('uncaughtException', (err) => {
        console.error(`[UncaughtException Error] ${err.message}`);
    });

    return server;
}

if (require.main === module) {
    startServer();
}

module.exports = { startServer };
