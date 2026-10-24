# RouteWise — Academic Syllabus Topic Mapping & Demonstration Guide

This document provides a comprehensive, rigorous mapping between every topic in the **Academic JavaScript, Node.js, Express.js, MongoDB, and Full-Stack Web Development Syllabus** and its concrete implementation in the **RouteWise** project.

---

## Quick Navigation Matrix

| Topic Area | Primary Implementation Files | Live Verification Endpoint / Command |
| :--- | :--- | :--- |
| **1. Asynchronous JavaScript** | `frontend/js/api.js`, `backend/controllers/demoController.js` | `GET /api/demo/async-comparison` |
| **2. Node.js Core & V8 Engine** | `backend/server.js`, `backend/controllers/demoController.js` | `GET /api/demo/node-info` |
| **3. Node Streams, Buffers & fs** | `backend/controllers/cityController.js`, `backend/utils/appEvents.js` | `GET /api/demo/streams-buffers` |
| **4. Node.js EventEmitter** | `backend/utils/appEvents.js`, `backend/controllers/tripController.js` | `GET /api/demo/event-emitter` |
| **5. Express.js REST Framework** | `backend/app.js`, `backend/routes/`, `backend/controllers/` | `npm test` & `GET /api/health` |
| **6. Authentication & Security** | `backend/middleware/auth.js`, `backend/controllers/authController.js` | `POST /api/auth/login`, `POST /api/auth/register` |
| **7. Multer Safe File Uploads** | `backend/middleware/upload.js`, `backend/routes/authRoutes.js` | `POST /api/auth/avatar` |
| **8. MongoDB & Mongoose ODM** | `backend/config/db.js`, `backend/models/Trip.js`, `backend/models/User.js` | `POST /api/trips`, `GET /api/trips` |

---

## Detailed Syllabus Topic Breakdown

### SECTION 1: JavaScript Asynchronous Programming

#### 1.1 Callbacks
- **Implementation File**: `backend/controllers/demoController.js` (`getAsyncComparison`), `backend/utils/appEvents.js` (`fs.appendFile`)
- **Concept**: Passing a function as an argument to execute upon completion of an asynchronous task without blocking execution.
- **Explanation**: In `getAsyncComparison`, `computeWithCallback(val, (err, result) => { ... })` illustrates the traditional Node.js error-first callback pattern (`err, result`). In `appEvents.js`, audit log writing uses asynchronous `fs.appendFile(path, entry, (err) => { ... })`.
- **How to Test**: Call `GET http://localhost:5000/api/demo/async-comparison` or run `npm test`.

#### 1.2 Promises & Promise Chaining
- **Implementation File**: `backend/controllers/demoController.js`, `backend/services/routeService.js` (`fetchOsrmRoute`)
- **Concept**: A `Promise` represents the eventual completion or failure of an asynchronous operation, avoiding nested callback pyramids through `.then()` and `.catch()` chains.
- **Explanation**: In `routeService.js`, `fetchOsrmRoute` wraps Node's low-level `http.get` in a `new Promise((resolve, reject) => { ... })`. In `demoController.js`, step 2 chains `.then()` into asynchronous steps.
- **How to Test**: Call `GET http://localhost:5000/api/demo/async-comparison` and inspect the chained step 2 result.

#### 1.3 Async/Await & try/catch Error Handling
- **Implementation File**: `backend/controllers/authController.js`, `backend/controllers/tripController.js`, `frontend/js/auth.js`, `frontend/js/saved-routes.js`
- **Concept**: Syntactic sugar over Promises enabling asynchronous code to read like synchronous code with robust `try { ... } catch (err) { next(err); }` block error interception.
- **Explanation**: All Express controllers (`register`, `login`, `createTrip`, `getTrips`) use `async (req, res, next)` with `await` on database and cryptographic functions, routing any runtime exceptions directly to Express centralized error middleware.
- **How to Test**: Call `POST http://localhost:5000/api/trips` or run `node backend/tests/run-tests.js`.

#### 1.4 Fetch API & REST API Consumption
- **Implementation File**: `frontend/js/api.js` (`ApiClient.request`)
- **Concept**: Browser-native HTTP interface to request remote resources asynchronously using Promises.
- **Explanation**: The `RouteWiseAPI` class wraps native `fetch()` to seamlessly send JSON request bodies, extract headers, and attach `Authorization: Bearer <token>` on all requests.
- **How to Test**: Open the web application at `http://localhost:5000`, open Browser DevTools Network tab, and execute any route calculation or login.

