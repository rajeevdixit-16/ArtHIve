
import express from 'express';
import SavedArtwork from '../models/SavedArtwork.js';
import SavedCollection from '../models/SavedCollection.js';
import Artwork from '../models/Artwork.js';
import Collection from '../models/Collection.js';

const router = express.Router();

router.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('✅ Request reached saved.js router:', req.path);
  }
  next();
});

router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params; // This is clerkUserId
    console.log('🔄 Fetching saved items for user:', userId);

    // Get saved artworks with full artwork data
    const savedArtworks = await SavedArtwork.find({ userId })
      .populate({
        path: 'artworkId',
        match: { isDeleted: { $ne: true } }, // Only include non-deleted artworks
        populate: {
          path: 'userId',
          select: 'username firstName lastName profileImage clerkUserId'
        }
      })
      .sort({ savedAt: -1 });

    // Get saved collections with full collection data
    const savedCollections = await SavedCollection.find({ userId })
      .populate({
        path: 'collectionId',
        match: { isDeleted: { $ne: true } }, 
        populate: {
          path: 'artworks',
          select: 'imageUrl title'
        }
      })
      .sort({ savedAt: -1 });

    const artworks = savedArtworks
      .map(sa => sa.artworkId)
      .filter(artwork => artwork !== null);

    const collections = savedCollections
      .map(sc => sc.collectionId)
      .filter(collection => collection !== null);

    console.log(`✅ Found ${artworks.length} saved artworks and ${collections.length} saved collections for user ${userId}`);

    res.json({
      success: true,
      artworks,
      collections
    });

  } catch (error) {
    console.error('❌ Error fetching saved items:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch saved items' 
    });
  }
});

// Save an artwork
router.post('/artworks/:artworkId', async (req, res) => {
  try {
    const { artworkId } = req.params;
    const { userId } = req.body; // clerkUserId

    console.log('🔄 Saving artwork:', { artworkId, userId });

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID is required' 
      });
    }

    // Check if artwork exists
    const artwork = await Artwork.findById(artworkId);
    if (!artwork || artwork.isDeleted) {
      return res.status(404).json({ 
        success: false, 
        error: 'Artwork not found' 
      });
    }

    // Check if already saved
    const existingSave = await SavedArtwork.findOne({ 
      userId, 
      artworkId 
    });

    if (existingSave) {
      return res.status(400).json({ 
        success: false, 
        error: 'Artwork already saved' 
      });
    }

    // Create new saved artwork
    const savedArtwork = new SavedArtwork({
      userId,
      artworkId
    });

    await savedArtwork.save();

    console.log('✅ Artwork saved successfully');
    res.status(201).json({
      success: true,
      message: 'Artwork saved successfully',
      savedArtwork: {
        id: savedArtwork._id,
        artworkId: savedArtwork.artworkId,
        userId: savedArtwork.userId,
        savedAt: savedArtwork.savedAt
      }
    });

  } catch (error) {
    console.error('❌ Error saving artwork:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        error: 'Artwork already saved' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save artwork' 
    });
  }
});

// Unsave an artwork
router.delete('/artworks/:artworkId', async (req, res) => {
  try {
    const { artworkId } = req.params;
    const { userId } = req.body; // clerkUserId

    console.log('🔄 Unsaving artwork:', { artworkId, userId });

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID is required' 
      });
    }

    const result = await SavedArtwork.findOneAndDelete({ 
      userId, 
      artworkId 
    });

    if (!result) {
      return res.status(404).json({ 
        success: false, 
        error: 'Saved artwork not found' 
      });
    }

    console.log('✅ Artwork unsaved successfully');
    res.json({
      success: true,
      message: 'Artwork removed from saved'
    });

  } catch (error) {
    console.error('❌ Error unsaving artwork:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to remove artwork from saved' 
    });
  }
});

//Check if artwork is saved
router.get('/artworks/:artworkId/status', async (req, res) => {
  try {
    const { artworkId } = req.params;
    const { userId } = req.query; // clerkUserId from query params

    console.log('🔍 Checking save status:', { artworkId, userId });

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID is required' 
      });
    }

    const savedArtwork = await SavedArtwork.findOne({ 
      userId, 
      artworkId 
    });

    res.json({
      success: true,
      isSaved: !!savedArtwork
    });

  } catch (error) {
    console.error('❌ Error checking save status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to check save status' 
    });
  }
});

router.post('/collections/:collectionId', async (req, res) => {
  try {
    const { collectionId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }

    const collection = await Collection.findById(collectionId);
    if (!collection) {
      return res.status(404).json({ success: false, error: 'Collection not found' });
    }

    const existing = await SavedCollection.findOne({ userId, collectionId });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Collection already saved' });
    }

    const saved = await SavedCollection.create({ userId, collectionId });

    console.log('🔄 Collection saved:', { collectionId, userId });

    res.status(201).json({
      success: true,
      message: 'Collection saved successfully',
      saved
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Collection already saved' });
    }
    console.error('❌ Error saving collection:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save collection' 
    });
  }
});

export default router;