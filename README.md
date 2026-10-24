# RouteWise — Vehicle Route & Multi-Fuel Cost Optimizer
### Full-Stack Web Application (Node.js, Express.js, MongoDB & Modern Frontend)

RouteWise is a modern full-stack web application designed to optimize multi-stop vehicle journeys across India and provide real-time economic cost comparisons between **Petrol**, **Diesel**, and **CNG**.

---

## 1. Project Overview & Problem Solved

### The Problem
Traveling across India's vast highway networks often presents financial and logistical uncertainty. Fuel expenditures vary significantly depending on vehicle fuel type, fluctuating metro reference rates, and highway detours. Drivers, commercial fleets, and everyday commuters lack an integrated tool to calculate actual road distances and contrast fuel quantities (Litres vs kg) and expenditures across Petrol, Diesel, and CNG side-by-side.

### The RouteWise Solution
RouteWise integrates:
1. High-precision GIS mapping and routing across 4,200+ Indian cities.
2. A server-side multi-fuel price comparison engine.
3. User accounts and persistent trip bookmarking backed by MongoDB and Mongoose.
4. Secure JWT authentication and bcrypt password hashing.
5. Safe file uploads (profile avatars and journey receipts) via Multer.
6. An interactive academic syllabus probe demonstrating core Node.js, Express, and asynchronous JavaScript concepts.

---

## 2. Key Features

- **Interactive Multi-Stop Highway Journey Planner**:
  - Instant autocomplete search across 4,200+ verified Indian cities with GIS coordinates streamed from `cities.csv`.
  - 1-click quick-add chips for major hubs (Delhi, Mumbai, Bengaluru, Jaipur, Kolkata, Chennai, Hyderabad, Pune).
  - Leaflet.js interactive map with draggable waypoints, route polylines, reverse routing, and reset view.
  - OSRM Highway Engine calculating real turn-by-turn road distance and driving duration with a calibrated Haversine fallback.

- **Multi-Fuel Economics Engine (Petrol vs Diesel vs CNG)**:
  - Side-by-side fuel quantity required (Litres or kg) and total monetary cost (₹).
  - Running cost per kilometer (`₹ / km`) and CO₂ emissions tracking (`kg CO₂`).
  - CNG Green Savings Calculator showing monetary savings and discount percentage over Petrol and Diesel.
  - Interactive Trip Simulator slider (50 km to 1,500 km) and Daily Commute / Annual Budget Savings Calculator.

- **City Fuel Rates Matrix**:
  - Live reference rates for 15+ Indian metropolitan centers (New Delhi, Mumbai, Bengaluru, Kolkata, Chennai, Hyderabad, etc.).
  - 1-Click "Apply to Route" to load city fuel rates directly into the journey planner.
  - Search filter by city or state name with visual price comparison bars.

- **Authentication, Authorization & User Profiles**:
  - User registration and login with bcrypt password hashing and signed JWT tokens.
  - Guest Mode allowing full access to all route planning and fuel calculation tools without requiring an account.
  - Account bookmarks: Saved trips persisted in MongoDB with Mongoose relational references (`user: ObjectId`).
  - Profile management and avatar picture uploads using Multer with file validation and safe storage.
  - Animated car engine startup overlay with driving animation and status progression.

- **Academic Syllabus Demonstration Hub**:
  - Embedded inspector modal with live interactive probes querying Node.js runtime stats, V8 engine memory usage, Event Loop phases, Async comparisons (Callbacks vs Promises vs Async/Await), Buffers, Streams, and EventEmitter.

---

## 3. Technology Stack

- **Backend**:
  - **Runtime**: Node.js (v18+ / v20+ / v24+)
  - **Framework**: Express.js 4.x
  - **Database & ODM**: MongoDB & Mongoose 8.x
  - **Authentication**: JSON Web Tokens (`jsonwebtoken`) & `bcryptjs`
  - **File Handling**: `multer` with file extension & MIME type validation
  - **Cross-Origin**: `cors`
  - **Environment**: `dotenv`
  - **Testing**: `supertest` automated test runner

