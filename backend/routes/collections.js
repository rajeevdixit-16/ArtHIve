// routes/collections.js
import express from 'express';
import mongoose from 'mongoose';
import Collection from '../models/Collection.js';
import Artwork from '../models/Artwork.js';
import User from '../models/User.js';

const router = express.Router();

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET all public collections
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 12, search, category } = req.query;

    const query = { isPublic: true };

    if (search) {
      const escaped = escapeRegex(search);
      query.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } },
        { tags: { $in: [new RegExp(escaped, 'i')] } }
      ];
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    const collections = await Collection.find(query)
      .populate('owner', 'username firstName lastName profileImage')
      .populate('artworks', 'title imageUrl artistName likes')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Collection.countDocuments(query);

    res.json({
      collections,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalCollections: total,
        hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});



// CREATE new collection
router.post('/', async (req, res) => {
  try {
    const { name, description, isPublic, clerkUserId } = req.body;

    if (!clerkUserId) {
      return res.status(400).json({ error: 'clerkUserId is required' });
    }

    const user = await User.findOne({ clerkUserId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const collection = new Collection({
      name,
      description: description || '',
      isPublic: isPublic !== false,
      owner: user._id,
      clerkUserId,
    });
    await collection.save();

    await user.updateStats();

    await collection.populate('owner', 'username profileImage');

    res.status(201).json({
      success: true,
      message: 'Collection created successfully',
      collection
    });
  } catch (error) {
    console.error('Error creating collection:', error);
    res.status(500).json({ error: 'Failed to create collection' });
  }
});

// GET user's collections
router.get('/user/:clerkUserId', async (req, res) => {
  try {
    const { clerkUserId } = req.params;

    const collections = await Collection.findByUserId(clerkUserId);

    res.json({
      success: true,
      collections
    });
  } catch (error) {
    console.error('Error fetching user collections:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch user collections' 
    });
  }
});

// GET single collection by ID 
router.get('/:id', async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id)
      .populate('owner', 'username firstName lastName profileImage bio socialLinks')
      .populate('artworks');

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const { clerkUserId } = req.query; 
    
    if (!collection.isPublic) {
      if (!clerkUserId || collection.clerkUserId !== clerkUserId) {
        return res.status(403).json({ error: 'Access denied. This is a private collection.' });
      }
    }

    res.json(collection);
  } catch (error) {
    console.error('Error fetching collection:', error);
    res.status(500).json({ error: 'Failed to fetch collection' });
  }
});

// GET user's artworks for adding to collection (SIMPLIFIED VERSION)
router.get('/:id/available-artworks', async (req, res) => {
  try {
    const { id } = req.params;
    const { clerkUserId } = req.query;

    console.log('🔄 Fetching available artworks for collection:', id, 'user:', clerkUserId);

    if (!clerkUserId) {
      return res.status(400).json({ 
        success: false,
        error: 'clerkUserId is required' 
      });
    }

    // Get the collection
    const collection = await Collection.findById(id);
    if (!collection) {
      return res.status(404).json({ 
        success: false,
        error: 'Collection not found' 
      });
    }

    // Check ownership
    if (collection.clerkUserId !== clerkUserId) {
      return res.status(403).json({ 
        success: false,
        error: 'Not authorized to modify this collection' 
      });
    }

    // Get ALL user's artworks
    const userArtworks = await Artwork.find({ clerkUserId })
      .select('title imageUrl artistName tags createdAt likes views')
      .sort({ createdAt: -1 });

    console.log('📊 User artworks found:', userArtworks.length);

    // Filter out artworks already in this collection
    const availableArtworks = userArtworks.filter(artwork => {
      const isInCollection = collection.artworks.some(artworkId => 
        artworkId.toString() === artwork._id.toString()
      );
      return !isInCollection;
    });

    console.log('✅ Available artworks:', availableArtworks.length);

    res.json({
      success: true,
      artworks: availableArtworks,
      totalAvailable: availableArtworks.length,
      userArtworksCount: userArtworks.length
    });

  } catch (error) {
    console.error('❌ Error fetching available artworks:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch available artworks',
      details: error.message 
    });
  }
});

