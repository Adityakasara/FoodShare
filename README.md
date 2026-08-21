<div align="center">

# 🍽️ FoodShare — Community Food Rescue & Distribution Platform

[![Live Demo](https://img.shields.io/badge/Live_Demo-Active-22c55e?style=for-the-badge&logo=googlechrome&logoColor=white)](https://adityakasara.github.io/FoodShare/)
[![Deployed on](https://img.shields.io/badge/Deployed_on-GitHub_Pages-10b981?style=for-the-badge&logo=github&logoColor=white)](https://adityakasara.github.io/FoodShare/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-blue?style=for-the-badge&logo=pwa&logoColor=white)](https://adityakasara.github.io/FoodShare/)
[![License](https://img.shields.io/badge/License-MIT-gray?style=for-the-badge)](LICENSE)

**A modern, responsive full-stack platform designed to connect surplus food donors (restaurants, caterers, individuals) with local volunteers to reduce food waste and feed communities in real-time.**

---

### 🌐 [Click Here to Access the Live Web App →](https://adityakasara.github.io/FoodShare/)

</div>

---

## ✨ Key Platform Features

- 👥 **Dual Role Ecosystem**: Tailored workflows and real-time dashboards for **Food Donors** and **Community Volunteers**.
- ⚡ **Urgency Distribution Engine**: Automatically categorizes priority based on food expiration time (*Critical*, *High*, *Medium*, *Low*).
- 📍 **Live Delivery Stepper**: Visual multi-stage status tracker from *Surplus Posted* ➔ *Volunteer Claimed* ➔ *Out for Delivery* ➔ *Delivered*.
- 💎 **Glassmorphic UI**: Dynamic dark-mode aesthetic with ambient gradients, tactile buttons, and micro-animations.
- 📱 **Mobile-First Progressive Web App (PWA)**: Installable on iOS & Android with standalone display, custom theme colors, and offline capability.
- 🏆 **Impact Leaderboard**: Live statistics showcasing top donors and active community volunteers.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | HTML5, Modern Vanilla JavaScript (ES6+), CSS3 (Grid, Flexbox, Custom Design Tokens) |
| **PWA** | Service Workers, Web App Manifest, App-like touch icons |
| **Styling & UI** | Glassmorphism, Google Fonts (`Outfit`, `Plus Jakarta Sans`) |
| **Backend & API** | Node.js, Express.js REST API |
| **Database & Maps** | SQLite (`better-sqlite3`), Leaflet.js Geolocation |

---

## 🚀 How to Run Locally (For Judges & Evaluators)

### 1. Prerequisites
- **Node.js** (v16 or higher) installed on your system.

### 2. Clone the Repository
```bash
git clone https://github.com/Adityakasara/FoodShare.git
cd FoodShare
```

### 3. Install & Run Backend Server
```bash
cd backend
npm install
node server.js
```
*The server starts the REST API on port `3000` and serves the frontend static assets automatically.*

### 4. Open in Browser
Visit **`http://localhost:3000`** in your browser.

---

## 📱 Testing on Mobile (iPhone / Android)

1. Connect your computer and mobile phone to the **same Wi-Fi network**.
2. Start the server using `node server.js` and check the displayed Local IP (e.g. `http://192.168.1.5:3000`).
3. Open that URL on Safari / Chrome on your phone, then tap **"Add to Home Screen"** for full PWA experience.

---

## 👤 Author & Developer

**Aditya Kasara**  
- 🌐 **Live Web App:** [adityakasara.github.io/FoodShare](https://adityakasara.github.io/FoodShare/)  
- 🐙 **GitHub:** [@Adityakasara](https://github.com/Adityakasara)

---

<div align="center">
  <sub>Built with ❤️ for community food sharing & zero waste initiatives.</sub>
</div>