- **Frontend**:
  - **Markup & Layout**: HTML5, Modern CSS3 (Variables, CSS Grid, Flexbox, Keyframes)
  - **UI Frameworks**: Bootstrap 5, FontAwesome 6, Google Fonts (*Inter*, *JetBrains Mono*)
  - **Mapping & GIS**: Leaflet.js 1.9.4, OpenStreetMap Tiles, OSRM Trip API
  - **Client Networking**: Modern asynchronous Fetch API with centralized `ApiClient` (`js/api.js`)
  - **Theme**: Automatic Dark/Light mode switcher with localStorage persistence

---

## 4. Project Architecture & Folder Structure

```
Vehicle-Route-Fuel-Cost-Optimizer/
├── frontend/                     # Modern Responsive Frontend
│   ├── css/
│   │   ├── animations.css        # Keyframe animations & transitions
│   │   ├── auth.css              # Modal & login gateway styling
│   │   ├── base.css              # Typography, theme variables (Dark/Light)
│   │   ├── landing.css           # Hero section & interactive cards
│   │   ├── navbar.css            # Sticky responsive navbar & pills
│   │   ├── planner.css           # From-To planner & inputs
│   │   └── sections.css          # Comparison, rates & about sections
│   ├── js/
│   │   ├── api.js                # Centralized Fetch API client (Bearer JWT)
│   │   ├── app.js                # App bootstrap & health ping
│   │   ├── auth.js               # Registration, login, profile & avatar UI
│   │   ├── cities.js             # Datalist population & city search
│   │   ├── config.js             # Constants & reference fuel rates
│   │   ├── fuel.js               # Multi-fuel simulator & city rates table
│   │   ├── landing.js            # Hero map & proof strip counters
│   │   ├── map.js                # Leaflet map, waypoints & route calculator
│   │   ├── saved-routes.js       # Saved journeys CRUD UI
│   │   └── utils.js              # Toasts, theme toggle, syllabus demo modal
│   ├── data/
│   │   └── cities.csv            # 4,200+ Indian GIS coordinates
│   └── index.html                # Single-page full-stack frontend
├── backend/                      # Production Node.js & Express Backend
│   ├── config/
│   │   └── db.js                 # Mongoose connection & graceful fallback
│   ├── controllers/
│   │   ├── authController.js     # User registration, login & profile
│   │   ├── cityController.js     # Streaming CSV parser & GIS statistics
│   │   ├── demoController.js     # Academic syllabus demonstration APIs
│   │   ├── feedbackController.js # Community feedback & audit logger
│   │   ├── fuelRateController.js # City fuel rate queries & updates
│   │   ├── routeController.js    # Route calculation & fuel economics
│   │   └── tripController.js     # Trip CRUD operations (with populate)
│   ├── middleware/
│   │   ├── auth.js               # JWT verification & RBAC authorization
│   │   ├── errorHandler.js       # Centralized error formatting & 404
│   │   └── upload.js             # Multer storage, size & type filters
│   ├── models/
│   │   ├── Feedback.js           # Feedback Mongoose schema
│   │   ├── FuelRate.js           # City rates Mongoose schema
│   │   ├── Trip.js               # Trip journey Mongoose schema (ref: User)
│   │   └── User.js               # User Mongoose schema (bcrypt pre-save hook)
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth routes
│   │   ├── cityRoutes.js         # /api/cities routes
│   │   ├── demoRoutes.js         # /api/demo routes
│   │   ├── feedbackRoutes.js     # /api/feedback routes
│   │   ├── fuelRateRoutes.js     # /api/fuel-rates routes
│   │   ├── routeRoutes.js        # /api/routes routes
│   │   └── tripRoutes.js         # /api/trips routes
│   ├── services/
│   │   └── routeService.js       # OSRM & Haversine multi-fuel engine
│   ├── utils/
│   │   ├── appEvents.js          # Node.js EventEmitter & audit logger
│   │   └── seed.js               # Initial database seeder
│   ├── uploads/                  # Upload directory for avatars & receipts
│   │   ├── avatars/
│   │   └── trips/
│   ├── tests/
│   │   └── run-tests.js          # Automated end-to-end API test suite
│   ├── app.js                    # Express app configuration & middleware
│   ├── server.js                 # HTTP server bootstrap & startup
│   ├── package.json              # Backend package configuration
│   ├── .env                      # Local development environment file
│   └── .env.example              # Environment template (no secrets)
├── package.json                  # Root convenience scripts & dependencies
├── .env.example                  # Root environment template
├── .gitignore                    # Excludes node_modules, .env, and uploads
├── SYLLABUS_MAPPING.md           # Exhaustive academic syllabus mapping
├── RouteWise.postman_collection.json # Ready-to-import Postman collection
└── README.md                     # Documentation
```

