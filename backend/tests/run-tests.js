/**
 * RouteWise Backend — Automated API & Integration Test Suite
 * Executes end-to-end testing against all Express REST endpoints,
 * validating status codes, input validations, JWT authentication,
 * protected routes, CRUD operations, and error formats.
 */

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');

// Colors for terminal output
const green = '\x1b[32m';
const red = '\x1b[31m';
const cyan = '\x1b[36m';
const yellow = '\x1b[33m';
const reset = '\x1b[0m';

let passedCount = 0;
let failedCount = 0;
const testResults = [];

function assert(condition, testName, details = '') {
    if (condition) {
        passedCount++;
        console.log(`  ${green}✔${reset} ${testName}`);
        testResults.push({ name: testName, status: 'PASSED', details });
    } else {
        failedCount++;
        console.log(`  ${red}✖${reset} ${testName} ${details ? '(' + details + ')' : ''}`);
        testResults.push({ name: testName, status: 'FAILED', details });
    }
}

async function runTests() {
    console.log(`\n${cyan}====================================================${reset}`);
    console.log(`${cyan}      RouteWise Automated REST API Test Suite       ${reset}`);
    console.log(`${cyan}====================================================${reset}\n`);

    const randomSuffix = Math.floor(Math.random() * 100000);
    const testUser = {
        name: 'Test Student',
        email: `student_${randomSuffix}@routewise.test`,
        password: 'password123',
        fuelPreference: 'cng',
        vehicleMileage: 26
    };

    let authToken = null;
    let createdTripId = null;

    try {
        // ----------------------------------------------------
        // 1. Health & System Status Tests
        // ----------------------------------------------------
        console.log(`${yellow}1. Health & System Status Endpoints:${reset}`);
        const healthRes = await request(app).get('/api/health');
        assert(healthRes.status === 200, 'GET /api/health returns 200 OK');
        assert(healthRes.body.success === true, 'GET /api/health body.success is true');
        assert(Array.isArray(healthRes.body.syllabusTopics), 'GET /api/health exposes syllabus topics array');

        // ----------------------------------------------------
        // 2. Academic Syllabus Demo Endpoints
        // ----------------------------------------------------
        console.log(`\n${yellow}2. Academic Syllabus Demonstrations:${reset}`);
        const nodeInfoRes = await request(app).get('/api/demo/node-info');
        assert(nodeInfoRes.status === 200, 'GET /api/demo/node-info returns 200 OK');
        assert(nodeInfoRes.body.v8Version !== undefined, 'Node info includes V8 engine version');
        assert(nodeInfoRes.body.memoryUsage && nodeInfoRes.body.memoryUsage.heapUsedMB > 0, 'Node info includes V8 heap memory stats');
        assert(Array.isArray(nodeInfoRes.body.eventLoopExplanation.phases), 'Node info explains Event Loop 6 phases');

        const asyncRes = await request(app).get('/api/demo/async-comparison');
        assert(asyncRes.status === 200, 'GET /api/demo/async-comparison returns 200 OK');
        assert(asyncRes.body.steps && asyncRes.body.steps.length === 3, 'Async demo compares Callbacks, Promises, and Async/Await');

        const streamRes = await request(app).get('/api/demo/streams-buffers');
        assert(streamRes.status === 200, 'GET /api/demo/streams-buffers returns 200 OK');
        assert(streamRes.body.bufferDemo.isMatch === true, 'Buffer encoding/decoding verification passes');
        assert(streamRes.body.streamDemo.chunksProcessed > 0, 'Stream chunk processing succeeds');

        const eventRes = await request(app).get('/api/demo/event-emitter');
        assert(eventRes.status === 200, 'GET /api/demo/event-emitter returns 200 OK');
        assert(eventRes.body.eventCaptured === true, 'EventEmitter custom event caught by listener');

        // ----------------------------------------------------
        // 3. Indian Cities GIS Endpoints
        // ----------------------------------------------------
        console.log(`\n${yellow}3. Indian Cities GIS Endpoints:${reset}`);
        const citiesRes = await request(app).get('/api/cities?q=delhi&limit=5');
        assert(citiesRes.status === 200, 'GET /api/cities?q=delhi returns 200 OK');
        assert(Array.isArray(citiesRes.body.cities) && citiesRes.body.cities.length > 0, 'Cities search returns matching results');
        assert(citiesRes.body.cities.some(c => c.name.toLowerCase().includes('delhi')), 'Search result contains "Delhi"');

        const cityStatsRes = await request(app).get('/api/cities/stats');
        assert(cityStatsRes.status === 200, 'GET /api/cities/stats returns 200 OK');
        assert(cityStatsRes.body.totalCities > 0, `Total cities indexed: ${cityStatsRes.body.totalCities}`);

        // ----------------------------------------------------
        // 4. Fuel Rates Endpoints
        // ----------------------------------------------------
        console.log(`\n${yellow}4. City Fuel Rates Endpoints:${reset}`);
        const ratesRes = await request(app).get('/api/fuel-rates');
        assert(ratesRes.status === 200, 'GET /api/fuel-rates returns 200 OK');
        assert(Array.isArray(ratesRes.body.rates) && ratesRes.body.rates.length >= 10, 'Returns 10+ metro city fuel rates');

        const mumbaiRateRes = await request(app).get('/api/fuel-rates/mumbai');
        assert(mumbaiRateRes.status === 200, 'GET /api/fuel-rates/mumbai returns 200 OK');
        assert(mumbaiRateRes.body.rate.petrol > 0, `Mumbai Petrol rate: ₹${mumbaiRateRes.body.rate.petrol}`);

        // ----------------------------------------------------
        // 5. Route & Multi-Fuel Calculation API
        // ----------------------------------------------------
        console.log(`\n${yellow}5. Route & Multi-Fuel Calculation API:${reset}`);
        const invalidCalcRes = await request(app).post('/api/routes/calculate').send({ waypoints: [] });
        assert(invalidCalcRes.status === 400, 'POST /api/routes/calculate rejects empty waypoints with 400');

        const calcRes = await request(app)
            .post('/api/routes/calculate')
            .send({
                waypoints: [
                    { name: 'Delhi', lat: 28.6139, lng: 77.2090 },
                    { name: 'Jaipur', lat: 26.9124, lng: 75.7873 }
                ],
                fuelType: 'cng',
                fuelEfficiency: 25,
                fuelPrice: 75.09
            });
        assert(calcRes.status === 200, 'POST /api/routes/calculate returns 200 OK for Delhi ➔ Jaipur');
        assert(calcRes.body.data.distanceKm > 100, `Calculated road distance: ${calcRes.body.data.distanceKm} km`);
        assert(calcRes.body.data.totalCost > 0, `CNG total cost: ₹${calcRes.body.data.totalCost}`);
        assert(calcRes.body.data.comparison.savingsVsPetrol > 0, `CNG savings vs Petrol: ₹${calcRes.body.data.comparison.savingsVsPetrol}`);

        // ----------------------------------------------------
        // 6. User Authentication & Authorization APIs
        // ----------------------------------------------------
        console.log(`\n${yellow}6. Authentication & Authorization APIs:${reset}`);
        const missingFieldsRes = await request(app).post('/api/auth/register').send({});
        assert(missingFieldsRes.status === 400, 'POST /api/auth/register rejects missing fields with 400');

        const shortPwRes = await request(app).post('/api/auth/register').send({
            name: testUser.name,
            email: testUser.email,
            password: '123'
        });
        assert(shortPwRes.status === 400, 'POST /api/auth/register rejects password shorter than 6 chars');

        const registerRes = await request(app).post('/api/auth/register').send(testUser);
        assert(registerRes.status === 201, 'POST /api/auth/register registers user with 201 Created');
        assert(registerRes.body.token !== undefined, 'Registration returns signed JWT token');
        assert(registerRes.body.user.password === undefined, 'Password hash is NEVER exposed in API response');
        authToken = registerRes.body.token;

        const dupRes = await request(app).post('/api/auth/register').send(testUser);
        assert(dupRes.status === 409, 'POST /api/auth/register rejects duplicate email with 409 Conflict');

        const wrongPwRes = await request(app).post('/api/auth/login').send({
            email: testUser.email,
            password: 'wrongpassword'
        });
        assert(wrongPwRes.status === 401, 'POST /api/auth/login rejects incorrect password with 401');

        const loginRes = await request(app).post('/api/auth/login').send({
            email: testUser.email,
            password: testUser.password
        });
        assert(loginRes.status === 200, 'POST /api/auth/login succeeds with 200 OK');
        assert(loginRes.body.token !== undefined, 'Login returns valid JWT token');

        // Test Protected /api/auth/me
        const unauthMeRes = await request(app).get('/api/auth/me');
        assert(unauthMeRes.status === 401, 'GET /api/auth/me rejects unauthenticated request with 401');

        const authMeRes = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${authToken}`);
        assert(authMeRes.status === 200, 'GET /api/auth/me succeeds with valid Bearer token');
        assert(authMeRes.body.user.email === testUser.email, 'Current user email matches authenticated identity');

        // ----------------------------------------------------
        // 7. Trips CRUD APIs (Protected)
        // ----------------------------------------------------
        console.log(`\n${yellow}7. Trips CRUD Operations (Protected):${reset}`);
        const unauthTripsRes = await request(app).get('/api/trips');
        assert(unauthTripsRes.status === 401, 'GET /api/trips without token returns 401 Unauthorized');

        const createTripRes = await request(app)
            .post('/api/trips')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                title: 'Delhi to Jaipur Golden Triangle',
                origin: { name: 'Delhi', lat: 28.6139, lng: 77.2090 },
                destination: { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
                stops: [{ name: 'Agra', lat: 27.1767, lng: 78.0081 }],
                distanceKm: 280,
                durationMinutes: 270,
                fuelType: 'cng',
                fuelEfficiency: 25,
                fuelPrice: 75.09,
                totalCost: 841.01,
                notes: 'Academic test trip'
            });
        assert(createTripRes.status === 201, 'POST /api/trips creates new trip with 201 Created');
        assert(createTripRes.body.trip && createTripRes.body.trip._id, 'Trip was assigned an ID');
        createdTripId = createTripRes.body.trip._id;

        const getTripsRes = await request(app)
            .get('/api/trips')
            .set('Authorization', `Bearer ${authToken}`);
        assert(getTripsRes.status === 200, 'GET /api/trips returns 200 OK');
        assert(getTripsRes.body.trips.length >= 1, 'GET /api/trips contains created trip');

        const getSingleTripRes = await request(app)
            .get(`/api/trips/${createdTripId}`)
            .set('Authorization', `Bearer ${authToken}`);
        assert(getSingleTripRes.status === 200, `GET /api/trips/${createdTripId} returns single trip with 200 OK`);
        assert(getSingleTripRes.body.trip.title === 'Delhi to Jaipur Golden Triangle', 'Trip title verified');

        const updateTripRes = await request(app)
            .put(`/api/trips/${createdTripId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({ notes: 'Updated notes from test suite' });
        assert(updateTripRes.status === 200, `PUT /api/trips/${createdTripId} updates trip notes with 200 OK`);

        const deleteTripRes = await request(app)
            .delete(`/api/trips/${createdTripId}`)
            .set('Authorization', `Bearer ${authToken}`);
        assert(deleteTripRes.status === 200, `DELETE /api/trips/${createdTripId} removes trip with 200 OK`);

        // ----------------------------------------------------
        // 8. Community Feedback API
        // ----------------------------------------------------
        console.log(`\n${yellow}8. Community Feedback API:${reset}`);
        const feedbackMissing = await request(app).post('/api/feedback').send({});
        assert(feedbackMissing.status === 400, 'POST /api/feedback rejects empty payload with 400');

        const feedbackRes = await request(app)
            .post('/api/feedback')
            .send({
                name: 'Anil Mehta',
                email: 'anil@example.com',
                topic: '✨ Feature Suggestion',
                subject: 'Add EV charging cost comparison',
                message: 'It would be great to also compare EV kWh electricity cost per km alongside CNG!'
            });
        assert(feedbackRes.status === 201, 'POST /api/feedback submits feedback with 201 Created');
        assert(feedbackRes.body.feedbackId !== undefined, 'Feedback returned tracking ID');

        // ----------------------------------------------------
        // 9. Error Handling & 404 Route Tests
        // ----------------------------------------------------
        console.log(`\n${yellow}9. Centralized Error & 404 Route Tests:${reset}`);
        const notFoundRes = await request(app).get('/api/non-existent-endpoint-xyz');
        assert(notFoundRes.status === 404, 'GET /api/non-existent-endpoint-xyz returns 404');
        assert(notFoundRes.body.success === false, '404 returns uniform { success: false, message } JSON error');

    } catch (err) {
        console.error(`${red}[Test Runner Exception]${reset}`, err);
        failedCount++;
    }

    // Summary
    console.log(`\n${cyan}====================================================${reset}`);
    console.log(`Test Execution Summary:`);
    console.log(`  Passed: ${green}${passedCount}${reset}`);
    console.log(`  Failed: ${failedCount > 0 ? red : green}${failedCount}${reset}`);
    console.log(`  Total:  ${passedCount + failedCount}`);
    console.log(`${cyan}====================================================${reset}\n`);

    if (failedCount > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

if (require.main === module) {
    runTests();
}

module.exports = { runTests };
