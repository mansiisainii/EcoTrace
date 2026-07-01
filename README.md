# 🌱 EcoTrace

> AI-powered carbon emission tracking dashboard for businesses — 
> log emissions in plain English, get real-time CO2e calculations, 
> and receive smart reduction recommendations.

🔗 **Live Demo:** [eco-trace-six.vercel.app](https://eco-trace-six.vercel.app)  
📧 **Demo Login:** `demo@ecotrace.com` / `demo123`

---

## 🌍 The Problem

ESG compliance and carbon reporting is becoming mandatory 
for businesses worldwide. Most SMEs have no easy way to 
track emissions — existing tools are expensive, complex, 
or require filling out rigid forms with technical data 
most teams don't have.

---

## 💡 The Solution

EcoTrace lets anyone type what their business did in plain 
English — and the app handles everything else.

```
"We shipped 500kg goods from Delhi to London by air"
```

→ AI extracts: category = shipping, value = 500kg  
→ Climatiq calculates: exact CO2e  
→ Saved under: Scope 3  
→ Dashboard updates: instantly  
→ AI recommends: how to reduce it  

---

## ✨ Features

- 🤖 **Conversational AI Logging** — no dropdowns or forms, 
  just natural language powered by Groq's Llama 3.1
- 📊 **Real-Time Dashboard** — bar, pie, and line charts 
  built with Recharts, auto-updating on every new log
- 🔍 **Scope 1/2/3 Classification** — automatic GHG Protocol 
  mapping for every activity logged
- 💡 **AI Recommendations** — 3 personalized reduction 
  strategies generated from your actual emission data
- 📁 **Reports Page** — filterable table by date range, 
  category, and scope with running CO2e total
- 🌗 **Dark/Light Theme** — persisted via localStorage
- 📱 **Fully Responsive** — mobile-first layout, 
  hamburger nav on small screens
- 🔐 **JWT Authentication** — secure login/register 
  with bcrypt password hashing
- 🛡️ **Resilient Fallback** — if Groq or Climatiq hits 
  rate limits, local calculation formulas kick in 
  automatically so the app never breaks

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), Tailwind CSS, Recharts, Lucide React, React Router, React Hot Toast |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| AI / NLP | Groq API — Llama 3.1 8B Instant |
| Emissions Engine | Climatiq API |
| Authentication | JWT, bcrypt.js |
| Deployment | Vercel (frontend), Render (backend), MongoDB Atlas |

---

## 🏗️ How It Works

```
User types in AI chat
        ↓
Groq Llama 3.1 extracts:
{ category, value, unit, region }
        ↓
Climatiq API calculates exact CO2e
        ↓
Saved to MongoDB with Scope 1/2/3 tag
        ↓
Dashboard charts update in real time
        ↓
Groq generates 3 reduction recommendations
based on user's actual emission history
```

If Groq or Climatiq is unavailable, the app 
falls back to local category-specific formulas:

| Category | Fallback Formula |
|---|---|
| Electricity | value × 0.4 kg CO2e per kWh |
| Travel | value × 0.15 kg CO2e per km |
| Shipping | value × 0.5 kg CO2e per kg |
| Fuel | value × 2.68 kg CO2e per litre |

---

## 🌐 Scope Classification

| Category | Scope | Example |
|---|---|---|
| Electricity | Scope 2 | Office power usage |
| Fuel | Scope 1 | Generator diesel |
| Travel | Scope 3 | Business flights, car trips |
| Shipping | Scope 3 | Freight, cargo |

---

## 📡 API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | ❌ | Create account |
| POST | `/api/auth/login` | ❌ | Login, receive JWT |
| POST | `/api/ai/extract` | ✅ | Extract emission data from text |
| GET | `/api/ai/recommendations` | ✅ | Get AI reduction tips |
| POST | `/api/emissions/calculate` | ✅ | Log and calculate CO2e |
| GET | `/api/emissions/logs` | ✅ | Fetch all emission logs |
| GET | `/api/emissions/summary` | ✅ | Dashboard aggregated stats |

All protected routes require:
```
Authorization: Bearer <your_jwt_token>
```

---

## 🚀 Run Locally

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier)
- Groq API key → [console.groq.com](https://console.groq.com)
- Climatiq API key → [climatiq.io](https://climatiq.io)

### Backend Setup

```bash
git clone https://github.com/mansiisainii/EcoTrace.git
cd EcoTrace/server
npm install
```

Create `server/.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
CLIMATIQ_API_KEY=your_climatiq_api_key
GROQ_API_KEY=your_groq_api_key
```

```bash
# Optional: seed demo account with 20 sample logs
node seed/seedDemo.js

# Start server
npm start
```

### Frontend Setup

```bash
cd ../client
npm install
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🧪 Test the AI Chat

Try typing these into the chat:

```
"We used 2000 kWh electricity in our Mumbai office"
→ Expected: ~800 kg CO2e, Scope 2, electricity

"Shipped 500kg goods from Delhi to London by air"
→ Expected: 1000-3000 kg CO2e, Scope 3, shipping

"5 employees flew from Mumbai to Dubai in economy"
→ Expected: 1500-4000 kg CO2e, Scope 3, travel

"Our generator burned 100 litres of diesel"
→ Expected: ~268 kg CO2e, Scope 1, fuel
```

---

## 📁 Project Structure

```
EcoTrace/
├── client/                     # React frontend
│   ├── src/
│   │   ├── api/                # Axios instance + API calls
│   │   ├── components/         # Navbar, AIChat, StatCard,
│   │   │                       # RecommendationCard, 
│   │   │                       # EmissionTable, ThemeToggle
│   │   ├── context/            # AuthContext, ThemeContext
│   │   └── pages/              # Landing, Login, Register,
│   │                           # Dashboard, Reports
│   └── .env
│
└── server/                     # Node.js backend
    ├── controllers/            # authController,
    │                           # emissionController,
    │                           # aiController
    ├── middleware/             # JWT auth middleware
    ├── models/                 # User, EmissionLog schemas
    ├── routes/                 # auth, emissions, ai routes
    ├── seed/                   # Demo data seeder
    └── .env
```

---

## 🔒 Environment Variables

### Server
| Variable | Description |
|---|---|
| `PORT` | Server port (default 5000) |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `CLIMATIQ_API_KEY` | Climatiq emission factor API key |
| `GROQ_API_KEY` | Groq LLM API key (Llama 3.1) |

### Client
| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API URL (include `/api`) |

---

## 👩‍💻 Built By

**Mansi Saini** — designed and developed independently, 
end-to-end, including backend architecture, AI prompt 
engineering, API integrations, and responsive UI.

🔗 [LinkedIn](https://linkedin.com/in/mansi-saini-852456327) •
🐙 [GitHub](https://github.com/mansiisainii)

---

## 📄 License

MIT License — open for learning and reference.
