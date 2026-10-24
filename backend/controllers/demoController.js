/**
 * RouteWise Backend — Academic Syllabus Demonstration Controller
 * Dedicated endpoints demonstrating:
 * 1. Node.js runtime, V8 engine concepts, global objects, process, memory.
 * 2. Asynchronous programming: Callbacks vs Promises vs Async/Await.
 * 3. Node.js Buffers & Streams.
 * 4. EventEmitter live dispatch.
 * 5. Event Loop & non-blocking I/O concepts.
 */

const fs = require('fs');
const path = require('path');
const appEvents = require('../utils/appEvents');

// 1. Node.js Runtime & V8 Engine Concepts
function getNodeInfo(req, res) {
    const memory = process.memoryUsage();

    res.status(200).json({
        success: true,
        topic: 'Node.js Runtime, V8 Engine & Process Globals',
        nodeVersion: process.version,
        v8Version: process.versions.v8,
        platform: process.platform,
        arch: process.arch,
        processId: process.pid,
        uptimeSeconds: Math.round(process.uptime()),
        memoryUsage: {
            rssMB: Math.round((memory.rss / (1024 * 1024)) * 100) / 100,
            heapTotalMB: Math.round((memory.heapTotal / (1024 * 1024)) * 100) / 100,
            heapUsedMB: Math.round((memory.heapUsed / (1024 * 1024)) * 100) / 100,
            externalMB: Math.round((memory.external / (1024 * 1024)) * 100) / 100
        },
        eventLoopExplanation: {
            phases: [
                '1. Timers (setTimeout, setInterval)',
                '2. Pending Callbacks (I/O callbacks deferred to next loop iteration)',
                '3. Idle, Prepare (internal Node.js use only)',
                '4. Poll (retrieve new I/O events, execute I/O callbacks)',
                '5. Check (setImmediate callbacks)',
                '6. Close Callbacks (e.g. socket.on("close"))'
            ],
            microtasks: 'process.nextTick() and Promise microtasks run between each phase.'
        }
    });
}

// 2. Asynchronous JavaScript Comparison: Callbacks vs Promises vs Async/Await
function getAsyncComparison(req, res) {
    const startTime = Date.now();

    // Helper 1: Callback pattern
    function computeWithCallback(val, cb) {
        setTimeout(() => cb(null, val * 2), 20);
    }

    // Helper 2: Promise pattern
    function computeWithPromise(val) {
        return new Promise((resolve) => {
            setTimeout(() => resolve(val + 10), 20);
        });
    }

    // Demonstrate callback invocation
    computeWithCallback(5, (err, callbackResult) => {
        if (err) return res.status(500).json({ success: false, error: err.message });

        // Demonstrate Promise chaining
        computeWithPromise(callbackResult)
            .then(async (promiseResult) => {
                // Demonstrate modern Async/Await pattern
                const asyncFunction = async (num) => {
                    await new Promise(r => setTimeout(r, 10));
                    return num * 3;
                };

                const asyncResult = await asyncFunction(promiseResult);
                const elapsedMs = Date.now() - startTime;

                res.status(200).json({
                    success: true,
                    topic: 'Asynchronous JavaScript: Callbacks, Promises & Async/Await',
                    steps: [
                        { step: 1, pattern: 'Callback', input: 5, calculation: '5 * 2', output: callbackResult },
                        { step: 2, pattern: 'Promise Chain', input: callbackResult, calculation: `${callbackResult} + 10`, output: promiseResult },
                        { step: 3, pattern: 'Async/Await', input: promiseResult, calculation: `${promiseResult} * 3`, output: asyncResult }
                    ],
                    finalResult: asyncResult,
                    elapsedMs,
                    takeaway: 'Async/await provides clean, synchronous-looking asynchronous code while preventing callback hell.'
                });
            })
            .catch(err => {
                res.status(500).json({ success: false, error: err.message });
            });
    });
}

// 3. Node.js Buffers & Streams Demo
function getStreamsAndBuffers(req, res) {
    // 1. Buffer manipulation
    const text = 'RouteWise Multi-Fuel Intelligence & TSP Road Routing 2026';
    const buffer = Buffer.from(text, 'utf-8');
    const base64Encoded = buffer.toString('base64');
    const decodedFromBase64 = Buffer.from(base64Encoded, 'base64').toString('utf-8');

    // 2. Stream chunk reading demonstration
    const sampleFilePath = path.join(__dirname, '..', 'models', 'Trip.js');
    let streamChunksCount = 0;
    let streamBytesRead = 0;

    const readStream = fs.createReadStream(sampleFilePath, { highWaterMark: 256 }); // 256 bytes per chunk for demonstration

    readStream.on('data', (chunk) => {
        streamChunksCount++;
        streamBytesRead += chunk.length;
    });

    readStream.on('end', () => {
        res.status(200).json({
            success: true,
            topic: 'Node.js Buffers & Streams',
            bufferDemo: {
                originalText: text,
                bufferLengthBytes: buffer.length,
                base64Representation: base64Encoded,
                decodedTextVerification: decodedFromBase64,
                isMatch: text === decodedFromBase64
            },
            streamDemo: {
                targetFile: 'models/Trip.js',
                highWaterMark: '256 bytes per chunk',
                chunksProcessed: streamChunksCount,
                totalBytesRead: streamBytesRead,
                streamAdvantage: 'Streams process large files piece-by-piece in chunks without exhausting system RAM.'
            }
        });
    });

    readStream.on('error', (err) => {
        res.status(500).json({ success: false, error: err.message });
    });
}

// 4. Node.js EventEmitter Demo
function getEventEmitterDemo(req, res) {
    const trace = [];

    const testListener = (payload) => {
        trace.push({
            eventReceivedAt: new Date().toISOString(),
            data: payload
        });
    };

    appEvents.once('demo:ping', testListener);

    appEvents.emit('demo:ping', {
        source: 'GET /api/demo/event-emitter',
        message: 'EventEmitter event successfully dispatched and handled asynchronously!',
        timestamp: Date.now()
    });

    res.status(200).json({
        success: true,
        topic: 'Node.js EventEmitter Pattern',
        eventDispatched: 'demo:ping',
        eventCaptured: trace.length > 0,
        listenerTrace: trace,
        explanation: 'EventEmitter enables decoupled, pub-sub architectures inside the Node.js runtime for notifications, audits, and workflows.'
    });
}

module.exports = {
    getNodeInfo,
    getAsyncComparison,
    getStreamsAndBuffers,
    getEventEmitterDemo
};
