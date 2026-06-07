import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import CommentsSection from '../../components/CommentsSection';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const Saved = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('artworks');
  const [savedArtworks, setSavedArtworks] = useState([]);
  const [savedCollections, setSavedCollections] = useState([]);
  const [savedArtists, setSavedArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState('');

  const tabs = [
    { id: 'artworks', name: 'Saved Artworks', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ), count: savedArtworks.length },
    { id: 'artists', name: 'Followed Artists', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
      </svg>
    ), count: savedArtists.length },
  ];

const fetchSavedItems = async () => {
  if (!user?.id) return;

  try {
    setLoading(true);
    setError('');

    const [savedRes, artistsRes] = await Promise.all([
      fetch(`${BASE_URL}/api/saved/${user.id}`),
      fetch(`${BASE_URL}/api/follow/following/${user.id}`)
    ]);

    if (savedRes.ok) {
      const data = await savedRes.json();
      setSavedArtworks(data.artworks || []);
      setSavedCollections(data.collections || []);
    } else {
      console.error('Failed to fetch saved artworks and collections');
    }

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

  const handleArtworkClick = (artwork) => {
    setSelectedArtwork(artwork);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedArtwork(null);
  };

  const handleLike = async (artworkId, e) => {
    if (e) e.stopPropagation();
    if (!user) return;
    try {
      const response = await fetch(`${BASE_URL}/api/artworks/${artworkId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkUserId: user.id }),
      });
      if (response.ok) {
        const data = await response.json();
        setSavedArtworks(prev => prev.map(art =>
          art._id === artworkId
            ? { ...art, hasLiked: data.isLiked, likesCount: data.likes ?? art.likesCount }
            : art
        ));
        if (selectedArtwork?._id === artworkId) {
          setSelectedArtwork(prev => ({ ...prev, hasLiked: data.isLiked, likesCount: data.likes ?? prev.likesCount }));
        }
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const removeFromSaved = async (itemId, type) => {
  try {
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
        body: JSON.stringify({ userId: user.id })
      }
    );

    if (response.ok) {
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

  const renderSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-4 border border-white/[0.06] animate-pulse">
          <div className="bg-white/[0.06] rounded-xl h-48 mb-4"></div>
          <div className="bg-white/[0.06] rounded h-4 mb-2"></div>
          <div className="bg-white/[0.06] rounded h-3 w-2/3"></div>
        </div>
      ))}
    </div>
  );

  const renderEmptyState = (type) => (
    <div className="text-center py-20 animate-fade-in-up">
      {type === 'artworks' && (
        <svg className="w-20 h-20 mx-auto mb-6 text-white/[0.06]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )}
      {type === 'collections' && (
        <svg className="w-20 h-20 mx-auto mb-6 text-white/[0.06]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )}
      {type === 'artists' && (
        <svg className="w-20 h-20 mx-auto mb-6 text-white/[0.06]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )}
      <h3 className="text-2xl font-bold text-white mb-2">
        No {type === 'artists' ? 'artists' : type === 'collections' ? 'collections' : 'artworks'} yet
      </h3>
      <p className="text-gray-400 mb-8 max-w-md mx-auto">
        {type === 'artworks' && "Start saving artworks you love to see them here"}
        {type === 'collections' && "Save collections to organize your favorite artworks"}
        {type === 'artists' && "Follow artists to see their latest work here"}
      </p>
      <Link
        to={type === 'artists' ? '/discover' : '/discover'}
        className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span>Discover {type === 'artists' ? 'Artists' : 'Artworks'}</span>
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-in-up">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            Your Library
          </h1>
          <div className="w-12 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-4" />
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            All your favorite artworks and artists in one place
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 backdrop-blur-xl border border-red-500/20 text-red-200 p-4 rounded-xl mb-6 text-center animate-fade-in">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-2 bg-white/[0.03] backdrop-blur-xl rounded-2xl p-2 mb-8 max-w-md mx-auto border border-white/[0.06] animate-fade-in-up delay-100">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.name}</span>
              <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
              {tab.count > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-white/[0.08] text-gray-400'
                }`}>
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
          <div className="animate-fade-in-up delay-200">
            {/* Saved Artworks */}
            {activeTab === 'artworks' && (
              <div>
                {savedArtworks.length === 0 ? (
                  renderEmptyState('artworks')
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {savedArtworks.map((artwork) => (
                      <div
                        key={artwork._id}
                        className="group bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_32px_rgba(147,51,234,0.1)] hover:-translate-y-0.5 cursor-pointer"
                        onClick={() => handleArtworkClick(artwork)}
                      >
                        <div className="p-4">
                          <div className="relative overflow-hidden rounded-xl mb-4">
                            <img
                              src={artwork.imageUrl}
                              alt={artwork.title}
                              className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFromSaved(artwork._id, 'artworks');
                              }}
                              className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white p-2 rounded-full hover:bg-red-500/80 transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110"
                              title="Remove from saved"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <h3 className="text-white font-semibold text-lg mb-1 line-clamp-1 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text transition-all duration-300">
                            {artwork.title}
                          </h3>
                          <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                            {artwork.description}
                          </p>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-300">By {artwork.userId?.username}</span>
                            <div className="flex items-center space-x-4 text-gray-400">
                              <span className="flex items-center space-x-1">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                <span>{artwork.likes?.length || 0}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span>{artwork.views || 0}</span>
                              </span>
                            </div>
                          </div>
                        </div>
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
                      <div key={artist.clerkUserId} className="group bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_32px_rgba(147,51,234,0.1)] hover:-translate-y-0.5 text-center">
                        <Link to={`/artist/${artist.clerkUserId}`} className="block p-6">
                          <div className="relative mx-auto mb-4 w-20 h-20">
                            <img
                              src={artist.profileImage}
                              alt={artist.username}
                              className="w-20 h-20 rounded-full mx-auto border-2 border-white/[0.08] group-hover:border-purple-500/50 transition-all duration-300"
                              onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%236b21a8%22 width=%22100%22 height=%22100%22/><text fill=%22white%22 font-size=%2250%22 x=%2250%22 y=%2265%22 text-anchor=%22middle%22>U</text></svg>'; }}
                            />
                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                          </div>
                          <h3 className="text-white font-semibold text-lg mb-1 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text transition-all duration-300">
                            {artist.firstName ? `${artist.firstName} ${artist.lastName || ''}` : artist.name || artist.username || 'Unknown Artist'}
                          </h3>
                          <p className="text-gray-400 text-sm mb-4">@{artist.username}</p>
                          <div className="flex justify-center space-x-4 text-sm text-gray-400 mb-4">
                            <span className="flex items-center space-x-1">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>{artist.stats?.artworksCount || 0}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>{artist.stats?.followersCount || 0}</span>
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              unfollowArtist(artist.clerkUserId);
                            }}
                            className="w-full bg-red-500/10 backdrop-blur-sm text-red-300 py-2.5 rounded-xl hover:bg-red-500/20 transition-all duration-300 border border-red-500/20 hover:border-red-500/40 flex items-center justify-center space-x-2"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a5 5 0 00-5 5v1h10v-1a5 5 0 00-5-5zM22 12h-6" />
                            </svg>
                            <span>Unfollow</span>
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

      {/* Artwork Detail Modal */}
      {isModalOpen && selectedArtwork && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="relative bg-gradient-to-b from-gray-900 to-gray-950 rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto border border-white/10 shadow-2xl shadow-purple-500/5">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-20 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-all duration-300 shadow-lg backdrop-blur-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            <div className="relative w-full bg-gray-800/50 flex items-center justify-center" style={{ minHeight: '50vh', maxHeight: '70vh' }}>
              <img
                src={selectedArtwork.imageUrl}
                alt={selectedArtwork.title}
                className="w-full h-full object-contain p-4"
                style={{ maxHeight: '70vh' }}
              />
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">
                    {selectedArtwork.title}
                  </h2>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 shadow-lg shadow-purple-500/20">
                      {selectedArtwork.userId?.username?.charAt(0)?.toUpperCase() || 'A'}
                    </div>
                    <p className="text-gray-300 font-medium truncate">by {selectedArtwork.userId?.username || 'Unknown'}</p>
                    {selectedArtwork.category && (
                      <span className="text-gray-500 text-sm hidden sm:inline">· {selectedArtwork.category}</span>
                    )}
                  </div>
                </div>
              </div>

              {selectedArtwork.description && (
                <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                  {selectedArtwork.description}
                </p>
              )}

              {selectedArtwork.tags && selectedArtwork.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedArtwork.tags.map((tag, index) => (
                    <span key={index} className="bg-purple-500/10 text-purple-300 px-3 py-1 rounded-full text-xs border border-purple-500/20">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={(e) => handleLike(selectedArtwork._id, e)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full transition-all duration-300 text-sm font-medium ${
                    selectedArtwork.hasLiked
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : 'bg-white/5 text-gray-400 hover:text-gray-200 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill={selectedArtwork.hasLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  <span>{selectedArtwork.likesCount || selectedArtwork.likes?.length || 0} Likes</span>
                </button>

                <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span>{selectedArtwork.views || 0} Views</span>
                </div>

                {selectedArtwork.createdAt && (
                  <span className="text-gray-500 text-sm">· {new Date(selectedArtwork.createdAt).toLocaleDateString()}</span>
                )}
              </div>

              <CommentsSection artworkId={selectedArtwork._id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Saved;