// UPDATE collection
router.put('/:id', async (req, res) => {
  try {
    const { name, description, isPublic, tags, category, clerkUserId } = req.body;

    if (!clerkUserId) {
      return res.status(400).json({ error: 'clerkUserId is required' });
    }

    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Check ownership
    if (collection.clerkUserId !== clerkUserId) {
      return res.status(403).json({ error: 'Not authorized to update this collection' });
    }

    // Update allowed fields
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (isPublic !== undefined) updates.isPublic = isPublic;
    if (tags !== undefined) updates.tags = tags;
    if (category !== undefined) updates.category = category;

    const updatedCollection = await Collection.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('owner', 'username firstName lastName profileImage')
     .populate('artworks', 'title imageUrl artistName likes views');

    res.json({
      success: true,
      message: 'Collection updated successfully',
      collection: updatedCollection
    });
  } catch (error) {
    console.error('Error updating collection:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    res.status(500).json({ error: 'Failed to update collection' });
  }
});


// DELETE collection
router.delete('/:id', async (req, res) => {
  try {
    const { clerkUserId } = req.body;
    const { id } = req.params;

    const collection = await Collection.findById(id);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (collection.clerkUserId !== clerkUserId) {
      return res.status(403).json({ error: 'Not authorized to delete this collection' });
    }
    
    // Find the owner before deleting the collection
    const owner = await User.findById(collection.owner);

    // Now, delete the collection
    await Collection.findByIdAndDelete(id);

    if (owner) {
      await owner.updateStats();
    }

    res.json({
      success: true,
      message: 'Collection deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting collection:', error);
    res.status(500).json({ error: 'Failed to delete collection' });
  }
});
// ADD artwork to collection
router.post('/:id/artworks', async (req, res) => {
  try {
    const { artworkId, clerkUserId } = req.body;

    if (!clerkUserId) {
      return res.status(400).json({ error: 'clerkUserId is required' });
    }

    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Check ownership
    if (collection.clerkUserId !== clerkUserId) {
      return res.status(403).json({ error: 'Not authorized to modify this collection' });
    }

    // Check if artwork exists
    const artwork = await Artwork.findById(artworkId);
    if (!artwork) {
      return res.status(404).json({ error: 'Artwork not found' });
    }

    // Add artwork to collection
    await collection.addArtwork(artworkId);

    // Update cover image if this is the first artwork
    if (collection.artworks.length === 1) {
      await collection.updateCoverImage();
    }

    // Populate for response
    await collection.populate('artworks', 'title imageUrl artistName likes views');

    res.json({
      success: true,
      message: 'Artwork added to collection',
      collection
    });
  } catch (error) {
    console.error('Error adding artwork to collection:', error);
    res.status(500).json({ error: 'Failed to add artwork to collection' });
  }
});

// REMOVE artwork from collection
router.delete('/:id/artworks/:artworkId', async (req, res) => {
  try {
    const { clerkUserId } = req.body;
    const { id, artworkId } = req.params;

    if (!clerkUserId) {
      return res.status(400).json({ error: 'clerkUserId is required' });
    }

    const collection = await Collection.findById(id);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Check ownership
    if (collection.clerkUserId !== clerkUserId) {
      return res.status(403).json({ error: 'Not authorized to modify this collection' });
    }

    // Remove artwork from collection
    await collection.removeArtwork(artworkId);

    // Update cover image if needed
    if (collection.artworks.length === 0) {
      collection.coverImage = '';
      await collection.save();
    }

    // Populate for response
    await collection.populate('artworks', 'title imageUrl artistName likes views');

    res.json({
      success: true,
      message: 'Artwork removed from collection',
      collection
    });
  } catch (error) {
    console.error('Error removing artwork from collection:', error);
    res.status(500).json({ error: 'Failed to remove artwork from collection' });
  }
});



export default router;