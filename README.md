# 🍽️ FoodShare

FoodShare is a modern, responsive full-stack web application designed to connect food donors (restaurants, events, individuals) with volunteers who can deliver surplus food to those in need.

![Dashboard Preview](https://via.placeholder.com/800x400?text=FoodShare+Dashboard)

## ✨ Features
*   **Dual Roles Support:** Separate dashboards and workflows for Donors and Volunteers.
*   **Priority Distribution Engine:** Automatically calculates urgency based on food expiry time (Critical, High, Medium, Low).
*   **Live Delivery Tracking:** Interactive stepper tracking food from "Posted" to "Delivered".
*   **Glassmorphic UI:** Premium, modern aesthetic with animated gradients, smooth interactions, and skeleton loaders.
*   **Impact Leaderboard:** Real-time statistics tracking top donors and active volunteers.
*   **Mobile-First PWA:** Fully optimized for iPhones with "Add to Home Screen" support, hiding browser chrome for a native-like feel.

## 🛠️ Tech Stack
*   **Frontend:** HTML5, Vanilla JavaScript, CSS3 (Custom Variables, CSS Grid/Flexbox)
*   **Backend:** Node.js, Express.js
*   **Database:** SQLite (better-sqlite3)
*   **Maps/Geolocation:** Leaflet.js
*   **Icons/Fonts:** Google Fonts (Outfit)

## 💸 Revenue Model (Judge Pitch)
FoodShare is designed as a social-impact platform with sustainable B2B + B2G revenue:

*   **NGO/City SaaS Dashboard:** Monthly subscription for NGOs/municipal bodies to get analytics, hotspot maps, and operational reporting.
*   **Enterprise Donor Plans:** Restaurants, hotels, and event companies pay for branded accounts, CSR impact reports, and API integrations.
*   **Verified Logistics Add-on:** Optional paid dispatch/SLA layer for priority pickups where volunteer coverage is low.
*   **Impact Insights API:** Aggregated, anonymized food-waste and rescue metrics for research, policy, and ESG reporting.
*   **Grant + CSR Partnerships:** Launch-phase support through foundations and CSR programs while transaction volume scales.

## 🚀 How to Run Locally (For Judges/Evaluators)

To run this project on your own machine, follow these steps:

### 1. Prerequisites
You need **Node.js** (v16 or higher) installed on your computer.
[Download Node.js here](https://nodejs.org/)

### 2. Clone the Repository
Open your terminal or command prompt and run:
```bash
git clone https://github.com/Adityakasara/FoodShare.git
cd FoodShare
```

### 3. Install Dependencies
Navigate to the `backend` folder and install the required Node modules:
```bash
cd backend
npm install
```

### 4. Start the Server
Run the application server:
```bash
node server.js
```
*Note: This starts the backend API on port 3000 and serves the frontend static files automatically.*

### 5. Open the App in your Browser
Once the server is running, open your web browser and navigate to:
```
http://localhost:3000
```

### 📱 Testing on a Mobile Device (iPhone/Android)
To test the mobile-responsive UI on a real phone:
1. Ensure your laptop and phone are connected to the **same Wi-Fi network**.
2. When you start the server using `node server.js`, check the terminal output. It will display a "Local Network IP" (e.g., `http://192.168.1.5:3000`).
3. Type that exact URL into your phone's browser (Safari/Chrome).

---
*Built with ❤️ for community food sharing.*
