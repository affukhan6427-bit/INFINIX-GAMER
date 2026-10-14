# INFINIX GAMER — Official Community & Link Hub

A modern, high-performance, mobile-optimized gaming web application with a cyber dark aesthetic, neon green and cyan glow effects, four-step gate sequence, and a secure owner admin portal.

---

## ⚡ Key Features

1. **Cyber Gaming Aesthetics & Responsive UX**
   - Electric neon green (`#00ff66`) and cyan/blue (`#06b6d4`) glows, cyber grid backdrops, and Orbitron / Rajdhani typography.
   - Fully optimized for Android Chrome (>= 48px touch targets, mobile viewport locks, haptics, and tab focus listeners).
   - Real-time step progress bar with animated completion tracking.

2. **Sequential 4-Step Verification Gate**
   - **Step 1 — TikTok**: Opens customizable TikTok profile in new tab or app. Returning shows a "Continue" button, followed by an animated 15–20s waiting period.
   - **Step 2 — Instagram**: Locked until Step 1 completes. Opens customizable Instagram profile, displays "Continue", and observes the 15–20s timer.
   - **Step 3 — YouTube**: Locked until Step 2 completes. Opens customizable YouTube channel, displays "Continue", and observes the 15–20s timer.
   - **Step 4 — Get Your Link**: Locked until Steps 1, 2, and 3 are completed in the current session. Pressing **"UNLOCK YOUR LINK"** verifies with the backend gate, fires confetti celebrations, and opens the destination URL.

3. **Session & Reset Rules**
   - Refreshing or reloading the page starts a fresh session.
   - Step 4 locks again on refresh, requiring completion from Step 1.
   - Destination URL is protected on the server and is never sent to the browser until Steps 1, 2, and 3 are validated for the current session.

4. **Owner Admin Panel**
   - Password-protected with salted scrypt hashing.
   - Master Password: `infinixgamer@0101` (can be updated anytime in the Security tab).
   - Configure:
     - Website Title & Subtitle
     - TikTok Profile URL & Button Label
     - Instagram Profile URL & Button Label
     - YouTube Channel URL & Button Label
     - Final Destination URL & Unlock Button Label
     - Waiting duration between 15 and 20 seconds
   - Persistent storage in `data/settings.json`.
   - Real-time analytics tracking page views, clicks per social step, link unlocks, and conversion rates.

5. **Honest Verification**
   - Transparent disclosure that the verification measures dwell return time rather than asking visitors for invasive third-party account permissions.

---

## 🛠️ Quick Start & Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚀 Deployment Instructions

### Production Build
```bash
npm run build
```
This builds the client to `dist/` and bundles `server.ts` into `server.js`.

### Start Production Server
```bash
npm run start
```
The server will run on port 3000 (or the port specified by the `PORT` environment variable).

### Deploying to Cloud Run or Docker
A sample `Dockerfile` for containerized hosting:
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```
