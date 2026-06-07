import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { artworkAPI } from "../../utils/api";
import { likeService } from "../../services/likeService";
import { viewService } from "../../services/viewService";
import { collectionService } from "../../services/collectionService";
import { followService } from "../../services/followService";
import { useNavigate } from "react-router-dom";
import {
  Image, Heart, Bookmark, Eye, Users, Clock, Upload,
  Plus, Compass, UserPlus, Activity, RefreshCw,
  Palette, TrendingUp, Sparkles, Camera, Grid
} from "lucide-react";

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

  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [likingArtwork, setLikingArtwork] = useState(null);

  const [activities, setActivities] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

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

      let artworksData = [], collectionsData = [], followersData = [], followingData = [];
      let statsUpdate = {};

      if (userResponse.ok) {
        const userData = await userResponse.json();
        statsUpdate = {
          totalArtworks: userData.stats?.artworksCount || 0,
          totalFollowers: userData.stats?.followersCount || 0,
          totalFollowing: userData.stats?.followingCount || 0,
          totalCollections: userData.stats?.collectionsCount || 0,
          totalLikes: userData.stats?.totalLikes || 0,
        };
      }

      if (artworksResponse.ok) {
        const artData = await artworksResponse.json();
        artworksData = artData.artworks || [];
        const totalViews = artworksData.reduce((sum, art) => sum + (art.views || 0), 0);
        statsUpdate.totalViews = totalViews;
        setUserArtworks(artworksData);
      }

      if (collectionsResponse.collections) {
        collectionsData = collectionsResponse.collections || [];
        setUserCollections(collectionsData);
      }

      if (followersResponse.ok) {
        const followersJson = await followersResponse.json();
        followersData = followersJson.followers || [];
        setFollowers(followersData);
      }

      if (followingResponse.ok) {
        const followingJson = await followingResponse.json();
        followingData = followingJson.following || [];
        setFollowing(followingData);
      }

      setStats(prev => ({ ...prev, ...statsUpdate }));
      generateRealTimeActivities(artworksData, collectionsData, followersData);

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (artworkId, e) => {
    if (e) e.stopPropagation();
    if (likingArtwork === artworkId || !user) return;
    setLikingArtwork(artworkId);
    try {
      await likeService.toggleLike(artworkId, user.id);
      const toggle = (art) =>
        art._id === artworkId
          ? { ...art, hasLiked: !art.hasLiked, likesCount: (art.likesCount || 0) + (art.hasLiked ? -1 : 1) }
          : art;
      setUserArtworks(prev => prev.map(toggle));
      if (selectedArtwork?._id === artworkId) {
        setSelectedArtwork(prev => ({ ...toggle(prev) }));
      }
      setStats(prev => ({
        ...prev,
        totalLikes: prev.totalLikes + (selectedArtwork?.hasLiked ? -1 : 1)
      }));
    } catch (err) {
      console.error("Error toggling like:", err);
    } finally {
      setLikingArtwork(null);
    }
  };

  const generateRealTimeActivities = (artworks, collections, followers) => {
    const newActivities = [];
    const now = Date.now();

    const recentArtworks = artworks.slice(0, 2);
    recentArtworks.forEach(artwork => {
      try {
        let timestamp;
        if (artwork.createdAt) {
          timestamp = new Date(artwork.createdAt).getTime();
          if (isNaN(timestamp)) timestamp = now;
        } else {
          timestamp = now;
        }
        newActivities.push({
          id: `artwork-${artwork._id}`,
          action: `Uploaded '${artwork.title}'`,
          timestamp: timestamp,
          type: 'artwork_upload'
        });
      } catch (error) {
        console.error('Error processing artwork activity:', error);
      }
    });

    const recentCollections = collections.slice(0, 2);
    recentCollections.forEach(collection => {
      try {
        let timestamp;
        if (collection.createdAt) {
          timestamp = new Date(collection.createdAt).getTime();
          if (isNaN(timestamp)) timestamp = now;
        } else {
          timestamp = now;
        }
        newActivities.push({
          id: `collection-${collection._id}`,
          action: `Created collection '${collection.name}'`,
          timestamp: timestamp,
          type: 'collection_create'
        });
      } catch (error) {
        console.error('Error processing collection activity:', error);
      }
    });

    const recentFollowers = followers.slice(0, 2);
    recentFollowers.forEach(follower => {
      try {
        const timestamp = follower.followedAt ? new Date(follower.followedAt).getTime() : Date.now();
        newActivities.push({
          id: `follower-${follower.clerkUserId}`,
          action: `${formatFollowerName(follower)} started following you`,
          timestamp,
          type: 'new_follower'
        });
      } catch (error) {
        console.error('Error processing follower activity:', error);
      }
    });

    if (newActivities.length === 0) {
      const welcomeActivities = getWelcomeActivities();
      newActivities.push(...welcomeActivities);
    }

    const sortedActivities = newActivities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 4);

    setActivities(sortedActivities);
  };

  const formatRealTime = (timestamp) => {
    try {
      const timestampNum = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;
      if (isNaN(timestampNum)) return 'Recently';
      const now = Date.now();
      const diff = now - timestampNum;
      if (diff < 0) return 'Just now';
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      if (seconds < 60) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days === 1) return 'Yesterday';
      if (days < 30) return `${days}d ago`;
      const date = new Date(timestampNum);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined });
    } catch (error) {
      return 'Recently';
    }
  };

  const getWelcomeActivities = () => {
    const now = Date.now();
    return [
      { id: 'welcome-1', action: 'Welcome to Grand Gallery!', timestamp: now - 120000, type: 'welcome' },
      { id: 'welcome-2', action: 'Upload your first artwork to get started', timestamp: now - 60000, type: 'tip' },
      { id: 'welcome-3', action: 'Create collections to organize your work', timestamp: now - 30000, type: 'tip' },
      { id: 'welcome-4', action: 'Explore artwork from other artists', timestamp: now, type: 'tip' }
    ];
  };

  const addNewActivity = (action, type = 'user_action') => {
    const newActivity = {
      id: `${type}-${Date.now()}`,
      action,
      timestamp: Date.now(),
      type
    };
    setActivities(prev => [newActivity, ...prev].slice(0, 4));
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedArtwork(null);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) closeModal();
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'upload':
        addNewActivity('Started uploading new artwork', 'upload_start');
        navigate('/upload');
        break;
      case 'collection':
        addNewActivity('Started creating new collection', 'collection_start');
        navigate('/collections/create');
        break;
      case 'discover':
        addNewActivity('Exploring artwork gallery', 'discover');
        navigate('/discover');
        break;
      case 'artists':
        addNewActivity('Browsing artists', 'artists');
        navigate('/discover?tab=artists');
        break;
      default:
        break;
    }
  };

  const formatFollowerName = (follower) => {
    if (follower.username) return follower.username;
    if (follower.firstName && follower.lastName) return `${follower.firstName} ${follower.lastName}`;
    if (follower.firstName) return follower.firstName;
    if (follower.name) return follower.name;
    return 'Anonymous User';
  };

  const statCards = [
    { key: 'totalArtworks', label: 'Total Artworks', icon: Image, gradient: 'from-purple-500 to-pink-500', iconBg: 'from-purple-500/20 to-pink-500/20', iconColor: 'text-purple-400' },
    { key: 'totalCollections', label: 'Collections', icon: Bookmark, gradient: 'from-blue-500 to-cyan-500', iconBg: 'from-blue-500/20 to-cyan-500/20', iconColor: 'text-blue-400' },
    { key: 'totalLikes', label: 'Total Likes', icon: Heart, gradient: 'from-red-500 to-orange-500', iconBg: 'from-red-500/20 to-orange-500/20', iconColor: 'text-red-400' },
    { key: 'totalViews', label: 'Total Views', icon: Eye, gradient: 'from-green-500 to-emerald-500', iconBg: 'from-green-500/20 to-emerald-500/20', iconColor: 'text-green-400' },
    { key: 'totalFollowers', label: 'Followers', icon: Users, gradient: 'from-yellow-500 to-amber-500', iconBg: 'from-yellow-500/20 to-amber-500/20', iconColor: 'text-yellow-400' },
  ];

  const quickActions = [
    { id: 'upload', label: 'Upload Art', icon: Upload, gradient: 'from-purple-600 to-pink-600' },
    { id: 'collection', label: 'New Collection', icon: Plus, gradient: 'from-blue-600 to-cyan-600' },
    { id: 'discover', label: 'Discover Art', icon: Compass, gradient: 'from-amber-600 to-orange-600' },
    { id: 'artists', label: 'Find Artists', icon: UserPlus, gradient: 'from-green-600 to-emerald-600' },
  ];

  const activityIconMap = {
    artwork_upload: { icon: Image, bg: 'bg-green-500/20', color: 'text-green-400' },
    collection_create: { icon: Bookmark, bg: 'bg-purple-500/20', color: 'text-purple-400' },
    new_follower: { icon: UserPlus, bg: 'bg-yellow-500/20', color: 'text-yellow-400' },
    welcome: { icon: Sparkles, bg: 'bg-pink-500/20', color: 'text-pink-400' },
    tip: { icon: TrendingUp, bg: 'bg-blue-500/20', color: 'text-blue-400' },
    upload_start: { icon: Upload, bg: 'bg-green-500/20', color: 'text-green-400' },
    collection_start: { icon: Plus, bg: 'bg-purple-500/20', color: 'text-purple-400' },
    discover: { icon: Compass, bg: 'bg-amber-500/20', color: 'text-amber-400' },
    artists: { icon: Users, bg: 'bg-blue-500/20', color: 'text-blue-400' },
  };

  const getActivityIcon = (type) => {
    return activityIconMap[type] || { icon: Activity, bg: 'bg-white/10', color: 'text-gray-400' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <div className="text-center mb-12 opacity-0 animate-fade-in-up">
            <div className="h-10 w-72 skeleton rounded-lg mx-auto mb-4" />
            <div className="h-5 w-48 skeleton rounded-lg mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-6 border border-white/[0.06] opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${item * 100}ms` }}
              >
                <div className="w-12 h-12 skeleton rounded-xl mb-4" />
                <div className="h-8 skeleton rounded w-16 mb-2" />
                <div className="h-4 skeleton rounded w-24" />
              </div>
            ))}
          </div>
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-6 border border-white/[0.06] opacity-0 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
            <div className="h-6 skeleton rounded w-36 mb-6" />
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 skeleton rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 skeleton rounded w-48 mb-2" />
                    <div className="h-3 skeleton rounded w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const recentArtworks = userArtworks.slice(0, 6);
  const recentFollowers = followers.slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Page Header */}
        <div className="mb-12 opacity-0 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              Welcome back,{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {user?.firstName || 'Artist'}
              </span>
            </h1>
          </div>
          <p className="text-lg text-gray-400 ml-4">Track your art journey and statistics in one place</p>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-xl opacity-0 animate-fade-in-up">
            <p className="text-yellow-200 text-center">{error}</p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.key}
                className="relative bg-white/[0.03] backdrop-blur-xl rounded-2xl p-6 border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300 hover:scale-[1.02] group opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${(index + 1) * 100}ms` }}
              >
                <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${stat.gradient} rounded-t-2xl`} />
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.iconBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                  </div>
                  <TrendingUp className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">{stats[stat.key]}</h3>
                <p className="text-gray-400 text-sm">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Activity Timeline */}
        <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-white/[0.06] mb-8 opacity-0 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">Recent Activity</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-400 text-sm font-medium">Live</span>
              </div>
              <button
                onClick={fetchDashboardData}
                className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          <div className="relative">
            {activities.length > 0 ? (
              <div className="space-y-0">
                {activities.map((activity, index) => {
                  const { icon: ActIcon, bg, color } = getActivityIcon(activity.type);
                  return (
                    <div key={activity.id} className="relative flex gap-6 pb-8 last:pb-0 opacity-0 animate-fade-in-up" style={{ animationDelay: `${700 + index * 100}ms` }}>
                      {index < activities.length - 1 && (
                        <div className="absolute left-[19px] top-10 bottom-0 w-px bg-gradient-to-b from-purple-500/50 to-transparent" />
                      )}
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 border-2 border-purple-500/40 flex items-center justify-center z-10 relative">
                          <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                        </div>
                      </div>
                      <div className="flex-1 bg-white/[0.02] backdrop-blur-xl rounded-xl border border-white/[0.06] p-4 hover:bg-white/[0.04] transition-colors">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                              <ActIcon className={`w-4 h-4 ${color}`} />
                            </div>
                            <div>
                              <p className="text-white font-medium text-sm">{activity.action}</p>
                              <p className="text-gray-500 text-xs mt-0.5">{formatRealTime(activity.timestamp)}</p>
                            </div>
                          </div>
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${Date.now() - activity.timestamp < 300000 ? 'bg-green-500' : Date.now() - activity.timestamp < 3600000 ? 'bg-yellow-500' : 'bg-gray-600'}`} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Artworks Grid */}
        <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-white/[0.06] mb-8 opacity-0 animate-fade-in-up" style={{ animationDelay: '800ms' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Palette className="w-5 h-5 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">Recent Artworks</h2>
            </div>
            {recentArtworks.length > 0 && (
              <button onClick={() => navigate('/my-artworks')} className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
                View All
              </button>
            )}
          </div>

          {recentArtworks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentArtworks.map((artwork, index) => (
                <div
                  key={artwork._id}
                  className="group relative bg-white/[0.02] rounded-xl overflow-hidden border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300 cursor-pointer opacity-0 animate-fade-in-up"
                  style={{ animationDelay: `${900 + index * 100}ms` }}
                  onClick={() => { setSelectedArtwork(artwork); setIsModalOpen(true); }}
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={artwork.imageUrl}
                      alt={artwork.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5 text-white text-sm">
                          <Heart className="w-4 h-4 text-red-400" />
                          {artwork.likesCount || 0}
                        </span>
                        <span className="flex items-center gap-1.5 text-white text-sm">
                          <Eye className="w-4 h-4 text-blue-400" />
                          {artwork.views || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-white text-sm font-medium truncate">{artwork.title}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Camera className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 mb-1">No artworks yet</p>
              <p className="text-gray-500 text-sm mb-4">Start by uploading your first artwork</p>
              <button
                onClick={() => navigate('/upload')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-medium rounded-xl transition-all duration-300"
              >
                <Upload className="w-4 h-4" />
                Upload Artwork
              </button>
            </div>
          )}
        </div>

        {/* Bottom Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Quick Actions */}
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-6 border border-white/[0.06] opacity-0 animate-fade-in-up" style={{ animationDelay: '1100ms' }}>
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h3 className="text-xl font-bold text-white">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action.id)}
                    className="group relative p-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] rounded-xl text-white transition-all duration-300 hover:scale-[1.03] overflow-hidden"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                    <div className="relative z-10 flex flex-col items-center gap-2">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.gradient}/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-sm font-medium">{action.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Compact Artworks List */}
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-6 border border-white/[0.06] opacity-0 animate-fade-in-up" style={{ animationDelay: '1200ms' }}>
            <div className="flex items-center gap-3 mb-6">
              <Grid className="w-5 h-5 text-purple-400" />
              <h3 className="text-xl font-bold text-white">Your Artworks</h3>
            </div>
            {recentArtworks.length > 0 ? (
              <div className="space-y-3">
                {recentArtworks.slice(0, 4).map((artwork) => (
                  <div
                    key={artwork._id}
                    className="flex items-center gap-3 p-2.5 hover:bg-white/[0.03] rounded-lg transition-colors cursor-pointer group"
                    onClick={() => { setSelectedArtwork(artwork); setIsModalOpen(true); }}
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={artwork.imageUrl} alt={artwork.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate group-hover:text-purple-400 transition-colors">{artwork.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-gray-500 text-xs">
                          <Heart className="w-3 h-3" /> {artwork.likesCount || 0}
                        </span>
                        <span className="flex items-center gap-1 text-gray-500 text-xs">
                          <Eye className="w-3 h-3" /> {artwork.views || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Camera className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No artworks yet</p>
                <button
                  onClick={() => navigate('/upload')}
                  className="text-purple-400 hover:text-purple-300 text-xs mt-2 transition-colors"
                >
                  Upload Artwork →
                </button>
              </div>
            )}
          </div>

          {/* Recent Followers */}
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-6 border border-white/[0.06] opacity-0 animate-fade-in-up" style={{ animationDelay: '1300ms' }}>
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-5 h-5 text-purple-400" />
              <h3 className="text-xl font-bold text-white">Recent Followers</h3>
            </div>
            {recentFollowers.length > 0 ? (
              <div className="space-y-3">
                {recentFollowers.map((follower) => (
                  <div
                    key={follower._id}
                    className="flex items-center justify-between p-2.5 hover:bg-white/[0.03] rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {formatFollowerName(follower).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium group-hover:text-purple-400 transition-colors">{formatFollowerName(follower)}</p>
                        {follower.username && <p className="text-gray-500 text-xs">@{follower.username}</p>}
                      </div>
                    </div>
                    <span className="text-xs text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">Following</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <UserPlus className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No followers yet</p>
                <p className="text-gray-500 text-xs mt-1 mb-3">Share your profile to get followers</p>
                <button
                  onClick={() => navigate('/discover')}
                  className="text-purple-400 hover:text-purple-300 text-xs transition-colors"
                >
                  Explore Community →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Artwork Detail Modal */}
        {isModalOpen && selectedArtwork && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
          >
            <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/[0.06]">
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
                    <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">{selectedArtwork.title}</h2>

                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {selectedArtwork.artistName?.charAt(0) || 'A'}
                      </div>
                      <div>
                        <p className="text-white font-medium">by {selectedArtwork.artistName}</p>
                        {selectedArtwork.category && <p className="text-gray-400 text-sm">{selectedArtwork.category}</p>}
                      </div>
                    </div>

                    {selectedArtwork.description && (
                      <p className="text-gray-300 mb-6 leading-relaxed">{selectedArtwork.description}</p>
                    )}

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

                    <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                      <button
                        onClick={(e) => handleLike(selectedArtwork._id, e)}
                        disabled={likingArtwork === selectedArtwork._id || !user}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${selectedArtwork.hasLiked
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                            : 'bg-white/10 text-gray-300 border border-white/20 hover:bg-white/20 hover:text-white'
                          } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {likingArtwork === selectedArtwork._id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                        ) : (
                          <Heart className={`w-4 h-4 ${selectedArtwork.hasLiked ? 'fill-red-500 text-red-500' : ''}`} />
                        )}
                        <span className="text-sm">{selectedArtwork.likesCount || 0} Likes</span>
                      </button>

                      <div className="text-gray-400 text-sm flex items-center gap-4">
                        <span className="flex items-center gap-1.5">
                          <Eye className="w-4 h-4" /> {selectedArtwork.views || 0} Views
                        </span>
                        {selectedArtwork.dimensions && (
                          <span className="text-gray-500 text-xs">{selectedArtwork.dimensions.width} × {selectedArtwork.dimensions.height}</span>
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
        <div className="text-center pb-8 opacity-0 animate-fade-in-up" style={{ animationDelay: '1400ms' }}>
          <button
            onClick={fetchDashboardData}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] text-white rounded-xl transition-all duration-300 text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
