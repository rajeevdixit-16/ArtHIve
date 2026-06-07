# ArtHive — AI-Powered Art Sharing Platform

![MERN](https://img.shields.io/badge/Stack-MERN-green) ![Clerk](https://img.shields.io/badge/Auth-Clerk-blue) ![Cloudinary](https://img.shields.io/badge/Media-Cloudinary-lightblue) ![Vercel](https://img.shields.io/badge/Deployed%20On-Vercel-black) ![AI](https://img.shields.io/badge/AI-Clarifai-purple)

**ArtHive** is an AI-enhanced art-sharing platform where artists can upload, showcase, and explore artworks. It blends creativity with AI technology — offering personalized recommendations, real-time activity updates, and smart tagging powered by AI.

🌐 **Live Demo:** [https://art-hive-deploy.vercel.app/](https://art-hive-deploy.vercel.app/)

---

## Features

- **Authentication** — Secure login/signup via Clerk (Google OAuth, email/password, magic links)
- **AI Auto-Tagging** — Uploaded images are automatically tagged using Clarifai AI (up to 6 tags with confidence scores)
- **Content Moderation** — AI-powered moderation with keyword filtering and safe-search checks (safe / warning / blocked)
- **Personalized Recommendations** — Content-based and collaborative filtering engine suggests artworks based on likes, tags, categories, and artists you engage with
- **Artwork Management** — Upload, edit, delete artworks with Cloudinary-hosted images
- **Collections** — Create themed collections and organize artworks
- **Like & View Tracking** — Track engagement with per-user like status and view counts
- **Follow System** — Follow/unfollow artists with follower/following lists
- **Save System** — Bookmark artworks and collections for later
- **Comments** — Threaded comments with likes, flagging, and soft-delete
- **User Profiles & Dashboard** — Showcase stats (total likes, views, uploads) with activity feed
- **Search & Discovery** — Browse artworks with pagination, search by title, filter by category/tags
- **Email Verification** — Custom 6-digit code verification flow synced with Clerk webhooks
- **Responsive Design** — Tailwind CSS, works on all devices

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | ^19.1.1 | UI framework |
| React Router DOM | ^7.9.3 | Client-side routing |
| Vite | ^7.1.9 | Build tool & dev server |
| Tailwind CSS | ^3.4.18 | Utility-first CSS |
| Clerk React | ^4.32.5 | Authentication components |
| Axios | ^1.12.2 | HTTP client |
| Lucide React | ^0.544.0 | Icon library |
| PostCSS / Autoprefixer | — | CSS processing |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Node.js / Express | ^4.21.2 | HTTP server & routing |
| MongoDB (Mongoose) | ^8.0.0 | Database ODM |
| Clerk SDK | ^4.13.23 / ^1.7.37 | Auth middleware & webhooks |
| Cloudinary | ^2.7.0 | Image hosting & transformations |
| Multer | ^2.0.2 | File upload handling |
| Clarifai | ^11.11.0 | AI image tagging |
| Svix | ^1.76.1 | Clerk webhook signature verification |

### External Services

| Service | Purpose |
|---|---|
| Clerk | Authentication (OAuth, email/password) |
| MongoDB Atlas | Cloud database |
| Cloudinary | Image CDN & transformations |
| Clarifai | AI image recognition & tagging |
| Vercel | Frontend hosting |

---

## Project Structure

```
arthive/
├── backend/                           # Express API server
│   ├── index.js                       # Entry point — server setup & middleware
│   ├── config/
│   │   ├── cloudinary.js              # Cloudinary SDK config
│   │   └── fixUserStats.js            # One-off script to recalculate stats
│   ├── middleware/
│   │   └── auth.js                    # Clerk userId extraction middleware
│   ├── models/
│   │   ├── User.js                    # User schema (Clerk-synced, stats, verification)
│   │   ├── Artwork.js                 # Artwork schema (likes, views, moderation)
│   │   ├── Comment.js                 # Comment schema (threaded, likes, flags)
│   │   ├── Collection.js              # Collection schema (artwork grouping)
│   │   ├── Follow.js                  # Follow relationship schema
│   │   ├── SavedArtwork.js            # Saved artwork join schema
│   │   └── SavedCollection.js         # Saved collection join schema
│   ├── routes/
│   │   ├── users.js                   # User CRUD, sync, verification, search
│   │   ├── artworks.js                # Artwork CRUD, likes, views, recommendations
│   │   ├── upload.js                  # Image upload (multer → Cloudinary) + moderation
│   │   ├── comments.js                # Comment CRUD, likes, flags, pagination
│   │   ├── collections.js             # Collection CRUD, artwork management
│   │   ├── follow.js                  # Follow/unfollow, followers/following lists
│   │   ├── saved.js                   # Save/unsave artworks & collections
│   │   ├── recommendations.js         # AI recommendation endpoint
│   │   └── autoTagger.js              # AI auto-tagging endpoint
│   ├── ai_services/
│   │   ├── moderation_service.js      # Content moderation (keyword + safe-search)
│   │   ├── recommendation_service.js  # AI recommendation engine
│   │   └── vision_api_services/
│   │       ├── clarifai_tagger.js     # Active Clarifai image tagging
│   │       └── auto_tagger.js         # Deprecated — Google Cloud Vision (reference only)
│   └── uploads/                       # Temp upload storage (gitignored)
│
├── frontend/                          # React SPA
│   ├── index.html                     # SPA entry HTML
│   ├── vite.config.js                 # Vite config with API proxy → :3001
│   ├── tailwind.config.js             # Tailwind CSS configuration
│   ├── postcss.config.cjs             # PostCSS config
│   ├── public/                        # Static assets (favicons)
│   └── src/
│       ├── main.jsx                   # React entry (ClerkProvider, AppProvider)
│       ├── App.jsx                    # Root component with routing
│       ├── index.css                  # Tailwind directives + global styles
│       ├── context/
│       │   └── AppContext.jsx         # Global state — user sync, artworks, likes
│       ├── utils/
│       │   └── api.js                 # Axios instance + API wrappers
│       ├── services/                  # Service layer (API calls)
│       │   ├── autoTagService.js      # Auto-tagging & upload
│       │   ├── likeService.js         # Like toggle & status
│       │   ├── viewService.js         # View recording
│       │   ├── savedService.js        # Save/unsave
│       │   ├── followService.js       # Follow/unfollow
│       │   ├── recommendationService.js # AI recommendations
│       │   └── collectionService.js   # Collection CRUD
│       ├── components/
│       │   ├── Header/Header.jsx      # Navigation header
│       │   ├── Footer/Footer.jsx      # Site footer
│       │   ├── Hero/Hero.jsx          # Landing page hero section
│       │   ├── Features/Features.jsx  # Landing page features
│       │   ├── Gallery/GalleryPreview.jsx # Artwork gallery grid
│       │   ├── CommentsSection.jsx    # Full comment UI
│       │   ├── UploadWithAutoTag.jsx  # Standalone auto-tag demo
│       │   ├── CreateArtworkForm.jsx  # Artwork creation form
│       │   ├── Auth/ProtectedRoute.jsx # Auth guard
│       │   └── AddArtworksModal/      # Modal for collection artwork management
│       │       ├── AddArtworksModal.jsx
│       │       └── AddArtworksModal.css
│       └── pages/
│           ├── Landing/               # Landing page (public)
│           ├── Discover/              # Browse artworks with search, filters (public)
│           ├── Dashboard/             # User stats & activity feed (auth)
│           ├── Profile/               # User profile (auth)
│           ├── EditProfile/           # Profile editing (auth)
│           ├── Upload/                # Artwork upload with AI tagging (auth)
│           ├── Login/                 # Clerk login page (signed-out)
│           ├── Signup/                # Clerk signup page (signed-out)
│           ├── VerifyEmail/           # Email verification UI (auth)
│           ├── Collections/           # Browse collections (public)
│           ├── CollectionDetail/      # Single collection view (public)
│           ├── CreateCollection/      # Create collection (auth)
│           ├── EditCollection/        # Edit collection (auth)
│           └── Saved/                 # Saved artworks & followed artists (auth)
│
└── README.md
```

---

## API Endpoints

### Users
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/users/sync` | Sync Clerk user to MongoDB |
| POST | `/api/users/send-verification-code` | Send 6-digit verification email |
| POST | `/api/users/verify-email` | Verify email with code |
| POST | `/api/users/resend-verification-code` | Resend verification code |
| GET | `/api/users/clerk/:clerkUserId` | Get user by Clerk ID |
| GET/PUT | `/api/users/:userId` | Get/update user by MongoDB ID |
| GET | `/api/users/:userId/stats` | Get user statistics |
| PATCH | `/api/users/:userId/role` | Update user role |
| PATCH | `/api/users/:userId/deactivate` | Deactivate user |
| PATCH | `/api/users/:userId/reactivate` | Reactivate user |
| GET | `/api/users/` | Search users |

### Artworks
| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/api/artworks` | List (paginated) / Create artwork |
| GET/PUT/DELETE | `/api/artworks/:id` | Single artwork CRUD |
| POST | `/api/artworks/:id/like` | Toggle like |
| GET | `/api/artworks/:id/like-status/:clerkUserId` | Check like status |
| POST | `/api/artworks/:id/view` | Record view |
| GET | `/api/artworks/user/:clerkUserId` | Get user's artworks |
| GET | `/api/artworks/recommendations` | AI recommendations |

### Comments
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/comments/artwork/:artworkId` | Get comments (paginated) |
| POST | `/api/comments` | Create comment |
| PUT/DELETE | `/api/comments/:commentId` | Update/delete comment |
| POST | `/api/comments/:commentId/like` | Toggle comment like |
| POST | `/api/comments/:commentId/flag` | Flag comment |

### Collections
| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/api/collections` | List / Create collection |
| GET | `/api/collections/user/:clerkUserId` | User's collections |
| GET/PUT/DELETE | `/api/collections/:id` | Single collection CRUD |
| GET | `/api/collections/:id/available-artworks` | Artworks not in collection |
| POST/DELETE | `/api/collections/:id/artworks` | Add/remove artwork |

### Follow / Saved / AI
| Method | Endpoint | Description |
|---|---|---|
| POST/DELETE | `/api/follow/:artistId` | Follow/unfollow artist |
| GET | `/api/follow/status/:artistId/:followerId` | Check follow status |
| GET | `/api/follow/following/:userId` | Following list |
| GET | `/api/follow/followers/:userId` | Followers list |
| GET | `/api/saved/:userId` | Get saved items |
| POST/DELETE | `/api/saved/artworks/:artworkId` | Save/unsave artwork |
| GET | `/api/saved/artworks/:artworkId/status` | Check save status |
| GET | `/api/recommendations/:userId` | AI recommendations |
| POST | `/api/auto-tag` | AI image tagging |
| POST | `/api/clerk/webhook` | Clerk webhook receiver |
| GET | `/api/health` | Health check |

---

## Frontend Routes

| Route | Component | Access |
|---|---|---|
| `/` | Landing | Public |
| `/discover` | Discover | Public |
| `/login` | Login | Signed-out only |
| `/signup` | Signup | Signed-out only |
| `/verify-email` | VerifyEmail | After signup |
| `/profile` | Profile | Signed-in |
| `/dashboard` | Dashboard | Signed-in |
| `/upload` | Upload | Signed-in |
| `/collections` | Collections | Public |
| `/collections/create` | CreateCollection | Signed-in |
| `/collections/:id` | CollectionDetail | Public |
| `/collections/:id/edit` | EditCollection | Signed-in |
| `/edit-profile` | EditProfile | Signed-in |
| `/saved` | Saved | Signed-in |

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas URI (or local MongoDB)
- Clerk account (for auth keys)
- Cloudinary account (for image hosting)
- Clarifai account (for AI tagging — optional, falls back gracefully)

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/arthive.git
cd arthive

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Environment Variables

**backend/.env**
```
PORT=3001
MONGODB_URI=your_mongodb_connection_string
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret
CLARIFAI_PAT=your_clarifai_personal_access_token
```

**frontend/.env**
```
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_BACKEND_URL=http://localhost:3001
```

### Run

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev
```

The frontend dev server runs on `http://localhost:5173` and proxies `/api` requests to the backend at `http://localhost:3001`.

---

## Scripts

### Backend
| Command | Description |
|---|---|
| `npm run dev` | Start backend server on port 3001 |
| `npm start` | Production start |

### Frontend
| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server (port 5173) |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

---

## AI Services

### Auto-Tagging (Clarifai)
When users upload artwork, the image is analyzed by the Clarifai general image recognition model. Returns up to 6 descriptive tags with confidence scores. Falls back to generic tags `["artwork", "digital art", "painting"]` if the API is unavailable.

### Content Moderation
A hybrid approach combining:
- **Keyword filtering** — Checks titles, descriptions, and alt-text against a blocklist
- **Safe-search** — Analyzes uploaded images for adult/violent content
- **Three severity levels** — `safe`, `warning`, `blocked`
- Users can choose to force-upload content flagged as `warning`

### Recommendation Engine
Content-based filtering that:
1. Analyzes user's liked artworks to build a preference profile (tags, categories, artists)
2. Finds collaborative signals from similar users
3. Scores and ranks up to 200 candidate artworks
4. Returns top 20 personalized recommendations

---

## Architecture

```
Browser (React SPA)
     │
     │ /api/* (via Vite proxy)
     ▼
Express Server (:3001)
     │
     ├── Middleware (CORS, Clerk auth, JSON)
     ├── Routes → Route handlers (business logic)
     ├── MongoDB (Mongoose models)
     ├── Cloudinary (Image upload/storage)
     └── AI Services (Clarifai + Moderation)
```

- **Auth:** Clerk manages authentication; webhooks sync user data to MongoDB. On each app load, the frontend syncs the Clerk session to the backend.
- **Upload flow:** Image → (optional) AI auto-tagging via Clarifai → Upload to Cloudinary via multer stream → Content moderation → Save artwork to MongoDB.
- **State management:** React Context (`AppContext`) provides global state for user data, artworks, and engagement actions.

---

## Deployment

- **Frontend:** Built with Vite, deployed on [Vercel](https://vercel.com)
- **Backend:** Node.js/Express, deployable on Render, Railway, or any Node.js host
- Ensure all environment variables are configured on the hosting platform

---

## License

MIT License — feel free to use and modify for learning or personal projects.

---

## Author

**Rajeev Dixit**  
📧 dixitrajeev5202@gmail.com  
💼 [LinkedIn](https://www.linkedin.com/in/rajeev-dixit-892526346/)
