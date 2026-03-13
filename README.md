# 🎯 PHANTOM TRACK — Full-Stack Anti-Theft Platform

React + Node.js + MongoDB + Socket.io + Leaflet Maps

---

## 📁 Project Structure

```
phantom-track/
├── frontend/                  ← React + Vite app (deploy to Vercel)
│   ├── src/
│   │   ├── components/
│   │   │   ├── TrackerDashboard.jsx  ← Main dashboard (your view)
│   │   │   ├── MapPanel.jsx          ← Leaflet real map
│   │   │   ├── LeftPanel.jsx         ← Device info + timeline
│   │   │   ├── RightPanel.jsx        ← Bait generator + share
│   │   │   └── CaptureModal.jsx      ← Popup when thief is caught
│   │   ├── pages/
│   │   │   └── BaitPage.jsx          ← What the THIEF sees
│   │   ├── hooks/
│   │   │   └── useTracker.js         ← All tracker state + socket logic
│   │   ├── lib/
│   │   │   ├── api.js                ← Axios API calls
│   │   │   └── socket.js             ← Socket.io client
│   │   ├── App.jsx                   ← Routes
│   │   └── main.jsx                  ← Entry point
│   ├── .env.example
│   └── package.json
│
├── backend/                   ← Node.js + Express (deploy to Railway)
│   ├── models/
│   │   ├── BaitSession.js     ← MongoDB: bait link sessions
│   │   └── CaptureEvent.js    ← MongoDB: captured location data
│   ├── routes/
│   │   └── bait.js            ← All API endpoints
│   ├── server.js              ← Express + Socket.io server
│   ├── .env.example
│   └── package.json
│
├── package.json               ← Root: run both with one command
└── README.md
```

---

## 🚀 STEP 1 — Local Development Setup

### Prerequisites
- Node.js 18+ installed
- A MongoDB Atlas account (free)
- Git

### Install everything
```bash
git clone https://github.com/YOUR_USERNAME/phantom-track.git
cd phantom-track
npm install          # installs root devDependencies (concurrently)
npm run install:all  # installs backend + frontend dependencies
```

---

## 🗄️ STEP 2 — MongoDB Atlas (Free Database)

1. Go to **https://cloud.mongodb.com** → sign up free
2. Create a new **free cluster** (M0 Sandbox)
3. Under **Database Access** → add a user with username + password
4. Under **Network Access** → add IP `0.0.0.0/0` (allow all, for development)
5. Click **Connect** → **Connect your application** → copy the URI:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/phantom-track
   ```

---

## ⚙️ STEP 3 — Configure Environment Variables

### Backend (`backend/.env`)
```bash
cp backend/.env.example backend/.env
```
Then edit `backend/.env`:
```env
MONGODB_URI=mongodb+srv://youruser:yourpass@cluster0.xxxxx.mongodb.net/phantom-track
PORT=4000
FRONTEND_URL=http://localhost:5173

# Twilio (optional — only needed for server-side SMS)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx

# IPInfo (optional — IP to city lookup)
IPINFO_TOKEN=xxxxxxxxxxxxxxxx
```

### Frontend (`frontend/.env`)
```bash
cp frontend/.env.example frontend/.env
```
Leave as-is for local dev — Vite proxy handles routing to backend automatically.

---

## ▶️ STEP 4 — Run Locally

```bash
npm run dev
```

This starts both simultaneously:
- **Backend** → http://localhost:4000
- **Frontend** → http://localhost:5173

Open http://localhost:5173 in your browser. You should see the Phantom Track dashboard.

---

## 🌍 STEP 5 — Deploy Backend to Railway

Railway gives you a free Node.js server with persistent connection (needed for Socket.io).

1. Go to **https://railway.app** → sign in with GitHub
2. Click **New Project** → **Deploy from GitHub repo** → select your repo
3. Set the **Root Directory** to `backend`
4. Add environment variables (same as your `backend/.env` but with production values):
   - `MONGODB_URI` — same Atlas URI
   - `PORT` — leave blank (Railway sets it automatically)
   - `FRONTEND_URL` — your Vercel URL (set this after step 6)
5. Click **Deploy** → Railway gives you a URL like `https://phantom-track-backend.up.railway.app`

---

## ⚡ STEP 6 — Deploy Frontend to Vercel

1. Go to **https://vercel.com** → sign in with GitHub
2. Click **Add New Project** → select your repo
3. Set **Root Directory** to `frontend`
4. Add environment variable:
   - `VITE_API_URL` = `https://phantom-track-backend.up.railway.app/api`
