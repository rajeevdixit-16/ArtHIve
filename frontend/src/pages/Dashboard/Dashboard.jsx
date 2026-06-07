import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { artworkAPI } from "../../utils/api";
import { likeService } from "../../services/likeService";
import { viewService } from "../../services/viewService";
import { collectionService } from "../../services/collectionService";
import { followService } from "../../services/followService";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [userArtworks, setUserArtworks] = useState([]);
  const [userCollections, setUserCollections] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    totalArtworks: 0,
    totalLikes: 0,
    totalViews: 0,
    totalCollections: 0,
    totalFollowers: 0,
    totalFollowing: 0
  });

  // Modal state
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [likingArtwork, setLikingArtwork] = useState(null);

  // Real-time activities state
  const [activities, setActivities] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Update activity timers every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(Date.now());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // In Dashboard.jsx

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");
      console.log('🔄 Fetching dashboard data for user:', user.id);

      // Use Promise.all to run all fetch requests in parallel for speed
      const [
        userResponse,
        artworksResponse,
        collectionsResponse,
        followersResponse,
        followingResponse
      ] = await Promise.all([
        fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/users/clerk/${user.id}`),
        fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/artworks/user/${user.id}`),
        collectionService.getUserCollections(user.id),
        fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/follow/followers/${user.id}`),
        fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/follow/following/${user.id}`),
      ]);

      // Now that all data is fetched, process it

      let artworksData = [], collectionsData = [], followersData = [], followingData = [];
      let statsUpdate = {};

      // Process User & Stats
      if (userResponse.ok) {
        const userData = await userResponse.json();
        console.log("This is data : ", userData);
        statsUpdate = {
          totalArtworks: userData.stats?.artworksCount || 0,
          totalFollowers: userData.stats?.followersCount || 0,
          totalFollowing: userData.stats?.followingCount || 0,
          totalCollections: userData.stats?.collectionsCount || 0,
          totalLikes: userData.stats?.totalLikes || 0,
        };
      }

      // Process Artworks
      if (artworksResponse.ok) {
        const artData = await artworksResponse.json();
        artworksData = artData.artworks || [];
        const totalViews = artworksData.reduce((sum, art) => sum + (art.views || 0), 0);
        statsUpdate.totalViews = totalViews;
        setUserArtworks(artworksData);
      }

      // Process Collections
      if (collectionsResponse.collections) {
        collectionsData = collectionsResponse.collections || [];
        setUserCollections(collectionsData);
      }

      // Process Followers
      if (followersResponse.ok) {
        const followersJson = await followersResponse.json();
        followersData = followersJson.followers || [];
        setFollowers(followersData);
      }

      // Process Following
      if (followingResponse.ok) {
        const followingJson = await followingResponse.json();
        followingData = followingJson.following || [];
        setFollowing(followingData);
      }

      // Set all stats at once
      setStats(prev => ({ ...prev, ...statsUpdate }));

      generateRealTimeActivities(artworksData, collectionsData, followersData);

    } catch (err) {
      console.error("❌ Error fetching dashboard data:", err);
      setError("Failed to load dashboard data");
      // Reset state on error
    } finally {
      setLoading(false);
    }
  };

  // Generate real-time activities with proper timestamp handling
  const generateRealTimeActivities = (artworks, collections, followers) => {
    const newActivities = [];
    const now = Date.now();

    console.log('Generating real-time activities...');

    // Add recent artwork uploads
    const recentArtworks = artworks.slice(0, 2);
    recentArtworks.forEach(artwork => {
      try {
        let timestamp;
        if (artwork.createdAt) {
          timestamp = new Date(artwork.createdAt).getTime();
          if (isNaN(timestamp)) {
            timestamp = now;
          }
        } else {
          timestamp = now;
        }

        newActivities.push({
          id: `artwork-${artwork._id}`,
          action: `Uploaded '${artwork.title}'`,
          timestamp: timestamp,
          icon: '🎨',
          type: 'artwork_upload'
        });
      } catch (error) {
        console.error('Error processing artwork activity:', error);
      }
    });

    // Add recent collections
    const recentCollections = collections.slice(0, 2);
    recentCollections.forEach(collection => {
      try {
        let timestamp;
        if (collection.createdAt) {
          timestamp = new Date(collection.createdAt).getTime();
          if (isNaN(timestamp)) {
            timestamp = now;
          }
        } else {
          timestamp = now;
        }

        newActivities.push({
          id: `collection-${collection._id}`,
          action: `Created collection '${collection.name}'`,
          timestamp: timestamp,
          icon: '📁',
          type: 'collection_create'
        });
      } catch (error) {
        console.error('Error processing collection activity:', error);
      }
    });

    // Add recent followers
    const recentFollowers = followers.slice(0, 2);
    recentFollowers.forEach(follower => {
      try {
        newActivities.push({
          id: `follower-${follower._id}`,
          action: `${formatFollowerName(follower)} started following you`,
          timestamp: new Date().toISOString(),
          icon: '👤',
          type: 'new_follower'
        });
      } catch (error) {
        console.error('Error processing follower activity:', error);
      }
    });

    // Add welcome activities if no real data
    if (newActivities.length === 0) {
      const welcomeActivities = getWelcomeActivities();
      newActivities.push(...welcomeActivities);
    }

    // Sort by timestamp (newest first) and take latest 4
    const sortedActivities = newActivities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 4);

    setActivities(sortedActivities);
  };

  // Real-time timestamp formatting
  const formatRealTime = (timestamp) => {
    try {
      const timestampNum = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;

      if (isNaN(timestampNum)) {
        return 'Recently';
      }

      const now = Date.now();
      const diff = now - timestampNum;

      if (diff < 0) {
        return 'Just now';
      }

      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (seconds < 60) {
        return 'Just now';
      } else if (minutes < 60) {
        return `${minutes}m ago`;
      } else if (hours < 24) {
        return `${hours}h ago`;
      } else if (days === 1) {
        return 'Yesterday';
      } else if (days < 30) {
        return `${days}d ago`;
      } else {
        // For older dates, show actual date
        const date = new Date(timestampNum);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined });
      }
    } catch (error) {
      return 'Recently';
    }
  };

  // Welcome activities
  const getWelcomeActivities = () => {
    const now = Date.now();
    return [
      {
        id: 'welcome-1',
        action: 'Welcome to Grand Gallery!',
        timestamp: now - 120000,
        icon: '🎉',
        type: 'welcome'
      },
      {
        id: 'welcome-2',
        action: 'Upload your first artwork to get started',
        timestamp: now - 60000,
        icon: '🎨',
        type: 'tip'
      },
      {
        id: 'welcome-3',
        action: 'Create collections to organize your work',
        timestamp: now - 30000,
        icon: '📁',
        type: 'tip'
      },
      {
        id: 'welcome-4',
        action: 'Explore artwork from other artists',
        timestamp: now,
        icon: '🔍',
        type: 'tip'
      }
    ];
  };

  // Add a new activity in real-time
  const addNewActivity = (action, icon, type = 'user_action') => {
    const newActivity = {
      id: `${type}-${Date.now()}`,
      action,
      timestamp: Date.now(),
      icon,
      type
    };

    setActivities(prev => {
      const updated = [newActivity, ...prev].slice(0, 4);
      return updated;
    });
  };


  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedArtwork(null);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'upload':
        addNewActivity('Started uploading new artwork', '🎨', 'upload_start');
        navigate('/upload');
        break;
      case 'collection':
        addNewActivity('Started creating new collection', '📁', 'collection_start');
        navigate('/collections/create');
        break;
      case 'discover':
        addNewActivity('Exploring artwork gallery', '🔍', 'discover');
        navigate('/discover');
        break;
      case 'artists':
        addNewActivity('Browsing artists', '👥', 'artists');
        navigate('/discover?tab=artists');
        break;
      default:
        break;
    }
  };

  // Format follower name 
  const formatFollowerName = (follower) => {
    if (follower.username) return follower.username;
    if (follower.firstName && follower.lastName) return `${follower.firstName} ${follower.lastName}`;
    if (follower.firstName) return follower.firstName;
    if (follower.name) return follower.name;
    return 'Anonymous User';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black pt-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Your <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Dashboard</span>
            </h1>
            <p className="text-xl text-gray-300">Loading your data...</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 animate-pulse">
                <div className="h-6 bg-gray-700 rounded mb-4"></div>
                <div className="h-8 bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const recentArtworks = userArtworks.slice(0, 4);
  const recentFollowers = followers.slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black pt-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Welcome, <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{user?.firstName || 'Artist'}</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Track your art journey and statistics in one place
          </p>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-200 text-center">{error}</p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105 group">
            <div className="text-2xl group-hover:scale-110 transition-transform duration-300 mb-4">🎨</div>
            <h3 className="text-3xl font-bold text-white mb-2">{stats.totalArtworks}</h3>
            <p className="text-gray-400 text-sm">Total Artworks</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105 group">
            <div className="text-2xl group-hover:scale-110 transition-transform duration-300 mb-4">🖼️</div>
            <h3 className="text-3xl font-bold text-white mb-2">{stats.totalCollections}</h3>
            <p className="text-gray-400 text-sm">Collections</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105 group">
            <div className="text-2xl group-hover:scale-110 transition-transform duration-300 mb-4">❤️</div>
            <h3 className="text-3xl font-bold text-white mb-2">{stats.totalLikes}</h3>
            <p className="text-gray-400 text-sm">Total Likes</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105 group">
            <div className="text-2xl group-hover:scale-110 transition-transform duration-300 mb-4">👁️</div>
            <h3 className="text-3xl font-bold text-white mb-2">{stats.totalViews}</h3>
            <p className="text-gray-400 text-sm">Total Views</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105 group">
            <div className="text-2xl group-hover:scale-110 transition-transform duration-300 mb-4">👥</div>
            <h3 className="text-3xl font-bold text-white mb-2">{stats.totalFollowers}</h3>
            <p className="text-gray-400 text-sm">Followers</p>
          </div>
        </div>

        {/* Real-time Recent Activity */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Recent Activity</h2>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-sm font-medium">Live</span>
              <button
                onClick={fetchDashboardData}
                className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors flex items-center"
              >
                Refresh ↻
              </button>
            </div>
          </div>

          <div className="space-y-0 relative">
            {activities.map((activity, index) => (
              <div key={activity.id} className="relative">
                {/* Timeline line connector */}
                {index < activities.length - 1 && (
                  <div className="absolute left-5 top-12 w-0.5 h-12 bg-gradient-to-b from-purple-500/50 to-transparent"></div>
                )}
                
                {/* Activity item */}
                <div className="flex items-center justify-between p-4 mb-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all duration-300 group relative ml-4">
                  {/* Icon with timeline dot */}
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-6 top-0 w-3 h-3 rounded-full bg-purple-500 border-2 border-slate-950"></div>
                      
                      {/* Activity icon */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-110 transition-all duration-300 ${activity.type === 'artwork_upload' ? 'bg-green-500/20 group-hover:bg-green-500/30' :
                          activity.type === 'artwork_like' ? 'bg-red-500/20 group-hover:bg-red-500/30' :
                            activity.type === 'artwork_view' ? 'bg-blue-500/20 group-hover:bg-blue-500/30' :
                              activity.type === 'collection_create' ? 'bg-purple-500/20 group-hover:bg-purple-500/30' :
                                activity.type === 'new_follower' ? 'bg-yellow-500/20 group-hover:bg-yellow-500/30' :
                                  'bg-gradient-to-r from-purple-500/20 to-pink-500/20 group-hover:from-purple-500/30 group-hover:to-pink-500/30'
                        }`}>
                        <span className="text-lg">{activity.icon}</span>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <p className="text-white font-medium">{activity.action}</p>
                      <p className="text-gray-400 text-sm">
                        {formatRealTime(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Status indicator */}
                  <div className={`w-2 h-2 rounded-full animate-pulse ${Date.now() - activity.timestamp < 300000 ? 'bg-green-500' :
                      Date.now() - activity.timestamp < 3600000 ? 'bg-yellow-500' :
                        'bg-gray-500'
                    }`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleQuickAction('upload')}
                className="p-4 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-xl text-white transition-all duration-300 hover:transform hover:scale-105 group"
              >
                <span className="text-lg block mb-2 group-hover:scale-110 transition-transform">🎨</span>
                Upload Art
              </button>
              <button
                onClick={() => handleQuickAction('collection')}
                className="p-4 bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/30 rounded-xl text-white transition-all duration-300 hover:transform hover:scale-105 group"
              >
                <span className="text-lg block mb-2 group-hover:scale-110 transition-transform">🖼️</span>
                New Collection
              </button>
              <button
                onClick={() => handleQuickAction('discover')}
                className="p-4 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-xl text-white transition-all duration-300 hover:transform hover:scale-105 group"
              >
                <span className="text-lg block mb-2 group-hover:scale-110 transition-transform">🔍</span>
                Discover Art
              </button>
              <button
                onClick={() => handleQuickAction('artists')}
                className="p-4 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-xl text-white transition-all duration-300 hover:transform hover:scale-105 group"
              >
                <span className="text-lg block mb-2 group-hover:scale-110 transition-transform">👥</span>
                Find Artists
              </button>
            </div>
          </div>

          {/* Your Artworks */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">Your Recent Artworks</h3>
            <div className="space-y-3">
              {recentArtworks.length > 0 ? (
                recentArtworks.map((artwork) => (
                  <div
                    key={artwork._id}
                    className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-colors cursor-pointer group"

                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={artwork.imageUrl}
                        alt={artwork.title}
                        className="w-10 h-10 object-cover rounded-lg opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                      <span className="text-gray-300 truncate max-w-[150px] group-hover:text-white transition-colors">
                        {artwork.title}
                      </span>
                    </div>

                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2 opacity-50">🎨</div>
                  <p className="text-gray-400">No artworks yet</p>
                  <p className="text-gray-500 text-sm mt-1">Start by uploading your first artwork</p>
                  <button
                    onClick={() => navigate('/upload')}
                    className="text-purple-400 hover:text-purple-300 text-sm mt-3 transition-colors"
                  >
                    Upload Artwork →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Followers Section */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">Recent Followers</h3>
            <div className="space-y-3">
              {recentFollowers.length > 0 ? (
                recentFollowers.map((follower) => (
                  <div
                    key={follower._id}
                    className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {formatFollowerName(follower).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-gray-300 group-hover:text-white transition-colors">
                          {formatFollowerName(follower)}
                        </span>
                        {follower.username && (
                          <p className="text-gray-500 text-xs">@{follower.username}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-green-400 text-sm">
                      <span className="opacity-70">Following</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2 opacity-50">👥</div>
                  <p className="text-gray-400">No followers yet</p>
                  <p className="text-gray-500 text-sm mt-1">Share your profile to get followers</p>
                  <button
                    onClick={() => navigate('/discover')}
                    className="text-purple-400 hover:text-purple-300 text-sm mt-3 transition-colors"
                  >
                    Explore Community →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Artwork Detail Modal */}
        {isModalOpen && selectedArtwork && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
          >
            <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
              <div className="relative">
                <button
                  onClick={closeModal}
                  className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all duration-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-2">
                  <div className="lg:sticky lg:top-0">
                    <img
                      src={selectedArtwork.imageUrl}
                      alt={selectedArtwork.title}
                      className="w-full h-64 lg:h-full object-cover rounded-t-2xl lg:rounded-l-2xl lg:rounded-tr-none"
                    />
                  </div>

                  <div className="p-6">
                    <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">
                      {selectedArtwork.title}
                    </h2>

                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {selectedArtwork.artistName?.charAt(0) || 'A'}
                      </div>
                      <div>
                        <p className="text-white font-medium">by {selectedArtwork.artistName}</p>
                        <p className="text-gray-400 text-sm">{selectedArtwork.category}</p>
                      </div>
                    </div>

                    <p className="text-gray-300 mb-6 leading-relaxed">
                      {selectedArtwork.description}
                    </p>

                    {selectedArtwork.tags && selectedArtwork.tags.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-white font-semibold mb-2">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedArtwork.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="bg-purple-600/20 text-purple-300 px-3 py-1 rounded-full text-sm border border-purple-500/30"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <button
                        onClick={(e) => handleLike(selectedArtwork._id, e)}
                        disabled={likingArtwork === selectedArtwork._id || !user}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${selectedArtwork.hasLiked
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                            : 'bg-white/10 text-gray-300 border border-white/20 hover:bg-white/20 hover:text-white'
                          } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {likingArtwork === selectedArtwork._id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        ) : (
                          <span>{selectedArtwork.hasLiked ? '❤️' : '🤍'}</span>
                        )}
                        <span>{selectedArtwork.likesCount || 0} Likes</span>
                      </button>

                      <div className="text-gray-400 text-sm flex items-center space-x-4">
                        <span>👁️ {selectedArtwork.views || 0} Views</span>
                        {selectedArtwork.dimensions && (
                          <span>{selectedArtwork.dimensions.width} × {selectedArtwork.dimensions.height}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <div className="text-center mt-8">
          <button
            onClick={fetchDashboardData}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors font-medium flex items-center mx-auto space-x-2"
          >
            <span>Refresh Data</span>
            <span>↻</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;