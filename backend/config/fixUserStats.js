import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js'; // Ensure you import your User model
import Artwork from '../models/Artwork.js'; // Ensure you import your Artwork model
import Follow from '../models/Follow.js';
import Collection from '../models/Collection.js';

dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Please set MONGODB_URI in your .env file');
  process.exit(1);
}

async function fixStats() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully.');

    const users = await User.find({}); // Get all users

    for (const user of users) {
      console.log(`Processing user: ${user.email} (Clerk ID: ${user.clerkUserId})`);
      await user.updateStats(); // Call the updateStats method for each user
      console.log(`Updated stats for ${user.email}. New artwork count: ${user.stats.artworksCount}`);
    }

    console.log('All user stats have been re-calculated and updated.');

  } catch (error) {
    console.error('Error fixing user stats:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
}

fixStats();