import express from 'express';
import Artwork from '../models/Artwork.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

const router = express.Router();

// GET all public artworks with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      category, 
      tags, 
      search, 
      sortBy = 'createdAt',
      sortOrder = 'desc',
      userId,
      clerkUserId
    } = req.query;

    // Build query for public artworks only
    const query = { 
      isPublic: true, 
      status: 'published' 
    };

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by tags
    if (tags) {
      query.tags = { $in: tags.split(',') };
    }

    // Search in title, description, and tags
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Filter by user
    if (userId) {
      query.userId = userId;
    }
    if (clerkUserId) {
      query.clerkUserId = clerkUserId;
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const artworks = await Artwork.find(query)
      .populate('userId', 'username firstName lastName profileImage')
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Get total count for pagination
    const total = await Artwork.countDocuments(query);

    res.json({
      artworks,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalArtworks: total,
        hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching artworks:', error);
    res.status(500).json({ error: 'Failed to fetch artworks' });
  }
});

// GET single artwork by ID
router.get('/:id', async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id)
      .populate('userId', 'username firstName lastName profileImage bio socialLinks');

    if (!artwork) {
      return res.status(404).json({ error: 'Artwork not found' });
    }

    // Increment views when someone visits the artwork page
    await artwork.incrementViews();

    console.log(`👁️ Artwork "${artwork.title}" viewed. Total views: ${artwork.views}`);

    res.json(artwork);
  } catch (error) {
    console.error('Error fetching artwork:', error);
    res.status(500).json({ error: 'Failed to fetch artwork' });
  }
});

// CREATE new artwork (requires authentication)
router.post('/', async (req, res) => {
  try {
    const { 
      title, 
      description, 
      imageUrl, 
      cloudinaryId, 
      category, 
      tags, 
      price,
      dimensions,
      fileSize,
      fileFormat,
      resolution,
      aiGenerated,
      aiModel,
      colorPalette,
      clerkUserId 
    } = req.body;

    // Validate required fields
    if (!clerkUserId) {
      return res.status(400).json({ error: 'clerkUserId is required' });
    }

    // Find user by Clerk ID
    const user = await User.findOne({ clerkUserId });
    if (!user) {
      return res.status(404).json({ error: 'User not found. Please sync user first.' });
    }

    // Create artwork data
    const artworkData = {
      title,
      description,
      imageUrl,
      cloudinaryId,
      category,
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(tag => tag.trim()) : []),
      price: price || 0,
      userId: user._id,
      clerkUserId,
      artistName: user.fullName || user.username,
      dimensions,
      fileSize,
      fileFormat,
      resolution,
      aiGenerated: aiGenerated || false,
      aiModel: aiModel || '',
      colorPalette: Array.isArray(colorPalette) ? colorPalette : []
    };

    const artwork = new Artwork(artworkData);
    const savedArtwork = await artwork.save();

    // Populate user info in response
    await savedArtwork.populate('userId', 'username firstName lastName profileImage');

    res.status(201).json({
      message: 'Artwork created successfully',
      artwork: savedArtwork
    });
  } catch (error) {
    console.error('Error creating artwork:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    res.status(500).json({ error: 'Failed to create artwork' });
  }
});

// UPDATE artwork (only by owner)
router.put('/:id', async (req, res) => {
  try {
    const { clerkUserId } = req.body;
    
    if (!clerkUserId) {
      return res.status(400).json({ error: 'clerkUserId is required' });
    }

    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) {
      return res.status(404).json({ error: 'Artwork not found' });
    }

    // Check ownership
    if (artwork.clerkUserId !== clerkUserId) {
      return res.status(403).json({ error: 'Not authorized to update this artwork' });
    }

    // Update allowed fields
    const allowedUpdates = [
      'title', 'description', 'category', 'tags', 'price', 
      'isPublic', 'dimensions', 'licenseType', 'status'
    ];
    
    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedArtwork = await Artwork.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('userId', 'username firstName lastName profileImage');

    res.json({
      message: 'Artwork updated successfully',
      artwork: updatedArtwork
    });
  } catch (error) {
    console.error('Error updating artwork:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    res.status(500).json({ error: 'Failed to update artwork' });
  }
});

