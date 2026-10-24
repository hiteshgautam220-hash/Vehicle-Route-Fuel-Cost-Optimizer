/**
 * RouteWise — config.js
 * All constants, static data and fuel defaults.
 * No DOM access here — pure data.
 */

// Standard Metro Fuel Rate Reference Database (India)
const CITY_FUEL_RATES = [
    { city: "New Delhi",   state: "Delhi",          petrol: 94.72,  diesel: 87.62, cng: 75.09, trend: "Stable" },
    { city: "Mumbai",      state: "Maharashtra",    petrol: 104.21, diesel: 92.15, cng: 76.00, trend: "Stable" },
    { city: "Bengaluru",   state: "Karnataka",      petrol: 102.86, diesel: 88.94, cng: 82.50, trend: "Slight Up" },
    { city: "Kolkata",     state: "West Bengal",    petrol: 103.94, diesel: 90.76, cng: 86.00, trend: "Stable" },
    { city: "Chennai",     state: "Tamil Nadu",     petrol: 100.75, diesel: 92.34, cng: 83.50, trend: "Stable" },
    { city: "Hyderabad",   state: "Telangana",      petrol: 107.41, diesel: 95.65, cng: 89.50, trend: "Slight Up" },
    { city: "Ahmedabad",   state: "Gujarat",        petrol: 96.42,  diesel: 92.17, cng: 78.20, trend: "Stable" },
    { city: "Pune",        state: "Maharashtra",    petrol: 103.77, diesel: 90.31, cng: 78.00, trend: "Stable" },
    { city: "Jaipur",      state: "Rajasthan",      petrol: 104.88, diesel: 90.36, cng: 80.50, trend: "Stable" },
    { city: "Chandigarh",  state: "Chandigarh",     petrol: 94.24,  diesel: 82.40, cng: 82.40, trend: "Stable" },
    { city: "Lucknow",     state: "Uttar Pradesh",  petrol: 94.65,  diesel: 87.76, cng: 85.00, trend: "Stable" },
    { city: "Surat",       state: "Gujarat",        petrol: 96.31,  diesel: 92.08, cng: 77.80, trend: "Stable" },
    { city: "Bhopal",      state: "Madhya Pradesh", petrol: 106.47, diesel: 91.84, cng: 88.00, trend: "Slight Up" },
    { city: "Patna",       state: "Bihar",          petrol: 105.48, diesel: 92.32, cng: 84.50, trend: "Stable" },
    { city: "Kochi",       state: "Kerala",         petrol: 105.72, diesel: 94.66, cng: 83.00, trend: "Stable" }
];

// Fallback city dataset for offline/local execution
const FALLBACK_INDIAN_CITIES = [
    { name: "Delhi",          lat: 28.6139, lng: 77.2090 },
    { name: "New Delhi",      lat: 28.6139, lng: 77.2090 },
    { name: "Mumbai",         lat: 19.0760, lng: 72.8777 },
    { name: "Bengaluru",      lat: 12.9716, lng: 77.5946 },
    { name: "Kolkata",        lat: 22.5726, lng: 88.3639 },
    { name: "Chennai",        lat: 13.0827, lng: 80.2707 },
    { name: "Hyderabad",      lat: 17.3850, lng: 78.4867 },
    { name: "Ahmedabad",      lat: 23.0225, lng: 72.5714 },
    { name: "Pune",           lat: 18.5204, lng: 73.8567 },
    { name: "Jaipur",         lat: 26.9124, lng: 75.7873 },
    { name: "Surat",          lat: 21.1702, lng: 72.8311 },
    { name: "Lucknow",        lat: 26.8467, lng: 80.9462 },
    { name: "Kanpur",         lat: 26.4499, lng: 80.3319 },
    { name: "Nagpur",         lat: 21.1458, lng: 79.0882 },
    { name: "Indore",         lat: 22.7196, lng: 75.8577 },
    { name: "Thane",          lat: 19.2183, lng: 72.9781 },
    { name: "Bhopal",         lat: 23.2599, lng: 77.4126 },
    { name: "Visakhapatnam",  lat: 17.6868, lng: 83.2185 },
    { name: "Patna",          lat: 25.5941, lng: 85.1376 },
    { name: "Vadodara",       lat: 22.3072, lng: 73.1812 },
    { name: "Ghaziabad",      lat: 28.6692, lng: 77.4538 },
    { name: "Ludhiana",       lat: 30.9010, lng: 75.8573 },
    { name: "Agra",           lat: 27.1767, lng: 78.0081 },
    { name: "Nashik",         lat: 19.9975, lng: 73.7898 },
    { name: "Faridabad",      lat: 28.4089, lng: 77.3178 },
    { name: "Meerut",         lat: 28.9845, lng: 77.7064 },
    { name: "Rajkot",         lat: 22.3039, lng: 70.8022 },
    { name: "Varanasi",       lat: 25.3176, lng: 82.9739 },
    { name: "Srinagar",       lat: 34.0837, lng: 74.7973 },
    { name: "Aurangabad",     lat: 19.8762, lng: 75.3433 },
    { name: "Dhanbad",        lat: 23.7957, lng: 86.4304 },
    { name: "Amritsar",       lat: 31.6340, lng: 74.8723 },
    { name: "Chandigarh",     lat: 30.7333, lng: 76.7794 },
    { name: "Coimbatore",     lat: 11.0168, lng: 76.9558 },
    { name: "Kochi",          lat: 9.9312,  lng: 76.2673 },
    { name: "Hisar",          lat: 29.1492, lng: 75.7217 },
    { name: "Gurugram",       lat: 28.4595, lng: 77.0266 },
    { name: "Noida",          lat: 28.5355, lng: 77.3910 },
    { name: "Dehradun",       lat: 30.3165, lng: 78.0322 },
    { name: "Shimla",         lat: 31.1048, lng: 77.1734 }
];

// ── Shared App State (accessible across all modules) ───────────────
let currentFuelType = 'cng'; // Tracks the active fuel selector button

// Default mileage/price per fuel type
const FUEL_DEFAULTS = {
    petrol:  { efficiency: 15, price: 94.72, unit: "km/L",   priceUnit: "₹/L",  co2Factor: 2.31 },
    diesel:  { efficiency: 20, price: 87.62, unit: "km/L",   priceUnit: "₹/L",  co2Factor: 2.68 },
    cng:     { efficiency: 25, price: 75.09, unit: "km/kg",  priceUnit: "₹/kg", co2Factor: 1.85 },
    compare: { efficiency: 25, price: 75.09, unit: "km/unit",priceUnit: "₹/unit",co2Factor: 1.85 }
};
