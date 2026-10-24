/**
 * RouteWise Backend — Authentication & Authorization Middleware
 * Demonstrates JWT verification, Bearer token extraction, user attachment,
 * and Role-Based Access Control (RBAC).
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isDbConnected } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'routewise_secure_academic_jwt_secret_key_2026';

// Helper to get fallback memory user
function getFallbackUser(id) {
    try {
        const { getMemoryUsers } = require('../controllers/authController');
        return getMemoryUsers().find(u => String(u._id) === String(id));
    } catch (e) {
        return null;
    }
}

/**
 * Protect middleware: Ensures the request contains a valid JWT.
 * Rejects with 401 if missing, invalid, or expired.
 */
async function protect(req, res, next) {
    let token = null;

    // Check Authorization header for Bearer token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. Please log in with a valid authentication token.'
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        let user = null;
        if (isDbConnected()) {
            user = await User.findById(decoded.id);
        } else {
            user = getFallbackUser(decoded.id);
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User belonging to this token no longer exists.'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Your authentication session has expired. Please log in again.'
            });
        }
        return res.status(401).json({
            success: false,
            message: 'Invalid authentication token.'
        });
    }
}

/**
 * Optional Auth middleware:
 * If a token is provided, authenticates the user; if not, allows the request to continue as guest.
 */
async function optionalAuth(req, res, next) {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        let user = null;
        if (isDbConnected()) {
            user = await User.findById(decoded.id);
        } else {
            user = getFallbackUser(decoded.id);
        }
        req.user = user || null;
    } catch (e) {
        req.user = null;
    }
    next();
}

/**
 * Role authorization middleware:
 * Restricts access to specific user roles (e.g., 'admin', 'fleet_manager').
 */
function authorize(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required for this operation.'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Forbidden: User role '${req.user.role}' is not authorized to access this resource.`
            });
        }

        next();
    };
}

module.exports = {
    protect,
    optionalAuth,
    authorize,
    JWT_SECRET
};
