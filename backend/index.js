import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Webhook } from 'svix';
import { clerkClient } from '@clerk/clerk-sdk-node';

import recommendationRoutes from './routes/recommendations.js';

// Models
import User from './models/User.js';
import Artwork from './models/Artwork.js';

// --- 1. IMPORT ALL ROUTES ---
import uploadRoutes from './routes/upload.js';
import collectionRoutes from './routes/collections.js';
import userRoutes from './routes/users.js';
import artworkRoutes from './routes/artworks.js';
import followRoutes from './routes/follow.js';
import savedRoutes from './routes/saved.js';
import autoTaggerRoutes from './routes/autoTagger.js';
import commentRoutes from './routes/comments.js';


// --- 2. INITIAL SETUP ---
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3001;

// --- 3. MIDDLEWARE ---

const ALLOWED_ORIGIN = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');

app.use(cors({
  origin: ALLOWED_ORIGIN,
  credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

console.log('🔧 Mounting API routes...');


// --- 4. API ROUTES ---
app.use('/api/upload', uploadRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/users', userRoutes);
app.use('/api/artworks', artworkRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/saved', savedRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api', autoTaggerRoutes);

app.get('/api/test-saved', (req, res) => {
  console.log('✅ Test route hit!');
  res.json({ 
    success: true, 
    message: 'Saved routes test - working!',
    timestamp: new Date().toISOString()
  });
});



// Note: Multer configuration is handled in individual route files (e.g., autoTagger.js)
// This prevents duplicate configurations and keeps upload logic with its routes


// ==================== DATABASE CONNECTION ====================
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('No MongoDB URI found in .env file');
    }
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};


// ==================== OTHER ROUTES (WEBHOOKS, HEALTH, ETC.) ====================
app.post('/api/clerk/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  
  const svix_id = req.headers["svix-id"];
  const svix_timestamp = req.headers["svix-timestamp"];
  const svix_signature = req.headers["svix-signature"];
  
  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({
      success: false,
      message: 'Error occurred -- no svix headers',
    });
  }

  // Get the secret from your environment variables
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    return res.status(500).json({ success: false, message: 'Missing CLERK_WEBHOOK_SECRET' });
  }

  const wh = new Webhook(WEBHOOK_SECRET);
  const payload = req.body;
  let evt;

  try {
    // Verify the payload with the headers
    evt = wh.verify(JSON.stringify(payload), {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error('❌ Error verifying webhook:', err);
    return res.status(400).json({ 'success': false, 'message': err.message });
  }

  // 2. HANDLE THE 'user.created' EVENT
  const eventType = evt.type;
  if (eventType === 'user.created') {
    console.log('✅ User created event received:', evt.data.id);

    try {
      
      const userId = evt.data.id;
      
      const newPublicMetadata = {
        
        bio: ''
      };

      // Update the user's metadata in Clerk
      await clerkClient.users.updateUser(userId, {
        publicMetadata: newPublicMetadata
      });
      
      console.log('✅ Successfully updated metadata for user:', userId);

    } catch (err) {
      console.error('❌ Error updating user metadata:', err);
    }
  }

  res.status(200).json({
    success: true,
    message: 'Webhook processed'
  });
});

app.get('/api/health', (req, res) => { 
  res.json({ 
    status: 'OK', 
    server: 'ArtHive Backend',
    timestamp: new Date().toISOString()
  });
 });


// ==================== ERROR HANDLING ====================
// Global error handler
app.use((err, req, res, next) => {
  console.error('🚨 Global Error Handler:', err);
  
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.use('*', (req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.originalUrl} not found` });
});


// ==================== SERVER START ====================
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server Started on Port: ${PORT}`);
  });
}).catch((error) => {
  console.error('❌ Failed to start server:', error);
});