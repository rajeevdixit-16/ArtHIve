import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const Saved = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('artworks');
  const [savedArtworks, setSavedArtworks] = useState([]);
  const [savedCollections, setSavedCollections] = useState([]);
  const [savedArtists, setSavedArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const tabs = [
    { id: 'artworks', name: 'Saved Artworks', icon: '🖼️', count: savedArtworks.length },
    { id: 'artists', name: 'Followed Artists', icon: '👨‍🎨', count: savedArtists.length },
  ];

  // Fetch saved items
  

const fetchSavedItems = async () => {
  if (!user?.id) return;

  try {
    setLoading(true);
    setError('');

    // Fetch saved items (artworks/collections) and followed artists
    const [savedRes, artistsRes] = await Promise.all([
      // ✅ CORRECT: Use the single endpoint for saved items
      fetch(`${BASE_URL}/api/saved/${user.id}`),
      fetch(`${BASE_URL}/api/follow/following/${user.id}`)
    ]);

    // Handle the response for saved items
    if (savedRes.ok) {
      const data = await savedRes.json();
      setSavedArtworks(data.artworks || []);
      setSavedCollections(data.collections || []);
    } else {
      // Handle potential errors for the saved items fetch
      console.error('Failed to fetch saved artworks and collections');
    }

    // Handle the response for followed artists
    if (artistsRes.ok) {
      const data = await artistsRes.json();
      setSavedArtists(data.following || []);
    }

  } catch (err) {
    console.error('Error fetching saved items:', err);
    setError('Failed to load your saved items');
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchSavedItems();
  }, [user?.id]);

  // Remove from saved

const removeFromSaved = async (itemId, type) => {
  try {
    // Make sure we have a user ID before proceeding
    if (!user?.id) {
      console.error("User not found, cannot remove item.");
      return;
    }

    const endpoint = type === 'artworks' ? 'artworks' : 'collections';
    const response = await fetch(
      `${BASE_URL}/api/saved/${endpoint}/${itemId}`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        // The crucial fix is adding the user's ID to the body
        body: JSON.stringify({ userId: user.id })
      }
    );

    if (response.ok) {
      // Update local state to immediately reflect the change
      if (type === 'artworks') {
        setSavedArtworks(prev => prev.filter(art => art._id !== itemId));
      } else if (type === 'collections') {
        setSavedCollections(prev => prev.filter(col => col._id !== itemId));
      }
    } else {
      console.error('Failed to delete the item from the backend.');
    }
  } catch (error) {
    console.error('Error removing from saved:', error);
  }
};

  // Unfollow artist
  const unfollowArtist = async (artistId) => {
    try {
      const response = await fetch(
        `${BASE_URL}/api/follow/${artistId}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ followerId: user.id })
        }
      );

      if (response.ok) {
        setSavedArtists(prev => prev.filter(artist => artist.clerkUserId !== artistId));
      }
    } catch (error) {
      console.error('Error unfollowing artist:', error);
    }
  };

  // Render loading skeleton
  const renderSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-white/5 rounded-2xl p-4 animate-pulse">
          <div className="bg-white/10 rounded-xl h-48 mb-4"></div>
          <div className="bg-white/10 rounded h-4 mb-2"></div>
          <div className="bg-white/10 rounded h-3 w-2/3"></div>
        </div>
      ))}
    </div>
  );

  // Render empty state
  const renderEmptyState = (type) => (
    <div className="text-center py-16">
      <div className="text-6xl mb-4">🎨</div>
      <h3 className="text-2xl font-bold text-white mb-2">No {type} yet</h3>
      <p className="text-gray-400 mb-6">
        {type === 'artworks' && "Start saving artworks you love to see them here"}
        {type === 'collections' && "Save collections to organize your favorite artworks"}
        {type === 'artists' && "Follow artists to see their latest work here"}
      </p>
      <Link 
        to={type === 'artists' ? '/discover' : '/discover'} 
        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300"
      >
        Discover {type === 'artists' ? 'Artists' : 'Artworks'}
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black pt-20 pb-10 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Your Saved Items</h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            All your favorite artworks and artists in one place
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-200 p-4 rounded-xl mb-6 text-center">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-1 bg-white/5 rounded-2xl p-2 mb-8 max-w-2xl mx-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
              {tab.count > 0 && (
                <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          renderSkeleton()
        ) : (
          <div className="fade-in">
            {/* Saved Artworks */}
            {activeTab === 'artworks' && (
              <div>
                {savedArtworks.length === 0 ? (
                  renderEmptyState('artworks')
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {savedArtworks.map((artwork) => (
                      <div key={artwork._id} className="bg-white/5 rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-all duration-300 group">
                        <Link to={`/artwork/${artwork._id}`} className="block">
                          <div className="relative overflow-hidden rounded-xl mb-4">
                            <img
                              src={artwork.imageUrl}
                              alt={artwork.title}
                              className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute top-2 right-2">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  removeFromSaved(artwork._id, 'artworks');
                                }}
                                className="bg-red-500/90 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                                title="Remove from saved"
                              >
                                ❌
                              </button>
                            </div>
                          </div>
                          <h3 className="text-white font-semibold text-lg mb-1 line-clamp-1">
                            {artwork.title}
                          </h3>
                          <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                            {artwork.description}
                          </p>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-300">By {artwork.userId?.username}</span>
                            <div className="flex items-center space-x-4 text-gray-400">
                              <span>❤️ {artwork.likes?.length || 0}</span>
                              <span>👁️ {artwork.views || 0}</span>
                            </div>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}


            {/* Followed Artists */}
            {activeTab === 'artists' && (
              <div>
                {savedArtists.length === 0 ? (
                  renderEmptyState('artists')
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {savedArtists.map((artist) => (
                      <div key={artist.clerkUserId} className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 text-center group">
                        <Link to={`/artist/${artist.clerkUserId}`} className="block">
                          <img
                            src={artist.profileImage}
                            alt={artist.username}
                            className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-white/20 group-hover:border-purple-500 transition-colors"
                            onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%236b21a8%22 width=%22100%22 height=%22100%22/><text fill=%22white%22 font-size=%2250%22 x=%2250%22 y=%2265%22 text-anchor=%22middle%22>U</text></svg>'; }}
                          />
                          <h3 className="text-white font-semibold text-lg mb-1">
                            {artist.firstName} {artist.lastName}
                          </h3>
                          <p className="text-gray-400 text-sm mb-4">@{artist.username}</p>
                          <div className="flex justify-center space-x-4 text-sm text-gray-300 mb-4">
                            <span>{artist.stats?.artworksCount || 0} artworks</span>
                            <span>{artist.stats?.followersCount || 0} followers</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              unfollowArtist(artist.clerkUserId);
                            }}
                            className="w-full bg-red-500/20 text-red-300 py-2 rounded-xl hover:bg-red-500/30 transition-colors border border-red-500/30"
                          >
                            Unfollow
                          </button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Saved;