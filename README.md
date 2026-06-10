# ArtHive — AI-Powered Art Sharing Platform

**ArtHive** is an art-sharing platform where artists can upload, showcase, and explore artworks. It includes AI-powered features — auto-tagging, art description generation, and personalized recommendations.

🌐 **Live Demo:** [https://art-h-ive.vercel.app/](https://art-h-ive.vercel.app/)

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19, React Router 7 | UI framework & routing |
| Vite 7 | Build tool & dev server |
| Tailwind CSS 3 | Utility-first CSS |
| Clerk | Authentication (OAuth, email/password) |
| Axios | HTTP client |
| Lucide React | Icon library |

### Backend
| Technology | Purpose |
|---|---|
| Node.js, Express 4 | HTTP server & routing |
| MongoDB, Mongoose 8 | Database & ODM |
| Clerk SDK | Auth middleware & webhooks |
| Cloudinary | Image hosting & CDN |
| Multer | File upload handling |
| OpenAI SDK | AI tagging & description (via OpenRouter) |

### Services
- **Clerk** — Authentication
- **MongoDB Atlas** — Cloud database
- **Cloudinary** — Image storage & transformations
- **OpenAI / OpenRouter** — AI vision (tagging + descriptions)
- **Vercel** — Frontend hosting

---

## Project Structure

```
arthive/
├── backend/
│   ├── index.js                        # Express entry point
│   ├── config/cloudinary.js            # Cloudinary SDK config
│   ├── middleware/auth.js              # Clerk auth middleware
│   ├── models/
│   │   ├── User.js                     # User schema (Clerk-synced, stats)
│   │   ├── Artwork.js                  # Artwork schema (likes, views, moderation)
│   │   ├── Comment.js                  # Threaded comments with likes
│   │   ├── Collection.js               # Artwork groupings
│   │   ├── Follow.js                   # Follow relationships
│   │   ├── SavedArtwork.js             # Saved artworks
│   │   └── SavedCollection.js          # Saved collections
│   ├── routes/
│   │   ├── users.js                    # User CRUD, sync, verification
│   │   ├── artworks.js                 # Artwork CRUD, likes, views, recommendations
│   │   ├── upload.js                   # Image upload + AI description
│   │   ├── comments.js                 # Comment CRUD, likes, flags
│   │   ├── collections.js              # Collection CRUD
│   │   ├── follow.js                   # Follow/unfollow, lists
│   │   ├── saved.js                    # Save/unsave
│   │   ├── autoTagger.js              # AI auto-tagging (OpenAI Vision)
│   │   └── recommendations.js          # AI recommendations
│   └── ai_services/
│       ├── description_service.js      # AI art description (GPT-4o)
│       ├── moderation_service.js       # Content moderation
│       ├── recommendation_service.js   # Recommendation engine
│       └── vision_api_services/
│           └── openai_tagger.js        # OpenAI Vision tagging
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                     # Root component with routing
│   │   ├── context/AppContext.jsx      # Global state
│   │   ├── components/                 # Reusable UI components
│   │   │   ├── Header/Header.jsx       # Navigation header
│   │   │   ├── Footer/Footer.jsx       # Site footer
│   │   │   ├── CommentsSection.jsx     # Comment UI
│   │   │   └── AddArtworksModal/       # Collection artwork modal
│   │   └── pages/
│   │       ├── Landing/                # Public landing page
│   │       ├── Discover/               # Browse artworks (modal detail view)
│   │       ├── Dashboard/              # User stats & activity
│   │       ├── Profile/                # User profile
│   │       ├── EditProfile/            # Profile editing
│   │       ├── Upload/                 # Upload with AI description
│   │       ├── Login/ / Signup/        # Clerk auth pages
│   │       ├── VerifyEmail/            # Email verification
│   │       ├── Collections/ */         # Collection management
│   │       ├── Saved/                  # Saved artworks & artists
│   │       └── ArtistDetail/           # Artist profile page
│   └── services/                       # API service modules
└── README.md
```

---

## Features

- **Authentication** — Clerk-powered login/signup (Google OAuth, email/password, magic links)
- **AI Auto-Tagging** — OpenAI GPT-4o Vision generates 6–10 descriptive tags with confidence scores on upload
- **AI Description Generator** — GPT-4o Vision analyzes uploaded images and generates 2–3 sentence art critic descriptions; users can preview and edit before saving
- **Content Moderation** — Keyword filtering + safe-search analysis (safe / warning / blocked)
- **Personalized Recommendations** — Content-based + collaborative filtering engine
- **Artwork Management** — Upload, edit, delete with Cloudinary-hosted images
- **Collections** — Create themed collections and organize artworks
- **Engagement** — Like, save, view tracking, follow/unfollow artists
- **Comments** — Threaded comments with likes and flagging
- **Artist Discovery** — Browse artist profiles with their top artworks
- **Dark UI** — Glass-morphism design with purple/pink gradients

---

## API Overview

| Resource | Key Endpoints |
|---|---|
| **Users** | `POST /sync`, `GET /clerk/:id`, `PUT /:id`, email verification |
| **Artworks** | `GET /` (paginated), `POST /`, `GET /:id`, `PUT /:id`, `DELETE /:id`, `POST /:id/like`, `POST /:id/view`, `GET /user/:clerkUserId` |
| **Upload** | `POST /preview` (AI description), `POST /` (full upload) |
| **Comments** | `GET /artwork/:id`, `POST /`, `PUT /:id`, `DELETE /:id`, `POST /:id/like` |
| **Collections** | `GET /`, `POST /`, `GET /:id`, `PUT /:id`, `DELETE /:id`, `POST /:id/artworks` |
| **Follow** | `POST /:artistId`, `DELETE /:artistId`, `GET /following/:userId`, `GET /followers/:userId` |
| **Saved** | `GET /:userId`, `POST /artworks/:id`, `DELETE /artworks/:id` |
| **AI** | `POST /auto-tag`, `GET /recommendations/:userId` |

---

## Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas URI
- Clerk account
- Cloudinary account
- OpenRouter API key (for AI features — optional)

### Environment Variables

**backend/.env**
```
PORT=3001
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/
CLOUDINARY_CLOUD_NAME=<name>
CLOUDINARY_API_KEY=<key>
CLOUDINARY_API_SECRET=<secret>
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
OPENAI_API_KEY=sk-or-v1-...
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_MODEL=openai/gpt-4o
FRONTEND_URL=http://localhost:5173
```

**frontend/.env**
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_BACKEND_URL=http://localhost:3001
```

### Run

```bash
# Backend (port 3001)
cd backend && npm install && npm run dev

# Frontend (port 5173)
cd frontend && npm install && npm run dev
```

Vite proxies `/api/*` requests to the backend.

### Scripts

| Command | Description |
|---|---|
| `npm run dev` (backend) | Start server on port 3001 |
| `npm run dev` (frontend) | Start Vite dev server |
| `npm run build` (frontend) | Production build to `dist/` |
| `npm run lint` (frontend) | Run ESLint |

---

## AI Services

All AI features use **OpenAI GPT-4o Vision** via OpenRouter. Clarifai and Google Cloud Vision have been fully removed.

### Auto-Tagging
Analyzes uploaded images and returns 6–10 descriptive tags with confidence scores. Called during artwork upload to auto-populate tag fields.

### Art Description Generator
Analyzes uploaded images and generates 2–3 sentence evocative descriptions in the style of an art critic. Uses a two-step flow: preview on image selection (`POST /api/upload/preview`), then save with optional edits (`POST /api/upload`).

### Content Moderation
Keyword filtering against a blocklist + safe-search analysis. Three severity levels: `safe`, `warning`, `blocked`. Users can force-upload warning-level content.

### Recommendations
Content-based filtering: builds user preference profile from liked artworks (tags, categories, artists), finds collaborative signals from similar users, scores candidates, returns top 20.

---

## Deployment

- **Frontend:** Vite build → Vercel
- **Backend:** Node.js/Express → Render, Railway, or any Node.js host
- Configure all environment variables on the hosting platform

---
