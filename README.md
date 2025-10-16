# 🎨 Arthive — AI-Powered Art Sharing Platform

![MERN](https://img.shields.io/badge/Stack-MERN-green?style=flat-square)
![Clerk](https://img.shields.io/badge/Auth-Clerk-blue?style=flat-square)
![Cloudinary](https://img.shields.io/badge/Media-Cloudinary-lightblue?style=flat-square)
![Vercel](https://img.shields.io/badge/Deployed%20On-Vercel-black?style=flat-square)
![AI](https://img.shields.io/badge/Powered%20By-AI-purple?style=flat-square)

**Arthive** is an AI-enhanced art-sharing platform where artists can upload, showcase, and explore artworks effortlessly.  
The platform blends creativity and technology — offering personalized recommendations, real-time activity updates, and smart tagging powered by AI.

🌐 **Live Demo:** [https://art-hive-deploy.vercel.app/](https://art-hive-deploy.vercel.app/)

---

## ✨ Features

- 🔐 **Clerk Authentication** — Secure and seamless login/signup flow.  
- 🖼️ **Artwork Uploads** — Upload and manage artworks using **Cloudinary**.  
- 🧠 **AI-Powered Auto Tagging** — Automatically tags artworks based on image content using AI.  
- 💡 **Personalized AI Recommendations** — Suggests artworks based on likes, views, and user activity.  
- 🎨 **Collections** — Organize your artworks into themed collections.  
- ❤️ **Like & View Tracking** — Track engagement and popularity metrics.  
- ⚡ **Real-Time Activity Feed** — Displays uploads, likes, and follows instantly.  
- 👤 **User Profiles** — Showcase your total likes, views, and uploaded artworks.  
- 📱 **Responsive Design** — Works smoothly on all devices.  

---

## 🧩 Tech Stack

**Frontend:**  
- React.js  
- Clerk (Authentication)  
- Tailwind CSS  
- Axios  

**Backend:**  
- Node.js  
- Express.js  
- MongoDB (via Mongoose)  
- Cloudinary API  
- OpenAI / ML API (for AI tagging & recommendations)  

---

## 🚀 Getting Started (Local Setup)

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/yourusername/arthive.git
cd arthive
```
Backend
```bash
cd backend
npm install
```
Frontend
```bash
cd ../frontend
npm install
```
Set up Environment Variables

in backend .env
```bash
PORT=5000
MONGO_URI=your_mongodb_connection_string
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLERK_SECRET_KEY=your_clerk_secret_key
OPENAI_API_KEY=your_openai_api_key
```
in frontend .env
```bash
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_BACKEND_URL=http://localhost:5000

```
Run both frontend and backend
```bash
cd backend
npm run dev
cd ../frontend
npm run dev
```

🧠 AI Features in Depth
🔹 Auto Tagging

When users upload artwork, the backend uses an AI model (e.g., OpenAI Vision or ML API) to detect elements and automatically generate descriptive tags.

🔹 Personalized Recommendations

User interactions (likes, views, follows) are analyzed to recommend similar artworks, ensuring a tailored discovery experience.

🌍 Deployment

  Deployed on Vercel (Frontend)
  Backend can be hosted on Render, Railway, or Vercel Functions.


Folder Structure
```
arthive/
├── backend/
│   ├── routes/
│   ├── models/
│   ├── controllers/
│   ├── services/
│   ├── .env
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── App.jsx
│   ├── public/
│   ├── .env
│   └── vite.config.js
│
└── README.md
```

📅 Future Enhancements
```
🧾 Commenting system

🏷️ Advanced filtering & search

🧑‍🤝‍🧑 Artist collaborations

🧩 NFT minting integration
```
# 🧑‍💻 Author

  Rajeev Dixit
  📧 [dixitrajeev5202@gmail.com]
  ]
  💼 [https://www.linkedin.com/in/rajeev-dixit-892526346/]
  
  ⭐ If you like this project, don't forget to star the repo on GitHub!        

🪪 License

This project is licensed under the MIT License — feel free to use and modify it for learning or personal projects.