#### 1.5 JSON Handling & Form Handling
- **Implementation File**: `frontend/js/auth.js`, `frontend/js/saved-routes.js`, `backend/app.js` (`express.json()`)
- **Concept**: Serialization (`JSON.stringify()`) and deserialization (`JSON.parse()`) of JavaScript data objects for network transmission and HTML form data collection.
- **Explanation**: Form submissions (`#gateway-signin-form`, `#profile-edit-form`, `#contact-form`) intercept `submit` events with `e.preventDefault()`, extract validated values, package them into JSON, and dispatch via Fetch.
- **How to Test**: Submit the feedback form in the "About Me" tab or register a new user in the modal.

#### 1.6 localStorage Usage
- **Implementation File**: `frontend/js/api.js`, `frontend/js/utils.js`
- **Concept**: Client-side key-value web storage persisting non-sensitive user interface preferences and temporary session tokens across browser tabs.
- **Explanation**: `routeWiseTheme` persists Dark/Light theme mode, and `routeWiseToken` caches the JWT bearer token. Persistent application records (trips, users, rates) are stored authoritatively in MongoDB rather than replacing the database with localStorage.
- **How to Test**: Toggle the theme using the moon/sun icon in the navbar; refresh the page and observe the preference preserved.

---

### SECTION 2: Node.js Core Fundamentals

#### 2.1 Node.js Runtime & V8 Engine Concepts
- **Implementation File**: `backend/controllers/demoController.js` (`getNodeInfo`), `backend/server.js`
- **Concept**: Node.js is a JavaScript runtime built on Chrome's V8 engine that compiles JavaScript directly to native machine code and manages memory via heap allocation.
- **Explanation**: The endpoint `GET /api/demo/node-info` queries `process.versions.v8` and `process.memoryUsage()`, returning real-time `heapTotalMB`, `heapUsedMB`, and `rssMB`.
- **How to Test**: Navigate to `http://localhost:5000/api/demo/node-info` or click the "Syllabus Hub" button in the top navbar.

#### 2.2 Global Objects (`process`, `console`, `__dirname`, `__filename`)
- **Implementation File**: `backend/server.js`, `backend/config/db.js`, `backend/app.js`
- **Concept**: Built-in global objects available in all Node.js modules without requiring `import` or `require`.
- **Explanation**: `process.env` accesses environment variables; `process.pid` and `process.uptime()` query process lifetime; `__dirname` resolves absolute directory paths reliably across Windows and Linux.
- **How to Test**: In terminal, run `node backend/server.js` and observe startup diagnostic output.

#### 2.3 Event Loop, Call Stack & Callback Queue
- **Implementation File**: `backend/controllers/demoController.js` (`getNodeInfo`)
- **Concept**: Node's single-threaded event loop coordinates asynchronous I/O by offloading operations to the libuv thread pool and processing callbacks in phased queues (Timers, Pending I/O, Poll, Check, Close).
- **Explanation**: The `GET /api/demo/node-info` payload documents all 6 phases and explains how microtasks (`process.nextTick` and Promise resolution) run between phases.
- **How to Test**: Open `http://localhost:5000/api/demo/node-info` in browser.

#### 2.4 CommonJS Module System (`require`, `module.exports`)
- **Implementation File**: All files in `backend/`
- **Concept**: Node's foundational module specification for encapsulating code into reusable units with explicit exports.
- **Explanation**: Every controller, middleware, service, and model specifies `module.exports = { ... }` and imports dependencies cleanly with `const x = require('./...')`.
- **How to Test**: Inspect `backend/app.js` and `backend/server.js`.

#### 2.5 File System (`fs`) & Path (`path`) Modules
- **Implementation File**: `backend/controllers/cityController.js`, `backend/utils/appEvents.js`, `backend/middleware/upload.js`
- **Concept**: Built-in core modules for filesystem I/O and cross-platform path resolution.
- **Explanation**: `path.join(__dirname, '..', 'uploads')` constructs safe paths across operating systems. `fs.existsSync()` and `fs.mkdirSync()` initialize upload directories; `fs.appendFile()` writes audit logs.
- **How to Test**: View files written to `backend/logs/audit.log` when trips or feedback are created.

#### 2.6 Buffers & Streams
- **Implementation File**: `backend/controllers/demoController.js` (`getStreamsAndBuffers`), `backend/controllers/cityController.js` (`loadCitiesFromCsvStream`)
- **Concept**: Buffers handle raw binary octet streams in RAM. Streams read or write data piece-by-piece in discrete chunks (`highWaterMark`) without loading massive multi-megabyte files into memory at once.
- **Explanation**: `cityController.js` uses `fs.createReadStream('cities.csv')` coupled with Node's `readline` interface to stream and index 4,200+ Indian GIS coordinates line-by-line. `demoController.js` demonstrates Buffer allocation, byte length, and Base64 encoding.
- **How to Test**: Query `GET http://localhost:5000/api/demo/streams-buffers`.

