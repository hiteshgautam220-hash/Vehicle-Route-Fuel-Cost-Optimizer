/**
 * RouteWise Backend — Database Connection Configuration
 * Demonstrates Mongoose connection, MongoDB Atlas support via environment variables,
 * connection lifecycle events, and graceful error handling.
 */

const mongoose = require('mongoose');

let isConnected = false;

/**
 * Connects to MongoDB using Mongoose.
 * Supports MongoDB Atlas or local MongoDB URI specified in process.env.MONGODB_URI.
 */
async function connectDB(uriOverride = null) {
    const mongoUri = uriOverride || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/routewise';

    try {
        mongoose.set('strictQuery', false);

        // Connection event listeners
        mongoose.connection.on('connected', () => {
            isConnected = true;
            console.log(`[MongoDB] Successfully connected to database: ${mongoose.connection.name}`);
        });

        mongoose.connection.on('error', (err) => {
            isConnected = false;
            console.error(`[MongoDB] Connection error: ${err.message}`);
        });

        mongoose.connection.on('disconnected', () => {
            isConnected = false;
            console.warn('[MongoDB] Connection disconnected');
        });

        const conn = await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000, // Fail fast (5s) instead of hanging indefinitely if unreachable
        });

        isConnected = true;
        console.log(`[MongoDB] Connected host: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        isConnected = false;
        console.warn(`[MongoDB Warning] Could not connect to MongoDB at ${mongoUri}.`);
        console.warn(`[MongoDB Warning] Cause: ${error.message}`);
        console.warn('[MongoDB Notice] Server will continue running in fallback mode. To enable persistent database features, configure a valid MONGODB_URI in your .env file or start MongoDB locally.');
        return null;
    }
}

/**
 * Returns current MongoDB connection status.
 */
function isDbConnected() {
    return isConnected && mongoose.connection.readyState === 1;
}

module.exports = {
    connectDB,
    isDbConnected,
    mongoose
};
