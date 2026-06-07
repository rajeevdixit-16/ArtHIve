import express from 'express';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Sync user data from Clerk to MongoDB
router.post('/sync', async (req, res) => {
  try {
    const { 
      clerkUserId, 
      email, 
      username, 
      firstName, 
      lastName, 
      profileImage,
      lastSignInAt,
      externalAccounts 
    } = req.body;

    if (!clerkUserId || !email) {
      return res.status(400).json({ error: 'clerkUserId and email are required' });
    }

    // static method from User model
    const user = await User.findOrCreateFromClerk({
      id: clerkUserId,
      primaryEmailAddress: { emailAddress: email },
      username: username,
      firstName: firstName,
      lastName: lastName,
      profileImageUrl: profileImage,
      lastSignInAt: lastSignInAt,
      externalAccounts: externalAccounts
    });

    res.status(200).json({ 
      message: 'User synced successfully', 
      user: user.toPublicJSON ? user.toPublicJSON() : user 
    });
  } catch (error) {
    console.error('User sync error:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ 
        error: `${field} already exists` 
      });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate and send verification code
router.post('/send-verification-code', async (req, res) => {
  try {
    const { email, clerkUserId } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user by email
    let user = await User.findOne({ email: email.toLowerCase() });
    
    // If user doesn't exist yet (just signed up), create them
    if (!user) {
      if (!clerkUserId) {
        return res.status(404).json({ error: 'User not found and clerkUserId not provided' });
      }
      
      // Create user with basic info from Clerk
      user = new User({
        clerkUserId,
        email: email.toLowerCase(),
        username: email.split('@')[0] // Use email prefix as default username
      });
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store code in database
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = expiryTime;
    user.verificationAttempts = 0;
    await user.save();

    // TODO: Send email with verification code
    // For now, just return the code (in production, send via email service)
    console.log(`✅ Verification code for ${email}: ${verificationCode}`);

    res.status(200).json({ 
      message: 'Verification code sent to email'
    });
  } catch (error) {
    console.error('Error sending verification code:', error);
    res.status(500).json({ error: 'Failed to send verification code', details: error.message });
  }
});

// Verify email with code
router.post('/verify-email', async (req, res) => {
  try {
    const { email, verificationCode } = req.body;

    if (!email || !verificationCode) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if code is expired
    if (!user.verificationCodeExpires || new Date() > user.verificationCodeExpires) {
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    // Check if code matches
    if (user.verificationCode !== verificationCode) {
      user.verificationAttempts = (user.verificationAttempts || 0) + 1;
      
      // Lock account after 5 failed attempts
      if (user.verificationAttempts >= 5) {
        return res.status(429).json({ error: 'Too many failed attempts. Please try again later.' });
      }
      
      await user.save();
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Mark as verified
    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    user.verificationAttempts = 0;
    await user.save();

    res.status(200).json({ 
      message: 'Email verified successfully',
      user: user.toPublicJSON()
    });
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

// Resend verification code
router.post('/resend-verification-code', async (req, res) => {
  try {
    const { email, clerkUserId } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    let user = await User.findOne({ email: email.toLowerCase() });
    
    // If user doesn't exist yet (just signed up), create them
    if (!user) {
      if (!clerkUserId) {
        return res.status(404).json({ error: 'User not found and clerkUserId not provided' });
      }
      user = new User({
        clerkUserId,
        email: email.toLowerCase(),
        username: email.split('@')[0]
      });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    // Generate new code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryTime = new Date(Date.now() + 15 * 60 * 1000);

    user.verificationCode = verificationCode;
    user.verificationCodeExpires = expiryTime;
    user.verificationAttempts = 0;
    await user.save();

    console.log(`✅ New verification code for ${email}: ${verificationCode}`);

    res.status(200).json({ 
      message: 'Verification code resent to email'
    });
  } catch (error) {
    console.error('Error resending verification code:', error);
    res.status(500).json({ 
      error: 'Failed to resend verification code',
      details: error.message 
    });
  }
});

router.get('/clerk/:clerkUserId', async (req, res) => {
  try {
    const user = await User.findOne({ clerkUserId: req.params.clerkUserId });
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    
    // Update user stats before returning
    await user.updateStats();
    
    res.status(200).json(user.toPublicJSON ? user.toPublicJSON() : user);
  } catch (error) {
    console.error('Get user by Clerk ID error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get user by ID
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(200).json(user.toPublicJSON ? user.toPublicJSON() : user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/:userId', protect, async (req, res) => {
  try {
    const { 
      username, 
      firstName, 
      lastName, 
      bio, 
      website, 
      socialLinks,
      preferences 
    } = req.body;

    if (req.user._id.toString() !== req.params.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update allowed fields
    const updateData = {};
    if (username !== undefined) updateData.username = username;
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (bio !== undefined) updateData.bio = bio;
    if (website !== undefined) updateData.website = website;
    if (socialLinks !== undefined) updateData.socialLinks = socialLinks;
    if (preferences !== undefined) updateData.preferences = preferences;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({ 
      message: 'Profile updated successfully', 
      user: updatedUser.toPublicJSON ? updatedUser.toPublicJSON() : updatedUser 
    });
  } catch (error) {
    console.error('Update user error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ 
        error: `${field} already exists` 
      });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user role
router.patch('/:userId/role', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { role } = req.body;
    
    if (!['user', 'artist', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ 
      message: 'Role updated successfully', 
      user: user.toPublicJSON ? user.toPublicJSON() : user 
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user statistics
router.get('/:userId/stats', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update stats before returning
    await user.updateStats();

    res.status(200).json({
      stats: user.stats,
      role: user.role,
      joinedDate: user.createdAt
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search users
router.get('/', async (req, res) => {
  try {
    const { search, role, page = 1, limit = 10 } = req.query;
    
    const query = {};
    
    // Search by username, firstName, lastName, or email
    if (search) {
      const escaped = escapeRegex(search);
      query.$or = [
        { username: { $regex: escaped, $options: 'i' } },
        { firstName: { $regex: escaped, $options: 'i' } },
        { lastName: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } }
      ];
    }
    
    // Filter by role
    if (role && ['user', 'artist', 'admin'].includes(role)) {
      query.role = role;
    }
    
    // Only active users
    query.isActive = true;

    const users = await User.find(query)
      .select('username firstName lastName profileImage role stats createdAt')
      .limit(parseInt(limit) * 1)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.status(200).json({
      users,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      totalUsers: total
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Deactivate user account
router.patch('/:userId/deactivate', protect, async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'User account deactivated successfully' });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reactivate user account
router.patch('/:userId/reactivate', protect, async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isActive: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'User account reactivated successfully' });
  } catch (error) {
    console.error('Reactivate user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;