#### 2.7 EventEmitter
- **Implementation File**: `backend/utils/appEvents.js`, `backend/controllers/authController.js`, `backend/controllers/tripController.js`
- **Concept**: Node's event-driven observer pattern facilitating decoupled communication between components.
- **Explanation**: `appEvents` extends `EventEmitter`. When a user registers or saves a trip, `appEvents.emit('user:registered', ...)` and `appEvents.emit('trip:saved', ...)` trigger asynchronous audit logging without blocking the HTTP response.
- **How to Test**: Query `GET http://localhost:5000/api/demo/event-emitter`.

#### 2.8 NPM & Environment Variables (`dotenv`)
- **Implementation File**: `package.json`, `.env.example`, `.env`, `backend/server.js`
- **Concept**: Dependency management via NPM and externalized configuration using environment variables.
- **Explanation**: Sensitive secrets (`JWT_SECRET`), ports (`PORT`), and database URLs (`MONGODB_URI`) are loaded via `dotenv.config()` without hardcoding in source code.
- **How to Test**: Inspect `.env.example` and test with custom `PORT=5001`.

---

### SECTION 3: Express.js Framework & REST APIs

#### 3.1 Express Server Setup & Request-Response Lifecycle
- **Implementation File**: `backend/app.js`, `backend/server.js`
- **Concept**: Express abstracts Node's raw `http` module into a structured middleware pipeline where requests pass sequentially through parsers, security layers, route controllers, and error handlers.
- **Explanation**: `app.js` mounts `cors()`, `express.json()`, `express.urlencoded()`, static directory serving, API routers, 404 handler, and centralized error middleware.
- **How to Test**: Start server via `npm start` and visit `http://localhost:5000/api/health`.

#### 3.2 Routing & Route Parameters (`req.params`, `req.query`, `req.body`)
- **Implementation File**: `backend/routes/`, `backend/controllers/`
- **Concept**: Mapping HTTP methods and URI paths to controller actions with extracted parameters.
- **Explanation**:
  - `req.params`: Used in `GET /api/trips/:id` and `DELETE /api/trips/:id` to identify specific records.
  - `req.query`: Used in `GET /api/cities?q=delhi&limit=10` and `GET /api/trips?page=1&limit=10` for filtering and pagination.
  - `req.body`: Parsed via `express.json()` in `POST /api/trips` and `POST /api/routes/calculate`.
- **How to Test**: Test `GET http://localhost:5000/api/cities?q=mumbai&limit=5` in browser or Postman.

#### 3.3 RESTful CRUD Operations & Status Codes
- **Implementation File**: `backend/controllers/tripController.js`, `backend/routes/tripRoutes.js`
- **Concept**: Industry-standard REST convention utilizing correct HTTP verbs and semantic status codes:
  - `GET /api/trips`: Read list (`200 OK`)
  - `GET /api/trips/:id`: Read single (`200 OK` or `404 Not Found`)
  - `POST /api/trips`: Create (`201 Created` or `400 Bad Request`)
  - `PUT /api/trips/:id`: Update (`200 OK` or `403 Forbidden`)
  - `DELETE /api/trips/:id`: Delete (`200 OK`)
- **Explanation**: Every endpoint performs real validation and updates MongoDB/memory storage rather than returning static demo stubs.
- **How to Test**: Run `npm test` to verify all CRUD assertions pass automatically.

#### 3.4 Custom & Centralized Error-Handling Middleware
- **Implementation File**: `backend/middleware/errorHandler.js`
- **Concept**: A 4-argument Express middleware `(err, req, res, next)` catching all unhandled exceptions, formatting uniform JSON errors, and preventing stack trace leakage in production.
- **Explanation**: Automatically transforms Mongoose `ValidationError` (400), `CastError` for malformed ObjectIds (400), duplicate key error `code 11000` (409), and JWT expiration (401).
- **How to Test**: Run `GET http://localhost:5000/api/trips/invalid_id_format` with an auth token; receive formatted JSON error with status 400.