// DELETE artwork (only by owner)
router.delete('/:id', async (req, res) => {
  try {
    const { clerkUserId } = req.body;
    
    if (!clerkUserId) {
      return res.status(400).json({ error: 'clerkUserId is required' });
    }

    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) {
      return res.status(404).json({ error: 'Artwork not found' });
    }

    // Check ownership
    if (artwork.clerkUserId !== clerkUserId) {
      return res.status(403).json({ error: 'Not authorized to delete this artwork' });
    }

    await Artwork.findByIdAndDelete(req.params.id);

    res.json({ message: 'Artwork deleted successfully' });
  } catch (error) {
    console.error('Error deleting artwork:', error);
    res.status(500).json({ error: 'Failed to delete artwork' });
  }
});

// LIKE/UNLIKE artwork
// In backend/routes/artworks.js - Update the like route
router.post('/:id/like', async (req, res) => {
  try {
    const { clerkUserId } = req.body;

    console.log('❤️ Like request received:', { artworkId: req.params.id, clerkUserId });

    if (!clerkUserId) {
      return res.status(400).json({ 
        success: false,
        error: 'clerkUserId is required' 
      });
    }

    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) {
      return res.status(404).json({ 
        success: false,
        error: 'Artwork not found' 
      });
    }

    console.log('🎨 Artwork found:', artwork.title);
    console.log('📊 Current likes:', artwork.likes.length);

    // Toggle like
    const likeIndex = artwork.likes.indexOf(clerkUserId);
    let liked = false;

    if (likeIndex > -1) {
      // Unlike - remove user from likes array
      artwork.likes.splice(likeIndex, 1);
      console.log('👎 User unliked the artwork');
    } else {
      // Like - add user to likes array
      artwork.likes.push(clerkUserId);
      liked = true;
      console.log('👍 User liked the artwork');
    }

    // Save the artwork
    await artwork.save();
    console.log('💾 Artwork saved. New likes count:', artwork.likes.length);

    // Update user's total likes stats
    try {
      const User = mongoose.model('User');
      const artistUser = await User.findOne({ clerkUserId: artwork.clerkUserId });
      if (artistUser) {
        await artistUser.updateTotalLikes();
        console.log('📈 Updated artist total likes');
      }
    } catch (userError) {
      console.error('⚠️ Could not update user stats:', userError);
      // Don't fail the like operation if user stats update fails
    }

    res.json({
      success: true,
      likes: artwork.likes.length,
      liked: liked,
      message: liked ? "Artwork liked successfully" : "Artwork unliked successfully"
    });

  } catch (error) {
    console.error("❌ Error in like route:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to update like",
      details: error.message 
    });
  }
});

// Also update the like-status route
router.get('/:id/like-status/:clerkUserId', async (req, res) => {
  try {
    const { id, clerkUserId } = req.params;

    console.log('🔍 Checking like status:', { artworkId: id, clerkUserId });

    const artwork = await Artwork.findById(id);
    if (!artwork) {
      return res.status(404).json({ 
        success: false,
        error: 'Artwork not found' 
      });
    }

    const hasLiked = artwork.likes.includes(clerkUserId);

    console.log('✅ Like status:', { hasLiked, likesCount: artwork.likes.length });

    res.json({
      success: true,
      hasLiked,
      likesCount: artwork.likes.length
    });

  } catch (error) {
    console.error("❌ Error checking like status:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to check like status",
      details: error.message 
    });
  }
});

// GET like status for a user

router.get('/:id/like-status/:clerkUserId', async (req, res) => {
  try {
    const { id, clerkUserId } = req.params;

    console.log('🔍 Checking like status:', { artworkId: id, clerkUserId });

    const artwork = await Artwork.findById(id);
    if (!artwork) {
      return res.status(404).json({ 
        success: false,
        error: 'Artwork not found' 
      });
    }

    const hasLiked = artwork.likes.includes(clerkUserId);

    console.log('✅ Like status:', { hasLiked, likesCount: artwork.likes.length });

    res.json({
      success: true,
      hasLiked,
      likesCount: artwork.likes.length
    });

  } catch (error) {
    console.error("❌ Error checking like status:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to check like status",
      details: error.message 
    });
  }
});


