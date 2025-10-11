
import express from 'express';
import Follow from '../models/Follow.js';
import User from '../models/User.js';

const router = express.Router();


router.post('/:artistId', async (req, res) => {
  try {
    const { artistId } = req.params; 
    const { followerId } = req.body;   

    console.log('🔄 Follow request:', { artistId, followerId });

    if (!artistId || !followerId) {
      return res.status(400).json({ success: false, error: 'artistId and followerId are required' });
    }

    const artist = await User.findOne({ clerkUserId: artistId });
    const follower = await User.findOne({ clerkUserId: followerId });
    
    if (!artist || !follower) {
      return res.status(404).json({ success: false, error: 'Artist or follower not found' });
    }

    if (await Follow.findOne({ followerId, followingId: artistId })) {
      return res.status(400).json({ success: false, error: 'Already following this artist' });
    }

    const follow = new Follow({
      followerId,
      followingId: artistId,
      followerUser: follower._id,
      followingUser: artist._id
    });
    await follow.save();

    // Update stats
    artist.stats.followersCount += 1;
    follower.stats.followingCount += 1;
    await Promise.all([artist.save(), follower.save()]);

    console.log('✅ Follow created successfully');
    res.status(201).json({ success: true, message: 'Successfully followed artist' });

  } catch (error) {
    console.error('❌ Error following artist:', error);
    res.status(500).json({ success: false, error: 'Failed to follow artist' });
  }
});

router.delete('/:artistId', async (req, res) => {
  try {
    const { artistId } = req.params; 
    const { followerId } = req.body;   

    console.log('🔄 Unfollow request:', { artistId, followerId });

    if (!artistId || !followerId) {
      return res.status(400).json({ success: false, error: 'artistId and followerId are required' });
    }

    const follow = await Follow.findOneAndDelete({ followerId, followingId: artistId });

    if (!follow) {
      return res.status(404).json({ success: false, error: 'Follow relationship not found' });
    }

    
    await User.updateOne({ clerkUserId: artistId }, { $inc: { 'stats.followersCount': -1 } });
    await User.updateOne({ clerkUserId: followerId }, { $inc: { 'stats.followingCount': -1 } });

    console.log('✅ Unfollowed successfully');
    res.json({ success: true, message: 'Successfully unfollowed artist' });

  } catch (error) {
    console.error('❌ Error unfollowing artist:', error);
    res.status(500).json({ success: false, error: 'Failed to unfollow artist' });
  }
});

router.get('/status/:artistId/:followerId', async (req, res) => {
  try {
    const { artistId, followerId } = req.params;

    const artist = await User.findOne({ clerkUserId: artistId });
    if (!artist) {
      return res.json({ success: true, isFollowing: false, artistExists: false });
    }

    const follow = await Follow.findOne({ followerId, followingId: artistId });
    res.json({ success: true, isFollowing: !!follow, artistExists: true });

  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to check status' });
  }
});

router.get('/following/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const follows = await Follow.find({ followerId: userId }).populate('followingUser');
    
    const following = follows.map(f => f.followingUser).filter(Boolean);
    
    res.json({
      success: true,
      following: following.map(user => ({
        clerkUserId: user.clerkUserId, 
        name: user.name,
        username: user.username
        
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch following list' });
  }
});

router.get('/followers/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const follows = await Follow.find({ followingId: userId }).populate('followerUser');
    const followers = follows.map(f => f.followerUser).filter(Boolean); // Filter out null/deleted users
    res.json({ success: true, followers });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch followers list' });
  }
});

export default router;