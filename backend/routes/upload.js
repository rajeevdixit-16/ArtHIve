import express from 'express';
import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import Artwork from '../models/Artwork.js';
import { clerkClient } from '@clerk/clerk-sdk-node';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { analyzeTagsForContent, validateUpload, sanitizeDescription } from '../ai_services/moderation_service.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Upload artwork
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { title, description, category, customTags, clerkUserId, safeSearch = {}, forceUpload = false } = req.body;

    if (!clerkUserId) {
      return res.status(400).json({ 
        success: false,
        error: 'clerkUserId is required' 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No image file provided' 
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ 
        success: false,
        error: 'Title is required' 
      });
    }

    // Find user by Clerk ID
    const user = await User.findOne({ clerkUserId });
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found. Please sync user first.' 
      });
    }

    // Parse tags
    let tags = [];
    if (customTags) {
      tags = customTags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }

    // Perform content moderation
    const moderationResult = analyzeTagsForContent(tags, safeSearch);
    const uploadValidation = validateUpload(moderationResult, forceUpload);

    if (!uploadValidation.canUpload) {
      return res.status(400).json({
        success: false,
        error: 'Content moderation blocked this upload',
        blocked: uploadValidation.blocked,
        warnings: uploadValidation.warnings,
        message: uploadValidation.blocked 
          ? 'This content violates our content policy and cannot be uploaded.'
          : 'This content may not be appropriate. Please review and confirm.',
        needsConfirmation: !uploadValidation.blocked
      });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'grand-gallery',
          transformation: [
            { width: 1200, height: 800, crop: 'limit' },
            { quality: 'auto' },
            { format: 'webp' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    // Create artwork in database
    console.log('🎨 Preparing artwork data...');
    console.log('User:', user);
    console.log('File mimetype:', req.file?.mimetype);

    const artworkData = {
      title: title.trim(),
      description: sanitizeDescription(description) || '',
      imageUrl: result.secure_url,
      cloudinaryId: result.public_id,
      userId: user._id,
      clerkUserId,
      artistName: user.fullName || user.username || 'Anonymous',
      tags,
      category: category || 'digital',
      isPublic: true,
      price: 0,
      fileFormat: req.file?.mimetype?.split('/')[1]?.toUpperCase() || 'PNG',
      fileSize: req.file?.size || 0,
      status: moderationResult.isFlagged ? 'flagged' : 'published'
    };

    console.log('💾 Artwork data:', artworkData);
    const artwork = new Artwork(artworkData);
    await artwork.save();

    // Populate user info
    await artwork.populate('userId', 'username firstName lastName profileImage');

    res.status(201).json({
      success: true,
      message: 'Artwork uploaded successfully',
      artwork,
      moderationStatus: moderationResult.isFlagged ? 'flagged_for_review' : 'approved'
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to upload artwork',
      details: error.message 
    });
  }
});

export default router;