---

## 5. Prerequisites

Before running the application, ensure you have:
- **Node.js**: Version 18.0.0 or higher (v20+ recommended). Check with `node -v`.
- **NPM**: Version 9.0.0 or higher. Check with `npm -v`.
- **MongoDB** (Optional for local testing):
  - A free **MongoDB Atlas** cluster URI, OR
  - A local MongoDB instance (`mongod`) running on port 27017.
  - *Note*: If MongoDB is not running, RouteWise automatically runs in resilient **Fallback Mode** so that all routing, calculators, and demo endpoints remain functional without crashing.

---

## 6. Installation & Setup Instructions

### Step 1: Open the Project Directory
```powershell
cd "c:\Users\LENOVO\Desktop\Bee evauation 2\Vehicle-Route-Fuel-Cost-Optimizer"
```

### Step 2: Install Dependencies
```powershell
npm install
```
*(All required dependencies including express, mongoose, bcryptjs, jsonwebtoken, multer, cors, and supertest will be installed).*

### Step 3: Configure Environment Variables
Copy `.env.example` to create your local `.env` file (one has already been generated with safe defaults):
```powershell
cp .env.example .env
```

Verify or update the configuration in `.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/routewise
JWT_SECRET=routewise_secure_academic_jwt_secret_key_2026
JWT_EXPIRE=7d
MAX_FILE_SIZE_MB=2
UPLOAD_DIR=uploads
CLIENT_URL=http://localhost:5000
```

### Step 4: (Optional) Configure MongoDB Atlas
To connect to a cloud MongoDB Atlas database:
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free shared cluster (M0).
3. Under **Database Access**, create a database user with password.
4. Under **Network Access**, add IP `0.0.0.0/0` (allow access from anywhere) or your current IP.
5. In **Clusters** -> click **Connect** -> **Connect your application** -> Copy the connection string.
6. Replace `MONGODB_URI` in `.env`:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/routewise?retryWrites=true&w=majority
   ```

---

## 7. How to Run the Application

### Development Mode (with automatic restart on code changes):
```powershell
npm run dev
```

### Production / Standard Mode:
```powershell
npm start
```

### Accessing the Application:
Once started, open your web browser and navigate to:
- **Web Application**: [http://localhost:5000](http://localhost:5000)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Academic Syllabus Demo**: [http://localhost:5000/api/demo/node-info](http://localhost:5000/api/demo/node-info)

---

## 8. Available REST API Endpoints

### 8.1 System Health
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | System status, uptime & DB connectivity | Public |

### 8.2 Authentication & User Profiles
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user account (bcrypt hash) | Public |
| `POST` | `/api/auth/login` | Authenticate user & issue signed JWT | Public |
| `POST` | `/api/auth/logout` | Client session logout | Public |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Private (Bearer JWT) |
| `PUT` | `/api/auth/profile` | Update user mileage & fuel preferences | Private (Bearer JWT) |
| `POST` | `/api/auth/avatar` | Upload profile avatar image (Multer) | Private (Bearer JWT) |

### 8.3 Saved Trips CRUD Operations
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/trips` | Get user's saved trips (supports `?page=`, `?limit=`, `?q=`) | Private (Bearer JWT) |
| `POST` | `/api/trips` | Save journey with distance, costs & stops | Private (Bearer JWT) |
| `GET` | `/api/trips/:id` | Get single trip details (with `populate`) | Private (Bearer JWT) |
| `PUT` | `/api/trips/:id` | Update trip title or notes | Private (Bearer JWT) |
| `DELETE` | `/api/trips/:id` | Permanently delete saved trip | Private (Bearer JWT) |
| `POST` | `/api/trips/:id/attachment` | Upload receipt or itinerary document | Private (Bearer JWT) |

### 8.4 Route Calculation & Multi-Fuel Economics
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/routes/calculate` | Compute OSRM distance, duration, multi-fuel breakdown, CO₂ & savings | Public |

### 8.5 City Fuel Rates
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/fuel-rates` | List metro fuel rates (supports `?search=`) | Public |
| `GET` | `/api/fuel-rates/:city` | Get fuel rates for specific metro city | Public |
| `POST` | `/api/fuel-rates` | Update or create city rates | Private (Admin / Fleet) |