#### 3.5 JWT Authentication & bcrypt Password Hashing
- **Implementation File**: `backend/controllers/authController.js`, `backend/middleware/auth.js`, `backend/models/User.js`
- **Concept**: Passwords hashed with 10 salt rounds of `bcryptjs` before storage; stateless sessions authenticated via signed JSON Web Tokens (`jwt.sign`, `jwt.verify`).
- **Explanation**: `protect` middleware extracts the Bearer token from the `Authorization` header, decodes the user payload, validates existence, and attaches `req.user`. Password hashes are never returned in responses.
- **How to Test**: Register user in RouteWise, inspect network response to verify no password hash is returned, and verify token in headers.

#### 3.6 File Uploads with Multer
- **Implementation File**: `backend/middleware/upload.js`, `backend/routes/authRoutes.js` (`/avatar`)
- **Concept**: Handling `multipart/form-data` uploads with strict file type validation (PNG, JPG, WebP), size limits (2MB), and safe unique filename generation.
- **Explanation**: `uploadAvatar` saves images to `backend/uploads/avatars/avatar-<timestamp>-<random>.png` and serves them statically at `/uploads/avatars/...`. Executable file extensions are strictly prohibited.
- **How to Test**: Click the profile icon in the navbar, select "Edit Profile & Avatar", and choose an image file to upload.

---

### SECTION 4: MongoDB & Mongoose ODM

#### 4.1 MongoDB Atlas & Local Connection
- **Implementation File**: `backend/config/db.js`
- **Concept**: Object Data Modeling (ODM) library connecting Node.js to MongoDB with connection pooling, graceful reconnects, and lifecycle events.
- **Explanation**: `connectDB()` supports standard MongoDB Atlas connection strings (`mongodb+srv://...`) and local URIs (`mongodb://127.0.0.1:27017/routewise`) with 5-second connection timeout and offline fallback mode.
- **How to Test**: Inspect `backend/config/db.js` and verify connection status at `GET /api/health`.

#### 4.2 Mongoose Schemas & Strong Validation
- **Implementation File**: `backend/models/User.js`, `backend/models/Trip.js`, `backend/models/FuelRate.js`, `backend/models/Feedback.js`
- **Concept**: Enforcing data structure, types, required fields, regular expressions, and numerical bounds at the database layer.
- **Explanation**:
  - `User`: Email regex validator, minlength password, enum roles (`user`, `fleet_manager`, `admin`).
  - `Trip`: Required waypoints, non-negative numbers, enum fuel types (`cng`, `petrol`, `diesel`).
- **How to Test**: Run `node backend/tests/run-tests.js` to observe schema validation rejecting bad payloads with 400.

#### 4.3 References & `populate()`
- **Implementation File**: `backend/models/Trip.js` (`user: { type: ObjectId, ref: 'User' }`), `backend/controllers/tripController.js`
- **Concept**: Establishing relational foreign key references between NoSQL document collections and resolving associated documents through `.populate()`.
- **Explanation**: When retrieving trips via `GET /api/trips`, Mongoose executes `.populate('user', 'name email')`, embedding the creator's username and email inside the trip document without manual joining.
- **How to Test**: View `GET /api/trips/:id` in Postman or automated test suite.

#### 4.4 Mongoose Middleware / Lifecycle Hooks
- **Implementation File**: `backend/models/User.js` (`userSchema.pre('save', ...)`)
- **Concept**: Executing logic automatically before or after document lifecycle events (e.g. `save`, `validate`, `remove`).
- **Explanation**: Before saving a user to MongoDB, `userSchema.pre('save')` checks if the password was modified and hashes it with bcrypt salt rounds automatically.
- **How to Test**: Create a user via `POST /api/auth/register` and observe that the password stored is a bcrypt hash (`$2a$10$...`).

---

## Interactive Syllabus Demonstration Hub in RouteWise UI

In addition to REST endpoints, RouteWise includes an **interactive Academic Demonstration Hub** embedded in the web interface:

1. Open `http://localhost:5000` in any web browser.
2. In the top navigation bar, click the **"Syllabus Hub"** button (or access it from the user profile dropdown).
3. Switch between tabs:
   - **Tab 1 (Node & V8)**: Click *"Run Live Server Probe"* to view live V8 memory heap stats, process uptime, and event loop phases.
   - **Tab 2 (Async JS)**: Click *"Execute Async Comparison"* to run Callbacks, Promise Chaining, and Async/Await in a single live pipeline.
   - **Tab 3 (Streams & Buffers)**: Click *"Stream File Chunks & Buffers"* to see Buffer byte encoding and streaming file chunks in action.
   - **Tab 4 (EventEmitter)**: Click *"Dispatch Custom Event"* to emit domain events and inspect the asynchronous listener timeline.
   - **Tab 5 (REST & MongoDB)**: Review the active REST endpoint catalog and schema specifications.