// ADD SAMPLE ARTWORKS (for testing)
router.post('/sample', async (req, res) => {
  try {
    console.log('🔄 Adding sample artworks to database...');
    
    // Get a user to associate with sample artworks
    const user = await User.findOne();
    if (!user) {
      return res.status(400).json({ error: 'No users found. Please create a user first.' });
    }

    const sampleArtworks = [
      {
        title: "Sunset Mountains",
        description: "A beautiful painting of mountains during sunset with vibrant colors painting the sky",
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        cloudinaryId: "sample_sunset_mountains",
        category: "painting",
        tags: ["nature", "mountains", "sunset", "landscape"],
        price: 0,
        userId: user._id,
        clerkUserId: user.clerkUserId,
        artistName: user.fullName || user.username,
        dimensions: { width: 1920, height: 1080, unit: 'px' },
        fileFormat: "JPEG",
        resolution: { width: 1920, height: 1080 }
      },
      {
        title: "Abstract Dreams",
        description: "Colorful abstract artwork representing dreams and imagination",
        imageUrl: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        cloudinaryId: "sample_abstract_dreams",
        category: "abstract",
        tags: ["abstract", "colorful", "modern", "dreams"],
        price: 25,
        userId: user._id,
        clerkUserId: user.clerkUserId,
        artistName: user.fullName || user.username,
        dimensions: { width: 1200, height: 800, unit: 'px' },
        fileFormat: "JPEG",
        resolution: { width: 1200, height: 800 }
      },
      {
        title: "Ocean Waves",
        description: "Powerful ocean waves crashing against rocky cliffs at golden hour",
        imageUrl: "https://images.unsplash.com/photo-1505142468610-359e7d316be0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        cloudinaryId: "sample_ocean_waves",
        category: "photography",
        tags: ["ocean", "waves", "nature", "water"],
        price: 15,
        userId: user._id,
        clerkUserId: user.clerkUserId,
        artistName: user.fullName || user.username,
        dimensions: { width: 1600, height: 900, unit: 'px' },
        fileFormat: "JPEG",
        resolution: { width: 1600, height: 900 }
      }
    ];

    const createdArtworks = await Artwork.insertMany(sampleArtworks);
    
    console.log(`✅ Added ${createdArtworks.length} sample artworks to database`);
    
    res.json({ 
      message: 'Sample artworks added successfully!', 
      count: createdArtworks.length,
      artworks: createdArtworks 
    });
  } catch (error) {
    console.error('❌ Error adding sample artworks:', error);
    res.status(500).json({ error: 'Failed to add sample artworks' });
  }
});

// COUNT view for an artwork

router.post('/:id/view', async (req, res) => {
  try {
    const { clerkUserId } = req.body; // Optional: track which user viewed

    console.log('👁️ View request for artwork:', req.params.id);
    
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) {
      return res.status(404).json({ 
        success: false,
        error: 'Artwork not found' 
      });
    }

    // Increment views
    const newViewCount = await artwork.incrementViews();
    
    console.log(`✅ View counted for "${artwork.title}". Total views: ${newViewCount}`);

    res.json({
      success: true,
      views: newViewCount,
      message: 'View counted successfully'
    });

  } catch (error) {
    console.error('❌ Error counting view:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to count view',
      details: error.message 
    });
  }
});

// GET user's artworks
router.get('/user/:clerkUserId', async (req, res) => {
  try {
    const { clerkUserId } = req.params;
    
    const artworks = await Artwork.find({ clerkUserId })
      .select('title imageUrl artistName tags createdAt likes views')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      artworks
    });
  } catch (error) {
    console.error('Error fetching user artworks:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch user artworks' 
    });
  }
});

export default router;