### 8.6 Indian Cities GIS Dataset
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/cities` | Search 4,200+ cities autocomplete stream (`?q=`, `?limit=`) | Public |
| `GET` | `/api/cities/stats` | Total cities count and streaming metadata | Public |

### 8.7 Community Feedback
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/feedback` | Submit suggestion, bug report, or inquiry | Public |
| `GET` | `/api/feedback` | View all feedback submissions | Private (Admin) |

### 8.8 Academic Syllabus Demonstrations
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/demo/node-info` | V8 engine memory usage, process globals & event loop | Public |
| `GET` | `/api/demo/async-comparison` | Callbacks vs Promises vs Async/Await comparison | Public |
| `GET` | `/api/demo/streams-buffers` | Node.js Buffers base64 & fs stream chunking | Public |
| `GET` | `/api/demo/event-emitter` | Custom EventEmitter dispatch & listener trace | Public |

---

## 9. How to Test the APIs

### 9.1 Automated Test Suite
RouteWise includes a complete automated test runner testing all 54 assertions (health, authentication, JWT verification, duplicate prevention, password security, CRUD operations, route calculation, streaming, and error handling):

```powershell
npm test
```

### 9.2 Postman Testing
A complete, pre-configured Postman Collection is included in the project root:
`RouteWise.postman_collection.json`

To import and run:
1. Open **Postman**.
2. Click **Import** -> Select `RouteWise.postman_collection.json`.
3. Set the `baseUrl` collection variable to `http://localhost:5000`.
4. Run requests in order:
   - **Login User** automatically sets the `authToken` variable upon 200 response.
   - Subsequent protected requests (`Get Current Profile`, `Create Saved Trip`, etc.) automatically use the token.

---

## 10. Default Demo Accounts

For instant testing and evaluation, the following pre-configured demonstration accounts are available:

| Account Type | Email | Password | Role | Default Vehicle |
| :--- | :--- | :--- | :--- | :--- |
| **CNG Driver** | `driver@routewise.in` | `password123` | `user` | CNG (25 km/kg) |
| **Fleet Manager** | `fleet@routewise.in` | `password123` | `fleet_manager` | Diesel (20 km/L) |
| **System Admin** | `admin@routewise.in` | `adminpassword123` | `admin` | Petrol (18 km/L) |

*(You can also click the quick 1-click buttons inside the Sign In modal to log in instantly).*

---

## 11. Security & Production Quality Notes

1. **Password Security**: Passwords are never stored in plaintext. They are salted and hashed using 10 rounds of `bcryptjs` in a Mongoose `pre('save')` lifecycle hook.
2. **Secret Protection**: `JWT_SECRET` and database URIs are stored in `.env`. The `.env` file is excluded in `.gitignore` to prevent secret commits to GitHub.
3. **Data Sanitization & Validation**: Inputs are trimmed, lowercase-sanitized, and validated via Mongoose schemas and controller checks before database persistence.
4. **File Upload Restrictions**: Multer is restricted to image MIME types (`image/jpeg`, `image/png`, `image/webp`) and `.pdf` files. Filenames are randomized with timestamps and random hex to eliminate path traversal and arbitrary script execution exploits. Maximum file size is strictly capped at 2MB.
5. **No Password Exposure**: Password hashes are explicitly excluded from Mongoose queries by default (`select: false`) and stripped in `user.toJSON()`.
6. **Graceful Connection Resilience**: If MongoDB is offline, RouteWise does not crash. It logs a clean notice and operates gracefully in memory, maintaining operational uptime.

---

## 12. Troubleshooting Common Issues

- **Port 5000 Already in Use**:
  Change `PORT=5001` in your `.env` file and restart with `npm start`.
- **Database Connection Warning**:
  If you see `[MongoDB Warning] Could not connect to MongoDB`, the server is running in resilient in-memory mode. To persist data to MongoDB Atlas, add your Atlas connection string to `MONGODB_URI` in `.env`.
- **CORS Issues When Running Separate Frontend**:
  CORS is enabled by default for all origins in `backend/app.js`.

---

## 13. Academic Syllabus Compliance

For an in-depth mapping between each academic syllabus requirement and its specific source file, function, and testing procedure, please refer to the dedicated [SYLLABUS_MAPPING.md](SYLLABUS_MAPPING.md) file.
