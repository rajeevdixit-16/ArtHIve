import express from 'express';
import Comment from '../models/Comment.js';
import Artwork from '../models/Artwork.js';
import User from '../models/User.js';

const router = express.Router();

// Get comments for an artwork with pagination
router.get('/artwork/:artworkId', async (req, res) => {
  try {
    const { artworkId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Validate artwork exists
    const artwork = await Artwork.findById(artworkId);
    if (!artwork) {
      return res.status(404).json({ error: 'Artwork not found' });
    }

    const result = await Comment.getCommentsForArtwork(artworkId, parseInt(page), parseInt(limit));
    res.json(result);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Create a new comment
router.post('/', async (req, res) => {
  try {
    const { artworkId, clerkUserId, content, parentCommentId } = req.body;

    // Validate required fields
    if (!artworkId || !clerkUserId || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate content length
    if (content.trim().length === 0 || content.length > 1000) {
      return res.status(400).json({ error: 'Comment must be between 1 and 1000 characters' });
    }

    // Verify artwork exists
    const artwork = await Artwork.findById(artworkId);
    if (!artwork) {
      return res.status(404).json({ error: 'Artwork not found' });
    }

    // Get user data
    const user = await User.findOne({ clerkUserId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check for parent comment if replying
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({ error: 'Parent comment not found' });
      }
    }

    // Create comment
    const newComment = new Comment({
      artworkId,
      clerkUserId,
      author: user._id,
      authorName: user.username,
      authorImage: user.profileImage,
      content: content.trim(),
      parentComment: parentCommentId || null,
      status: 'approved'
    });

    await newComment.save();

    // If replying to a comment, add to parent's replies
    if (parentCommentId) {
      await Comment.findByIdAndUpdate(parentCommentId, {
        $push: { replies: newComment._id }
      });
    }

    res.status(201).json(newComment.toJSON());
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// Update a comment
router.put('/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { clerkUserId, content } = req.body;

    // Validate content
    if (!content || content.trim().length === 0 || content.length > 1000) {
      return res.status(400).json({ error: 'Comment must be between 1 and 1000 characters' });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Verify ownership
    if (comment.clerkUserId !== clerkUserId) {
      return res.status(403).json({ error: 'Unauthorized to edit this comment' });
    }

    // Update comment
    comment.content = content.trim();
    comment.isEdited = true;
    comment.editedAt = new Date();

    await comment.save();
    res.json(comment.toJSON());
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

// Delete a comment (soft delete)
router.delete('/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { clerkUserId } = req.body;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Verify ownership
    if (comment.clerkUserId !== clerkUserId) {
      return res.status(403).json({ error: 'Unauthorized to delete this comment' });
    }

    // Soft delete
    comment.isDeleted = true;
    await comment.save();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// Like/Unlike a comment
router.post('/:commentId/like', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { clerkUserId } = req.body;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const likeIndex = comment.likes.indexOf(clerkUserId);
    if (likeIndex > -1) {
      comment.likes.splice(likeIndex, 1);
    } else {
      comment.likes.push(clerkUserId);
    }

    await comment.save();
    res.json({ 
      likesCount: comment.likes.length,
      isLiked: likeIndex === -1
    });
  } catch (error) {
    console.error('Error liking comment:', error);
    res.status(500).json({ error: 'Failed to like comment' });
  }
});

// Flag a comment for moderation
router.post('/:commentId/flag', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Flag reason is required' });
    }

    const comment = await Comment.findByIdAndUpdate(
      commentId,
      {
        status: 'flagged',
        flagReason: reason
      },
      { new: true }
    );

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    res.json({ message: 'Comment flagged for review' });
  } catch (error) {
    console.error('Error flagging comment:', error);
    res.status(500).json({ error: 'Failed to flag comment' });
  }
});

export default router;
