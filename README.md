# 🎨 Murals Restored — AI-Powered Mural Restoration Platform

A full-stack web application that restores damaged Indian mural photographs using a dual-stage deep learning model (StructureNet + TextureNet). Built with **Express.js**, **React**, and **MongoDB**.

---

## 📁 Project Structure

```
mural-restoration/
├── backend/                   # Express.js REST API
│   ├── config/
│   │   ├── database.js        # MongoDB connection with retry
│   │   └── passport.js        # Google OAuth 2.0 strategy
│   ├── middleware/
│   │   ├── auth.js            # JWT protect / optionalAuth / requireAdmin
│   │   ├── errorHandler.js    # Centralised error formatting
│   │   └── upload.js          # Multer memory storage config
│   ├── models/
│   │   ├── User.js            # Users collection
│   │   ├── Image.js           # Uploaded images + binary data
│   │   ├── Restoration.js     # Job state + output images
│   │   └── Gallery.js         # Community gallery posts
│   ├── routes/
│   │   ├── auth.js            # Google OAuth + local JWT login/register
│   │   ├── images.js          # Upload, serve, delete images
│   │   ├── restorations.js    # Start jobs, poll status, download results
│   │   ├── gallery.js         # Public feed, likes, comments
│   │   └── users.js           # Profile management, stats
│   ├── services/
│   │   └── modelService.js    # HTTP client for Python inference server
│   ├── utils/
│   │   └── logger.js          # Winston logger (console + file)
│   ├── .env.example
│   ├── package.json
│   └── server.js              # Entry point
│
├── frontend/                  # React + Vite SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   └── ProtectedRoute.jsx
│   │   │   └── layout/
│   │   │       └── Layout.jsx  # Sticky nav + footer
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx   # Google OAuth + local auth
│   │   │   ├── AuthCallback.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── RestorePage.jsx # Drag-drop upload + job pipeline
│   │   │   ├── HistoryPage.jsx
│   │   │   ├── RestorationDetail.jsx  # Before/after slider + download
│   │   │   ├── GalleryPage.jsx
│   │   │   ├── GalleryPostPage.jsx    # Likes + comments
│   │   │   ├── ProfilePage.jsx
│   │   │   └── NotFoundPage.jsx
│   │   ├── services/
│   │   │   └── api.js          # Axios client + named helpers
│   │   ├── store/
│   │   │   └── authStore.js    # Zustand auth state
│   │   ├── styles/
│   │   │   └── globals.css     # Tailwind + design tokens
│   │   ├── App.jsx             # Route definitions
│   │   └── main.jsx            # ReactDOM entry
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── model/
│   └── server.py              # FastAPI inference microservice
│
└── README.md
```

---

## 🗄️ MongoDB Schema Design

### Users
```js
{
  _id, name, email, avatar,
  googleId, passwordHash, authProvider: 'google'|'local',
  restorationCount, storageUsedBytes,
  preferences: { defaultOutputSize, autoPublishToGallery },
  isActive, role: 'user'|'admin',
  createdAt, updatedAt
}
```

### Images
```js
{
  _id, userId,
  originalName, mimeType, sizeBytes, width, height,
  originalData: Buffer,          // raw image bytes
  status: 'uploaded'|'queued'|'processing'|'completed'|'failed',
  detectedDamageTypes, predictedStyle, damageScore,
  createdAt, updatedAt
}
```

### Restorations
```js
{
  _id, userId, imageId,
  mode: 'original'|'sliding_window',
  damageType, status, progress,
  restoredData: Buffer, maskData: Buffer,
  metrics: { psnr, ssim, lpips },
  predictedStyle, detectedDamageTypes, damageScore,
  processingTimeMs, errorMessage,
  isPublic, galleryRef,
  deletedAt, createdAt, updatedAt
}
```

### Gallery
```js
{
  _id, userId, restorationId,
  title, description, tags, style,
  likes: [userId], comments: [{ userId, text, createdAt }],
  views, isPublic, isFeatured,
  deletedAt, createdAt, updatedAt
}
```

---

## 🔑 Google OAuth Setup Guide

### Step 1 — Create a Google Cloud project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click **New Project** → name it "Mural Restoration" → **Create**
3. Select your new project

### Step 2 — Enable the Google+ API

1. Navigate to **APIs & Services → Library**
2. Search for **"Google+ API"** → **Enable**
3. Also enable **"Google People API"** (for profile photos)

### Step 3 — Create OAuth credentials

1. Go to **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth client ID**
3. Application type: **Web application**
4. Name: "Mural Restoration Web"

**Authorised JavaScript origins:**
```
http://localhost:3000
https://yourdomain.com           ← add in production
```

**Authorised redirect URIs:**
```
http://localhost:5000/api/auth/google/callback
https://api.yourdomain.com/api/auth/google/callback   ← add in production
```

5. Click **Create** → copy **Client ID** and **Client Secret**

### Step 4 — Configure OAuth consent screen

1. Go to **APIs & Services → OAuth consent screen**
2. User Type: **External** → **Create**
3. Fill in: App name, support email, developer email
4. Scopes: add `email`, `profile`
5. Test users: add your email
6. **Save and Continue**

### Step 5 — Add to .env

```env
GOOGLE_CLIENT_ID=1234567890-xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxx
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

---

## ⚙️ Step-by-Step Setup Instructions

### Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Node.js | ≥ 18 | `node -v` |
| npm | ≥ 9 | `npm -v` |
| MongoDB | ≥ 6 | `mongod --version` |
| Python | ≥ 3.10 | `python --version` |
| Git | any | `git --version` |

### 1. Clone and install

```bash
git clone https://github.com/yourname/mural-restoration.git
cd mural-restoration

