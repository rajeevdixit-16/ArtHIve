import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  artworkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artwork',
    required: [true, 'Artwork ID is required']
  },
  clerkUserId: {
    type: String,
    required: [true, 'User ID is required']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: {
    type: String,
    required: true
  },
  authorImage: {
    type: String,
    default: ''
  },
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    minlength: [1, 'Comment cannot be empty'],
    maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    trim: true
  },
  likes: [{
    type: String // Clerk User ID
  }],
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'flagged'],
    default: 'approved'
  },
  flagReason: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
commentSchema.index({ artworkId: 1, createdAt: -1 });
commentSchema.index({ clerkUserId: 1 });
commentSchema.index({ author: 1 });

// Method to get comment with like count
commentSchema.methods.toJSON = function() {
  return {
    _id: this._id,
    artworkId: this.artworkId,
    clerkUserId: this.clerkUserId,
    author: this.author,
    authorName: this.authorName,
    authorImage: this.authorImage,
    content: this.content,
    likes: this.likes,
    likesCount: this.likes.length,
    repliesCount: this.replies.length,
    isDeleted: this.isDeleted,
    isEdited: this.isEdited,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Static method to get comments for artwork with pagination
commentSchema.statics.getCommentsForArtwork = async function(artworkId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  const comments = await this.find({ 
    artworkId, 
    parentComment: null, 
    isDeleted: false,
    status: { $ne: 'flagged' }
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('author', 'username profileImage')
    .lean();

  const total = await this.countDocuments({ 
    artworkId, 
    parentComment: null,
    isDeleted: false,
    status: { $ne: 'flagged' }
  });

  const enriched = comments.map(c => ({
    ...c,
    likesCount: c.likes?.length || 0,
    repliesCount: c.replies?.length || 0
  }));

  return {
    comments: enriched,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit)
    }
  };
};

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;
