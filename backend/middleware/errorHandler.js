/**
 * RouteWise Backend — Centralized Error Handling Middleware
 * Provides uniform JSON error formatting across all routes.
 * Intercepts Mongoose ValidationErrors, CastErrors, Duplicate key errors,
 * and internal server exceptions.
 */

// 404 Not Found Middleware
function notFound(req, res, next) {
    const error = new Error(`Resource not found at endpoint: ${req.method} ${req.originalUrl}`);
    res.status(404);
    next(error);
}

// Centralized Error-Handling Middleware
function errorHandler(err, req, res, next) {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message || 'An internal server error occurred';

    // Handle Mongoose Bad ObjectId (CastError)
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        statusCode = 400;
        message = `Resource not found. Invalid ID format: '${err.value}'`;
    }

    // Handle Mongoose Validation Errors
    if (err.name === 'ValidationError') {
        statusCode = 400;
        const messages = Object.values(err.errors).map(val => val.message);
        message = `Validation Failed: ${messages.join('. ')}`;
    }

    // Handle Mongoose Duplicate Key Error (E11000)
    if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue || {})[0] || 'record';
        const val = err.keyValue ? err.keyValue[field] : '';
        message = `A ${field} with value '${val}' already exists. Please use a unique value.`;
    }

    // Handle JSON Web Token Errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid authentication token signature.';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Authentication token has expired. Please sign in again.';
    }

    // Response structure
    const responsePayload = {
        success: false,
        message
    };

    // Include stack trace only in development mode for debugging
    if (process.env.NODE_ENV === 'development') {
        responsePayload.stack = err.stack;
    }

    res.status(statusCode).json(responsePayload);
}

module.exports = {
    notFound,
    errorHandler
};