# Backend
cd backend
npm install
cp .env.example .env
# → Edit .env with your values

# Frontend
cd ../frontend
npm install

# Create frontend env
cat > .env.local << 'EOF'
VITE_API_URL=/api
EOF
```

### 2. Start MongoDB

```bash
# Local MongoDB
mongod --dbpath ./data/db

# Or use MongoDB Atlas (cloud) — just set MONGODB_URI in .env
```

### 3. Start the Python model server (optional for dev)

```bash
cd model
pip install fastapi uvicorn python-multipart torch torchvision pillow numpy

# Place your trained model checkpoint at the path specified in CFG.SAVE_DIR
python server.py
# → Listening on http://localhost:8000
```

> **Without the model server:** The backend falls back to mock inference (returns the original image). Set `MODEL_SERVICE_URL=` (empty) in `.env`.

### 4. Start the backend

```bash
cd backend
npm run dev
# → http://localhost:5000
```

### 5. Start the frontend

```bash
cd frontend
npm run dev
# → http://localhost:3000
```

---

## 🚀 Run Instructions

### Development (3 terminals)

```bash
# Terminal 1 — MongoDB
mongod

# Terminal 2 — Backend
cd backend && npm run dev

# Terminal 3 — Frontend
cd frontend && npm run dev
```

Then open **http://localhost:3000**

### Production build

```bash
# Build frontend
cd frontend
npm run build        # outputs to frontend/dist/

# Run backend in production
cd backend
NODE_ENV=production npm start
```

---

## 🌐 API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/auth/google` | — | Redirect to Google |
| GET | `/api/auth/google/callback` | — | OAuth callback |
| POST | `/api/auth/register` | — | Local registration |
| POST | `/api/auth/login` | — | Local login |
| GET | `/api/auth/me` | ✓ | Current user |
| POST | `/api/auth/logout` | ✓ | Logout (client-side) |

### Images
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/images/upload` | ✓ | Upload image (multipart) |
| GET | `/api/images` | ✓ | List user images |
| GET | `/api/images/:id` | ✓ | Image metadata |
| GET | `/api/images/:id/file` | ✓ | Serve image bytes `?size=512` |
| DELETE | `/api/images/:id` | ✓ | Delete image |

### Restorations
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/restorations` | ✓ | Start job |
| GET | `/api/restorations` | ✓ | History list |
| GET | `/api/restorations/:id` | ✓ | Job status / metadata |
| GET | `/api/restorations/:id/restored` | ✓ | Download result `?size=1024` |
| GET | `/api/restorations/:id/mask` | ✓ | Download damage mask |
| DELETE | `/api/restorations/:id` | ✓ | Soft delete |

### Gallery
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/gallery` | opt | Public feed |
| POST | `/api/gallery` | ✓ | Publish restoration |
| GET | `/api/gallery/:id` | opt | Single post |
| POST | `/api/gallery/:id/like` | ✓ | Toggle like |
| POST | `/api/gallery/:id/comments` | ✓ | Add comment |
| PATCH | `/api/gallery/:id/visibility` | ✓ | Toggle public/private |
| DELETE | `/api/gallery/:id` | ✓ | Remove post |

---

## ☁️ Deployment Guide

### Option A — Docker Compose (recommended)

```yaml
# docker-compose.yml
version: '3.9'
services:
  mongo:
    image: mongo:7
    volumes: [mongo_data:/data/db]
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: changeme

  backend:
    build: ./backend
    ports: ["5000:5000"]
    env_file: ./backend/.env
    depends_on: [mongo]
    environment:
      MONGODB_URI: mongodb://root:changeme@mongo:27017/mural_restoration?authSource=admin

  model:
    build: ./model
    ports: ["8000:8000"]
    volumes: ["./model/checkpoints:/checkpoints"]
    deploy:
      resources:
        reservations:
          devices: [{driver: nvidia, count: 1, capabilities: [gpu]}]

  frontend:
    build: ./frontend
    ports: ["3000:80"]

volumes:
  mongo_data:
```

```bash
docker compose up -d
```

### Option B — Cloud services

| Service | Component | Platform |
|---------|-----------|----------|
| Frontend | React SPA | Vercel / Netlify |
| Backend | Express API | Railway / Render / Fly.io |
| Database | MongoDB | MongoDB Atlas (free tier) |
| Model | Python FastAPI | RunPod / vast.ai (GPU) |

#### Vercel (Frontend)
```bash
cd frontend
npm run build
vercel --prod
# Set env: VITE_API_URL=https://api.yourdomain.com/api
```

#### Railway (Backend)
```bash
# Connect GitHub repo, set root directory to /backend
# Add all .env variables in Railway dashboard
# Railway auto-detects Node.js and runs npm start
```

#### MongoDB Atlas
1. Create free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create database user
3. Whitelist IP (0.0.0.0/0 for Railway/Render)
4. Copy connection string → `MONGODB_URI` in backend env

---

## 🔒 Security Checklist

- [x] Helmet.js security headers
- [x] CORS restricted to frontend origin
- [x] Rate limiting (100 req/15 min)
- [x] JWT with expiry
- [x] bcrypt password hashing (rounds=12)
- [x] Input validation via express-validator
- [x] File type + size validation on upload
- [x] Multer memory storage (no disk write)
- [x] MongoDB injection prevention (Mongoose)
- [x] Soft deletes (data preserved)
- [x] Environment variables for all secrets

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit: `git commit -m "feat: description"`
4. Push and open a PR

---

## 📄 License

MIT — see LICENSE file.
#   m u r a l - r e s t o r a t i o n  
 