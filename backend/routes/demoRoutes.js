/**
 * RouteWise Backend — Academic Syllabus Demo Routes
 * Live interactive endpoints for students and evaluators to inspect Node.js,
 * async programming, buffers, streams, and event loop internals.
 */

const express = require('express');
const router = express.Router();
const {
    getNodeInfo,
    getAsyncComparison,
    getStreamsAndBuffers,
    getEventEmitterDemo
} = require('../controllers/demoController');

router.get('/node-info', getNodeInfo);
router.get('/async-comparison', getAsyncComparison);
router.get('/streams-buffers', getStreamsAndBuffers);
router.get('/event-emitter', getEventEmitterDemo);

module.exports = router;
