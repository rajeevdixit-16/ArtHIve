import mongoose from 'mongoose';

const artworkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  imageUrl: {
    type: String,
    required: [true, 'Image URL is required']
  },
  cloudinaryId: {
    type: String,
    required: [true, 'Cloudinary ID is required']
  },
  
  // Updated user reference fields
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  clerkUserId: {
    type: String,
    required: [true, 'Clerk User ID is required']
  },
  artistName: {
    type: String,
    required: [true, 'Artist name is required'],
    trim: true
  },
  
  tags: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['digital', 'photography', 'painting', '3d', 'abstract', 'illustration', 'vector', 'print'],
      message: 'Category must be digital, photography, painting, 3d, abstract, illustration, vector, or print'
    }
  },
  
  // Engagement metrics
  likes: [{
  type: String, // storing clerkUserId
  required: true
  }],
  views: {
    type: Number,
    default: 0
  },
  downloads: {
    type: Number,
    default: 0
  },
  
  // Visibility and licensing
  isPublic: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  licenseType: {
    type: String,
    enum: ['free', 'premium', 'commercial'],
    default: 'free'
  },
  
  // Pricing
  price: {
    type: Number,
    min: 0,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  
  // Technical details
  dimensions: {
    width: Number,
    height: Number,
    unit: {
      type: String,
      default: 'cm'
    }
  },
  fileSize: {
    type: Number, // in bytes
    default: 0
  },
  fileFormat: {
    type: String,
    default: 'JPEG'
  },
  resolution: {
    width: Number,
    height: Number
  },
  
  // AI and metadata
  aiGenerated: {
    type: Boolean,
    default: false
  },
  aiModel: {
    type: String,
    default: ''
  },
  colorPalette: [{
    type: String
  }],
  
  // Collections and organization
  collectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collection'
  },
  
  // Moderation
  status: {
    type: String,
    enum: ['draft', 'published', 'archived', 'flagged'],
    default: 'published'
  },
  moderationNotes: {
    type: String,
    maxlength: [500, 'Moderation notes cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Indexes for better performance
artworkSchema.index({ title: 'text', description: 'text', tags: 'text' });
artworkSchema.index({ category: 1, createdAt: -1 });
artworkSchema.index({ userId: 1, createdAt: -1 });
artworkSchema.index({ clerkUserId: 1, createdAt: -1 });
artworkSchema.index({ likes: -1 });
artworkSchema.index({ views: -1 });
artworkSchema.index({ price: -1 });
artworkSchema.index({ status: 1 });
artworkSchema.index({ isPublic: 1, status: 1 });

// Virtual for formatted date
artworkSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

artworkSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

// Virtual for aspect ratio
artworkSchema.virtual('aspectRatio').get(function() {
  if (this.dimensions.width && this.dimensions.height) {
    return (this.dimensions.width / this.dimensions.height).toFixed(2);
  }
  if (this.resolution.width && this.resolution.height) {
    return (this.resolution.width / this.resolution.height).toFixed(2);
  }
  return null;
});

// Virtual for image dimensions string
artworkSchema.virtual('dimensionsString').get(function() {
  if (this.dimensions.width && this.dimensions.height) {
    return `${this.dimensions.width} × ${this.dimensions.height} ${this.dimensions.unit}`;
  }
  return null;
});

// Virtual for resolution string
artworkSchema.virtual('resolutionString').get(function() {
  if (this.resolution.width && this.resolution.height) {
    return `${this.resolution.width} × ${this.resolution.height} px`;
  }
  return null;
});

// Method to increment views
artworkSchema.methods.incrementViews = async function() {
  this.views += 1;
  await this.save();
  return this.views;
};

// Virtual for formatted views

artworkSchema.virtual('formattedViews').get(function() {
  if (this.views >= 1000000) {
    return (this.views / 1000000).toFixed(1) + 'M';
  } else if (this.views >= 1000) {
    return (this.views / 1000).toFixed(1) + 'K';
  }
  return this.views.toString();
});

// Method to toggle like (returns new like count)
artworkSchema.methods.toggleLike = async function(clerkUserId) {
  const likeIndex = this.likes.indexOf(clerkUserId);
  
  if (likeIndex > -1) {
    // Unlike - remove user from likes array
    this.likes.splice(likeIndex, 1);
  } else {
    // Like - add user to likes array
    this.likes.push(clerkUserId);
  }
  
  await this.save();
  return {
    likes: this.likes.length,
    liked: likeIndex === -1 // true if now liked, false if now unliked
  };
};

// Method to check if a user has liked the artwork
artworkSchema.methods.hasLiked = function(clerkUserId) {
  return this.likes.includes(clerkUserId);
};

// Static method to find by Clerk User ID
artworkSchema.statics.findByClerkUserId = function(clerkUserId, options = {}) {
  return this.find({ clerkUserId, ...options })
    .populate('userId', 'username firstName lastName profileImage')
    .sort({ createdAt: -1 });
};

// Static method to find public artworks
artworkSchema.statics.findPublic = function(query = {}) {
  return this.find({ 
    ...query, 
    isPublic: true, 
    status: 'published' 
  })
    .populate('userId', 'username firstName lastName profileImage')
    .sort({ createdAt: -1 });
};

// Static method to get user's artwork count
artworkSchema.statics.getUserArtworkCount = async function(userId) {
  return this.countDocuments({ 
    userId, 
    status: 'published' 
  });
};

// Middleware to update user stats when artwork is saved
artworkSchema.post('save', async function() {
  if (this.status === 'published') {
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(this.userId, {
      $inc: { 'stats.artworksCount': 1 }
    });
  }
});

// Middleware to update user stats when artwork is deleted
artworkSchema.post('findOneAndDelete', async function(doc) {
  if (doc && doc.status === 'published') {
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(doc.userId, {
      $inc: { 'stats.artworksCount': -1 }
    });
  }
});

export default mongoose.model('Artwork', artworkSchema);