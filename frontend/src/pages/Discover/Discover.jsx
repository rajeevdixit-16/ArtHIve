import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import { artworkAPI } from "../../utils/api";
import { likeService } from "../../services/likeService";
import { viewService } from "../../services/viewService";
import { collectionService } from "../../services/collectionService";
import { followService } from "../../services/followService";
import { recommendationService } from "../../services/recommendationService";
import { savedService } from "../../services/savedService";
import { useNavigate } from "react-router-dom";
import "./Discover.css";

const Discover = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [artworks, setArtworks] = useState([]);
  const [recommendedArtworks, setRecommendedArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [likingArtwork, setLikingArtwork] = useState(null);
  const [togglingFollow, setTogglingFollow] = useState(null);
  const [savingArtwork, setSavingArtwork] = useState(null);

  const [activeTab, setActiveTab] = useState('all');

  // Modal state
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Collection state
  const [userCollections, setUserCollections] = useState([]);
  const [showCollectionDropdown, setShowCollectionDropdown] = useState(false);
  const [addingToCollection, setAddingToCollection] = useState(null);

  // Message state
  const [message, setMessage] = useState("");

  // Follow state - SINGLE SOURCE OF TRUTH
  const [followingArtists, setFollowingArtists] = useState(new Set());

  const [savedArtworks, setSavedArtworks] = useState(new Set());


  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      let initialFollowingSet = new Set();
      let initialSavedSet = new Set();

      // list of artists the user follows

      if (user?.id) {
        try {
          // Fetch following artists and saved items in parallel

          const [followingResponse, savedResponse] = await Promise.allSettled([
            followService.getFollowing(user.id),
            savedService.getSavedItems(user.id)
          ]);

          // Handle following response
          if (followingResponse.status === 'fulfilled' && followingResponse.value.data.success) {
            initialFollowingSet = new Set(followingResponse.value.data.following?.map(artist => artist.clerkUserId) || []);
            setFollowingArtists(initialFollowingSet);
          } else {
            console.warn('⚠️ Could not fetch following data');
          }

          // Handle saved response
          if (savedResponse.status === 'fulfilled' && savedResponse.value.data.success) {  
            const savedArtworkIds = savedResponse.value.data.artworks?.map(art => art._id) || [];
            initialSavedSet = new Set(savedArtworkIds);
            setSavedArtworks(initialSavedSet);
          } else {
            console.warn('⚠️ Could not fetch saved items - route might not exist yet');
          }
        } catch (error) {
          console.warn('⚠️ Error in user data fetch:', error);
          
        }
      }

      //  Fetch all artworks
      const artworkResponse = await artworkAPI.getAll();
      const artworksData = artworkResponse.data?.artworks || artworkResponse.data?.data || artworkResponse.data || [];

      // Process artworks with the follow status
      const artworksWithStatus = await Promise.all(
        artworksData.map(async (artwork) => {
          const isFollowing = initialFollowingSet.has(artwork.clerkUserId);
          const isSaved = initialSavedSet.has(artwork._id);
          let hasLiked = false;
          let likesCount = artwork.likes?.length || 0;
          
          if (user?.id) {
            try {
              const likeStatusResponse = await likeService.getLikeStatus(artwork._id, user.id);
              hasLiked = likeStatusResponse.hasLiked;
              likesCount = likeStatusResponse.likesCount;
            } catch (e) {
              console.warn(`Could not fetch like status for ${artwork._id}`);
            }
          }

          return { 
            ...artwork, 
            isFollowing, 
            hasLiked, 
            likesCount,  
            views: artwork.views ?? artwork.viewedBy?.length ?? 0, 
            isSaved 
          };
        })
      );

      setArtworks(artworksWithStatus);

      // Fetch recommendations if the user is logged in
      if (user?.id) {
        await fetchRecommendations(initialFollowingSet, initialSavedSet, artworksWithStatus);
      }

    } catch (err) {
      console.error("❌ Error fetching data:", err);
      setError("Failed to load artworks.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch recommendations
  const fetchRecommendations = useCallback(async (followingSet, savedSet, allArtworks) => {
    if (!user) return;

    try {
      setRecommendationsLoading(true);
      const response = await recommendationService.getRecommendations(user.id);

      if (response.data?.success) {
        const recommendations = response.data.recommendations || [];

        const processedRecs = recommendations.map(rec => {
          const existingArtwork = allArtworks.find(art => art._id === rec._id);
          if (existingArtwork) return existingArtwork;
          return { ...rec, isFollowing: followingSet.has(rec.clerkUserId), hasLiked: false, likesCount: rec.likes?.length || 0, isSaved: savedSet.has(rec._id) };
        });

        setRecommendedArtworks(processedRecs);
      }
    } catch (error) {
      console.error("❌ Error fetching recommendations:", error);
    } finally {
      setRecommendationsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleSave = async (artworkId, e) => {
    if (e) e.stopPropagation();
    if (!user?.id) {
      setMessage("Please sign in to save artworks");
      return;
    }

    setSavingArtwork(artworkId);
    
    const isCurrentlySaved = savedArtworks.has(artworkId);

    try {
      const response = isCurrentlySaved
        ? await savedService.unsaveArtwork(artworkId, user.id)
        : await savedService.saveArtwork(artworkId, user.id);

      if (response.data.success) {
        
        const newSavedSet = new Set(savedArtworks);
        if (isCurrentlySaved) {
          newSavedSet.delete(artworkId);
        } else {
          newSavedSet.add(artworkId);
        }
        setSavedArtworks(newSavedSet);

        // Update artworks state
        const updateSaveState = (items) => items.map(art =>
          art._id === artworkId ? { ...art, isSaved: !isCurrentlySaved } : art
        );

        setArtworks(updateSaveState);
        setRecommendedArtworks(updateSaveState);

        // Update selected artwork if open
        if (selectedArtwork?._id === artworkId) {
          setSelectedArtwork(prev => ({ ...prev, isSaved: !isCurrentlySaved }));
        }

        setMessage(isCurrentlySaved ? "❌ Removed from saved" : "✅ Saved to your collection");
        
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error toggling save:", error);
      setMessage("❌ Failed to save artwork");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setSavingArtwork(null);
    }
  };


  const toggleFollow = async (artistId, artistName, e) => {
    if (e) e.stopPropagation();
    if (!user?.id) return alert("Please sign in.");
    if (artistId === user.id) return;

    setTogglingFollow(artistId);
    const isCurrentlyFollowing = followingArtists.has(artistId);

    try {
      const response = isCurrentlyFollowing
        ? await followService.unfollowArtist(artistId, user.id)
        : await followService.followArtist(artistId, user.id);

      if (response.data.success) {
        const newFollowingSet = new Set(followingArtists);
        isCurrentlyFollowing ? newFollowingSet.delete(artistId) : newFollowingSet.add(artistId);
        setFollowingArtists(newFollowingSet);

        const updateState = (items) => items.map(art =>
          art.clerkUserId === artistId ? { ...art, isFollowing: !isCurrentlyFollowing } : art
        );

        setArtworks(updateState);
        setRecommendedArtworks(updateState);

        if (selectedArtwork?.clerkUserId === artistId) {
          setSelectedArtwork(prev => ({ ...prev, isFollowing: !isCurrentlyFollowing }));
        }
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setTogglingFollow(null);
    }
  };

  // Add artwork to collection
  const handleAddToCollection = async (collectionId, collectionName) => {
    if (!user || !selectedArtwork) return;

    if (selectedArtwork.clerkUserId !== user.id) {
      setMessage("❌ You can only add your own artworks to collections");
      setShowCollectionDropdown(false);
      return;
    }

    setAddingToCollection(collectionId);

    try {
      await collectionService.addArtwork(collectionId, selectedArtwork._id, user.id);
      setMessage(`✅ Added to "${collectionName}"!`);
      setShowCollectionDropdown(false);
      fetchUserCollections();
    } catch (error) {
      console.error('Error adding to collection:', error);
      setMessage(`❌ Failed to add to collection: ${error.message}`);
    } finally {
      setAddingToCollection(null);
    }
  };

  const handleCreateNewCollection = () => {
    navigate('/collections/create');
  };

  const fetchUserCollections = async () => {
    try {
      const response = await collectionService.getUserCollections(user.id);
      setUserCollections(response.collections || []);
    } catch (error) {
      console.error('Error fetching user collections:', error);
    }
  };

  useEffect(() => {
    if (isModalOpen && user && selectedArtwork) {
      fetchUserCollections();
    }
  }, [isModalOpen, user, selectedArtwork]);

  const handleArtworkClick = async (artwork) => {
    setSelectedArtwork(artwork);
    setIsModalOpen(true);

    try {
      if (user?.id) {
        const response = await viewService.recordView(artwork._id, user.id);
        
        if (response.success) {
          updateLocalViews(artwork._id, response.views);
        }
      }
    } catch (error) {
      console.error('❌ Error recording view:', error);
    }
  };

  const handleLike = async (artworkId, e) => {
    if (e) e.stopPropagation();
    if (!user) return alert("Please sign in to like artworks");

    setLikingArtwork(artworkId);
    try {
      const response = await likeService.toggleLike(artworkId, user.id);
      if (response.success) {
        const { liked, likes } = response;
        console.log(response);
        setMessage(liked ? "✅ Liked!" : "❌ Unliked");
        const updateLikeState = (items) => items.map(art => art._id === artworkId ? { ...art, hasLiked: liked, likesCount: likes } : art);

        setArtworks(updateLikeState);
        setRecommendedArtworks(updateLikeState);

        if (selectedArtwork?._id === artworkId) {
          setSelectedArtwork(prev => ({ ...prev, hasLiked: liked, likesCount: likes }));
        }


      }
    } catch (error) {
      console.error("Error liking artwork:", error);
    } finally {
      setLikingArtwork(null);
    }
  };


  const getFilteredArtworks = () => {
    let artworksToShow = [];

    switch (activeTab) {
      case 'recommended':
        artworksToShow = recommendedArtworks;
        break;
      case 'following':
        artworksToShow = artworks.filter(artwork =>
          artwork.clerkUserId && followingArtists.has(artwork.clerkUserId)
        );
        break;
      case 'all':
      default:
        artworksToShow = artworks;
        break;
    }

    // Apply search filter
    if (searchTerm) {
      artworksToShow = artworksToShow.filter(artwork =>
        artwork &&
        (artwork.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          artwork.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          artwork.artistName?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return artworksToShow;
  };

  const filteredArtworks = getFilteredArtworks();


  const updateLocalViews = (artworkId, newViewCount) => {
    
    if (newViewCount === undefined) return;

    const updateState = (items) => items.map(artwork =>
      artwork._id === artworkId ? { ...artwork, views: newViewCount } : artwork
    );

    setArtworks(updateState);
    setRecommendedArtworks(updateState); 

    if (selectedArtwork?._id === artworkId) {
      setSelectedArtwork(prev => ({ ...prev, views: newViewCount }));
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedArtwork(null);
    setMessage("");
    setShowCollectionDropdown(false);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowCollectionDropdown(false);
      closeModal();
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const getArtworksForDisplay = () => {
    let sourceArray = artworks;

    if (activeTab === 'recommended') {
      sourceArray = recommendedArtworks;
    } else if (activeTab === 'following') {
      sourceArray = artworks.filter(art => followingArtists.has(art.clerkUserId));
    }

    if (!searchTerm) {
      return sourceArray;
    }

    return sourceArray.filter(art =>
      art.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      art.artistName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const artworksForDisplay = getArtworksForDisplay();

  


  if (loading) {
    return (
      <div className="pt-20 pb-10 px-6">
        <div className="container mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-gray-300 mt-4">Loading artworks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-10 px-6">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Discover Artworks</h1>
          <p className="text-gray-300 text-lg">Explore amazing artwork from our community</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-white/5 rounded-2xl p-1 border border-white/10 mb-6 max-w-2xl mx-auto">
          {[
            { id: 'all', label: 'All Artworks' },
            { id: 'recommended', label: 'Recommended' },
            { id: 'following', label: 'Following' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${activeTab === tab.id
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
            >
              {tab.label}
              {tab.id === 'recommended' && recommendationsLoading && (
                <span className="ml-2 animate-spin">⟳</span>
              )}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <input
            type="text"
            placeholder={`Search ${activeTab === 'all' ? 'all' : activeTab} artworks...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-full px-6 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Tab-specific messages */}
        {activeTab === 'recommended' && user && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-purple-500/20 border border-purple-500/30 rounded-lg">
            <p className="text-purple-200 text-center">
              🎯 Personalized recommendations based on your likes and interests
            </p>
          </div>
        )}

        {activeTab === 'recommended' && !user && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-200 text-center">
              🔐 Sign in to get personalized artwork recommendations
            </p>
          </div>
        )}

        {activeTab === 'following' && followingArtists.size === 0 && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
            <p className="text-blue-200 text-center">
              👥 Follow artists to see their latest artworks here
            </p>
          </div>
        )}

        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-200 text-center">{error}</p>
          </div>
        )}

        {/* Loading States */}
        {loading && activeTab === 'all' && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-gray-300 mt-4">Loading artworks...</p>
          </div>
        )}

        {recommendationsLoading && activeTab === 'recommended' && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-gray-300 mt-4">Finding personalized recommendations...</p>
          </div>
        )}

        {/* Artworks Grid */}
        {!loading && !recommendationsLoading && artworksForDisplay.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {artworksForDisplay.map((artwork) => (
              <div
                key={artwork._id}
                className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer transform hover:scale-105 relative"
                onClick={() => handleArtworkClick(artwork)}
              >
                {/* Recommendation badge */}
                {activeTab === 'recommended' && artwork.score > 0 && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs px-2 py-1 rounded-full z-10">
                    🔥 Recommended
                  </div>
                )}

                {/* ✅ SAVE BUTTON - Top Right */}
                <div className="absolute top-4 left-4 z-10">
                  <button
                    onClick={(e) => toggleSave(artwork._id, e)}
                    disabled={savingArtwork === artwork._id || !user}
                    className={`p-2 rounded-full transition-all duration-300 ${
                      artwork.isSaved 
                        ? 'bg-yellow-500/90 text-white hover:bg-yellow-600' 
                        : 'bg-black/50 text-white hover:bg-black/70'
                    } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={artwork.isSaved ? "Remove from saved" : "Save artwork"}
                  >
                    {savingArtwork === artwork._id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : (
                      <span>{artwork.isSaved ? '⭐' : '☆'}</span>
                    )}
                  </button>
                </div>

                <img
                  src={artwork.imageUrl}
                  alt={artwork.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <h3 className="text-white font-bold text-lg mb-2">{artwork.title}</h3>

                {/* Artist Info with Follow/Unfollow Buttons */}
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-400">by {artwork.artistName}</p>
                  {user && artwork.clerkUserId !== user.id && (
                    <div className="flex space-x-2">
                      {/* Follow Button - Shows when NOT following */}
                      {artwork.isFollowing ? (
                        <button onClick={(e) => toggleFollow(artwork.clerkUserId, artwork.artistName, e)} disabled={togglingFollow === artwork.clerkUserId} className="flex items-center space-x-1 px-3 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-all duration-300 disabled:opacity-50">
                          {togglingFollow === artwork.clerkUserId ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div> : <span>✓ Following</span>}
                        </button>
                      ) : (
                        <button onClick={(e) => toggleFollow(artwork.clerkUserId, artwork.artistName, e)} disabled={togglingFollow === artwork.clerkUserId} className="flex items-center space-x-1 px-3 py-1 rounded-full text-xs bg-white/10 text-gray-300 border border-white/20 hover:bg-white/20 hover:text-white transition-all duration-300 disabled:opacity-50">
                          {togglingFollow === artwork.clerkUserId ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div> : <span>+ Follow</span>}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <p className="text-gray-300 text-sm mb-4 line-clamp-2">{artwork.description}</p>
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={(e) => handleLike(artwork._id, e)}
                    disabled={likingArtwork === artwork._id || !user}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${artwork.hasLiked
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                      : 'bg-white/10 text-gray-300 border border-white/20 hover:bg-white/20 hover:text-white'
                      } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {likingArtwork === artwork._id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : (
                      <span>{artwork.hasLiked ? '❤️' : '🤍'}</span>
                    )}
                    <span>{artwork.likesCount || 0}</span>
                  </button>
                  <span className="text-gray-400 text-sm flex items-center">
                    👁️ {artwork.views || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty States */}
        {filteredArtworks.length === 0 && !loading && !recommendationsLoading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 opacity-50">
              {activeTab === 'recommended' ? '🎯' :
                activeTab === 'following' ? '👥' : '🎨'}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {activeTab === 'recommended' ? 'No Recommendations Yet' :
                activeTab === 'following' ? 'Not Following Any Artists' :
                  'No Artworks Found'}
            </h3>
            <p className="text-gray-400 mb-6">
              {activeTab === 'recommended' ? 'Like some artworks to get personalized recommendations' :
                activeTab === 'following' ? 'Follow artists to see their latest creations here' :
                  'Try adjusting your search terms or browse all artworks'}
            </p>
            {activeTab === 'recommended' && (
              <button
                onClick={() => setActiveTab('all')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300"
              >
                Browse All Artworks
              </button>
            )}
            {activeTab === 'following' && (
              <button
                onClick={() => setActiveTab('all')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300"
              >
                Discover Artists
              </button>
            )}
          </div>
        )}

        {/* Artwork Detail Modal */}
        {isModalOpen && selectedArtwork && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
          >
            <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
              <div className="relative">
                {/* Close Button */}
                <button
                  onClick={closeModal}
                  className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all duration-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSave(selectedArtwork._id, e);
                  }}
                  disabled={savingArtwork === selectedArtwork._id || !user}
                  className={`absolute top-4 left-4 z-10 px-4 py-2 rounded-full transition-all duration-300 ${
                    selectedArtwork.isSaved 
                      ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                      : 'bg-white/10 text-white hover:bg-white/20'
                  } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {savingArtwork === selectedArtwork._id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  ) : (
                    <span className="flex items-center space-x-2">
                      <span>{selectedArtwork.isSaved ? '⭐' : '☆'}</span>
                      <span>{selectedArtwork.isSaved ? 'Saved' : 'Save'}</span>
                    </span>
                  )}
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-2">
                  {/* Artwork Image */}
                  <div className="lg:sticky lg:top-0">
                    <img
                      src={selectedArtwork.imageUrl}
                      alt={selectedArtwork.title}
                      className="w-full h-64 lg:h-full object-cover rounded-t-2xl lg:rounded-l-2xl lg:rounded-tr-none"
                    />
                  </div>

                  {/* Artwork Details */}
                  <div className="p-6">
                    <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">
                      {selectedArtwork.title}
                    </h2>

                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {selectedArtwork.artistName?.charAt(0) || 'A'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-medium">by {selectedArtwork.artistName}</p>
                            <p className="text-gray-400 text-sm">{selectedArtwork.category}</p>
                          </div>
                          {/* Follow/Unfollow Buttons in Modal */}
                          {user && selectedArtwork.clerkUserId !== user.id && (
                            <div className="flex space-x-2">
                              {/* Follow Button */}
                              {selectedArtwork.isFollowing ? (
                                <button onClick={(e) => toggleFollow(selectedArtwork.clerkUserId, selectedArtwork.artistName, e)} disabled={togglingFollow === selectedArtwork.clerkUserId} className="...">
                                  {togglingFollow === selectedArtwork.clerkUserId ? <div className="..."></div> : <span>✓ Following</span>}
                                </button>
                              ) : (
                                <button onClick={(e) => toggleFollow(selectedArtwork.clerkUserId, selectedArtwork.artistName, e)} disabled={togglingFollow === selectedArtwork.clerkUserId} className="...">
                                  {togglingFollow === selectedArtwork.clerkUserId ? <div className="..."></div> : <span>+ Follow</span>}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        {user && (
                          <p className="text-xs mt-1">
                            {selectedArtwork.clerkUserId === user.id ? (
                              <span className="text-green-400">⭐ Your artwork</span>
                            ) : (
                              <span className="text-blue-400">👤 Other user's artwork</span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>

                    <p className="text-gray-300 mb-6 leading-relaxed">
                      {selectedArtwork.description}
                    </p>

                    {/* Tags */}
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

                    {/* Engagement Stats */}
                    <div className="modal-stats">
                      <div className="modal-actions">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(selectedArtwork._id, e);
                          }}
                          disabled={likingArtwork === selectedArtwork._id || !user}
                          className={`modal-like-btn ${selectedArtwork.hasLiked ? 'liked' : ''}`}
                        >
                          {likingArtwork === selectedArtwork._id ? (
                            <div className="like-spinner"></div>
                          ) : (
                            <span>{selectedArtwork.hasLiked ? '❤️' : '🤍'}</span>
                          )}
                          <span>{selectedArtwork.likesCount || 0} Likes</span>
                        </button>

                        {/* Message Display */}
                        {message && (
                          <div className={`message-display ${message.includes('❌') ? 'error' : 'success'}`}>
                            {message}
                          </div>
                        )}

                        {/* Add to Collection Button */}
                        {user && selectedArtwork.clerkUserId === user.id && (
                          <div className="collection-dropdown-container">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowCollectionDropdown(!showCollectionDropdown);
                              }}
                              className="add-to-collection-btn"
                            >
                              📁 Add to Collection
                            </button>

                            {showCollectionDropdown && (
                              <div className="collection-dropdown">
                                <div className="dropdown-header">
                                  <h4>Add to Collection</h4>
                                  <button
                                    onClick={() => setShowCollectionDropdown(false)}
                                    className="close-dropdown"
                                  >
                                    ×
                                  </button>
                                </div>

                                <div className="collections-list">
                                  {userCollections.length > 0 ? (
                                    userCollections.map(collection => (
                                      <button
                                        key={collection._id}
                                        onClick={() => handleAddToCollection(collection._id, collection.name)}
                                        disabled={addingToCollection === collection._id}
                                        className="collection-option"
                                      >
                                        {addingToCollection === collection._id ? (
                                          <div className="small-spinner"></div>
                                        ) : (
                                          <span className="collection-icon">🖼️</span>
                                        )}
                                        <div className="collection-info">
                                          <span className="collection-name">{collection.name}</span>
                                          <span className="artwork-count">
                                            {collection.artworks?.length || 0} artworks
                                          </span>
                                        </div>
                                        {collection.artworks?.includes(selectedArtwork._id) && (
                                          <span className="already-added">✓</span>
                                        )}
                                      </button>
                                    ))
                                  ) : (
                                    <div className="no-collections-message">
                                      <p>No collections yet</p>
                                    </div>
                                  )}
                                </div>

                                <div className="dropdown-actions">
                                  <button
                                    onClick={handleCreateNewCollection}
                                    className="create-collection-btn"
                                  >
                                    + Create New Collection
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {user && selectedArtwork.clerkUserId !== user.id && (
                          <div className="text-gray-400 text-sm mt-2 text-center">
                            <p>You can only add your own artworks to collections</p>
                          </div>
                        )}

                        <div className="modal-views">
                          <span>👁️</span>
                          <span>{selectedArtwork.views || 0} Views</span>
                        </div>
                      </div>

                      {/* Additional Info */}
                      <div className="text-right text-sm text-gray-400">
                        <p>Uploaded {new Date(selectedArtwork.createdAt).toLocaleDateString()}</p>
                        {selectedArtwork.dimensions && (
                          <p>{selectedArtwork.dimensions.width} × {selectedArtwork.dimensions.height} {selectedArtwork.dimensions.unit}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Discover;