5. Click **Deploy** → Vercel gives you `https://phantom-track.vercel.app`
6. Go back to Railway → update `FRONTEND_URL` to your Vercel URL → redeploy

---

## 📱 STEP 7 — Get Twilio for SMS (Optional)

1. Sign up at **https://www.twilio.com** (free trial gives $15 credit)
2. Get your **Account SID**, **Auth Token**, and a **Twilio phone number**
3. Add them to your Railway environment variables
4. The **"SEND SMS VIA SERVER"** button in the dashboard will now work

---

## 🗺️ STEP 8 — (Optional) Switch to Google Maps

The app uses **OpenStreetMap** (free, no key needed) by default via Leaflet.

To use Google Maps for satellite view + Street View:
1. Go to **https://console.cloud.google.com**
2. Enable **Maps JavaScript API** + **Geocoding API**
3. Create an API key
4. In `frontend/.env` add: `VITE_GOOGLE_MAPS_KEY=AIzaSy...`
5. Replace `MapPanel.jsx` TileLayer with:
```jsx
<TileLayer url={`https://mt.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}`} />
// lyrs=m = roads, lyrs=s = satellite, lyrs=y = satellite+roads
```

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bait/create` | Create new bait session |
| GET  | `/api/bait/:id` | Get session config (bait page loads this) |
| GET  | `/api/bait/:id/image` | Get base64 image for image-mode bait |
| POST | `/api/bait/:id/capture` | **Called when thief clicks** — saves location |
| GET  | `/api/bait/:id/captures` | Get all capture events for a session |
| POST | `/api/bait/:id/sms` | Send bait link via Twilio SMS |
| GET  | `/api/health` | Health check |

---

## ⚡ Socket.io Events Reference

| Event | Direction | Description |
|-------|-----------|-------------|
| `watch_session` | Client → Server | Tracker subscribes to a session |
| `unwatch_session` | Client → Server | Unsubscribe |
| `location_captured` | Server → Client | **Real-time**: thief location data |
| `bait_clicked` | Server → Client | Bait page was opened |

---

## 🔄 Full Flow (How It Works End-to-End)

```
1. You open the tracker dashboard
2. You fill in the bait config (amount, sender, optional image)
3. Click "GENERATE BAIT PAGE"
   → Backend creates a BaitSession in MongoDB
   → Returns a unique URL: yourapp.vercel.app/bait/V1StGXR8_Z5j
4. You enter the thief's number → click WhatsApp or SMS
   → Thief receives the message
5. Tracker automatically subscribes to the session via Socket.io
6. Thief opens the link on their phone
   → Sees fake Orange Money receipt
   → Taps "Confirm"
   → Browser asks for location permission
7. Bait page calls POST /api/bait/:id/capture with:
   - GPS coordinates (if allowed) or network estimate
   - Device info, user agent, screen size
8. Backend:
   → Saves CaptureEvent to MongoDB
   → Looks up IP location via IPInfo
   → Emits "location_captured" via Socket.io
9. Your tracker dashboard instantly:
   → Shows the modal with all thief data
   → Pins location on the Leaflet map
   → Updates timeline + itinerary
   → Shows real street address
```

---

## 🛠️ Development Tips

**Test the bait page locally:**
```
http://localhost:5173/bait/TEST123
```
This will show an error (session not found) — first generate a real session from the dashboard, then copy the link.

**Watch Socket.io events in browser:**
Open DevTools Console and type:
```js
// The socket is accessible via the app if needed
```

**Check MongoDB data:**
Use **MongoDB Compass** (free GUI) to connect with your Atlas URI and inspect the `baitsessions` and `captureevents` collections.

---

## 🔒 Security Notes

- Never commit your `.env` files (they're in `.gitignore`)
- In production, restrict CORS to only your Vercel domain
- Add rate limiting to `/api/bait/:id/capture` to prevent spam
- The bait URL contains no sensitive data — just a random session ID

---

## 📦 Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 18 + Vite |
| Styling | Tailwind CSS |
| Maps | Leaflet + OpenStreetMap (free) |
| Real-time | Socket.io |
| HTTP client | Axios |
| Routing | React Router v6 |
| Backend | Node.js + Express |
| Database | MongoDB Atlas |
| Real-time transport | Socket.io (WebSocket) |
| SMS | Twilio |
| IP Lookup | IPInfo.io |
| Frontend hosting | Vercel (free) |
| Backend hosting | Railway (free tier) |
