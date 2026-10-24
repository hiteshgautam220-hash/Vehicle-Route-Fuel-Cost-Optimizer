/**
 * RouteWise Backend — Application Event Emitter
 * Demonstrates Node.js EventEmitter core concept for decoupled,
 * asynchronous domain event notifications.
 */

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

class AppEventEmitter extends EventEmitter {}

const appEvents = new AppEventEmitter();

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
    try {
        fs.mkdirSync(logsDir, { recursive: true });
    } catch (e) {
        // Ignore if directory already exists
    }
}
const auditLogPath = path.join(logsDir, 'audit.log');

/**
 * Append audit event asynchronously using Node.js fs.appendFile
 */
function logAuditEvent(eventType, payload) {
    const entry = JSON.stringify({
        timestamp: new Date().toISOString(),
        eventType,
        payload
    }) + '\n';

    fs.appendFile(auditLogPath, entry, (err) => {
        if (err) {
            console.error('[EventEmitter Logger Error]', err.message);
        }
    });
}

// Register listeners for application events
appEvents.on('user:registered', (data) => {
    console.log(`[Event: user:registered] New user registered: ${data.email} (${data.name})`);
    logAuditEvent('USER_REGISTERED', { id: data.id, email: data.email });
});

appEvents.on('user:login', (data) => {
    console.log(`[Event: user:login] User logged in: ${data.email}`);
    logAuditEvent('USER_LOGIN', { id: data.id, email: data.email });
});

appEvents.on('trip:saved', (data) => {
    console.log(`[Event: trip:saved] Trip saved: "${data.title}" by user: ${data.userId} (${data.distanceKm} km, ₹${data.totalCost})`);
    logAuditEvent('TRIP_SAVED', { tripId: data.tripId, userId: data.userId, title: data.title });
});

appEvents.on('feedback:received', (data) => {
    console.log(`[Event: feedback:received] Feedback received from: ${data.name} <${data.email}> [${data.topic}]`);
    logAuditEvent('FEEDBACK_RECEIVED', { email: data.email, topic: data.topic, subject: data.subject });
});

appEvents.on('demo:ping', (data) => {
    console.log(`[Event: demo:ping] Demo event fired:`, data);
});

module.exports = appEvents;
