import React, { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { artworkAPI } from "../../utils/api";
import { likeService } from "../../services/likeService";
import { viewService } from "../../services/viewService";
import { collectionService } from "../../services/collectionService";
import { followService } from "../../services/followService";
import { recommendationService } from "../../services/recommendationService";
import { savedService } from "../../services/savedService";
import { useNavigate } from "react-router-dom";
import CommentsSection from "../../components/CommentsSection";
import "./Discover.css";

const Discover = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [artworks, setArtworks] = useState([]);
  const [allArtworks, setAllArtworks] = useState([]);
  const [recommendedArtworks, setRecommendedArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [likingArtwork, setLikingArtwork] = useState(null);
  const [togglingFollow, setTogglingFollow] = useState(null);
  const [savingArtwork, setSavingArtwork] = useState(null);

  const [activeTab, setActiveTab] = useState('all');
  
  // Pagination state per tab
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 12;
  const followingRef = useRef(new Set());
  const savedRef = useRef(new Set());
  const initialLoadDone = useRef(false);

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


  const fetchMetadata = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [followingResponse, savedResponse] = await Promise.allSettled([
        followService.getFollowing(user.id),
        savedService.getSavedItems(user.id)
      ]);

      if (followingResponse.status === 'fulfilled' && followingResponse.value.data.success) {
        const set = new Set(followingResponse.value.data.following?.map(artist => artist.clerkUserId) || []);
        followingRef.current = set;
        setFollowingArtists(set);
      }

      if (savedResponse.status === 'fulfilled' && savedResponse.value.data.success) {
        const set = new Set(savedResponse.value.data.artworks?.map(art => art._id) || []);
        savedRef.current = set;
        setSavedArtworks(set);
      }
    } catch (error) {
      console.warn('⚠️ Error in user data fetch:', error);
    }
  }, [user]);

  // Fetch full artwork list (for 'following' tab) and recommendations
  const fetchFullArtworks = useCallback(async () => {
    try {
      const response = await artworkAPI.getAll({ limit: 200 });
      const data = response.data?.artworks || [];

      const processed = data.map(artwork => {
        const isFollowing = followingRef.current.has(artwork.clerkUserId);
        const isSaved = savedRef.current.has(artwork._id);
        const hasLiked = artwork.likes?.includes(user?.id) || false;
        const likesCount = artwork.likes?.length || 0;

        return { 
          ...artwork, 
          isFollowing, 
          hasLiked, 
          likesCount,  
          views: artwork.views ?? artwork.viewedBy?.length ?? 0, 
          isSaved 
        };
      });

      setAllArtworks(processed);

      if (user?.id) {
        const recResponse = await recommendationService.getRecommendations(user.id);
        if (recResponse.data?.success) {
          const recommendations = recResponse.data.recommendations || [];
          const processedRecs = recommendations.map(rec => {
            const existing = processed.find(art => art._id === rec._id);
            if (existing) return existing;
            return { 
              ...rec, 
              isFollowing: followingRef.current.has(rec.clerkUserId), 
              hasLiked: rec.likes?.includes(user.id) || false, 
              likesCount: rec.likes?.length || 0, 
              isSaved: savedRef.current.has(rec._id) 
            };
          });
          setRecommendedArtworks(processedRecs);
        }
      }
    } catch (err) {
      console.error("❌ Error fetching full list:", err);
    }
  }, [user]);

  // Fetch a single page for the 'all' tab (server-side pagination)
  const fetchAllPage = useCallback(async (page) => {
    try {
      setLoading(true);
      const response = await artworkAPI.getAll({ page, limit: itemsPerPage });
      const data = response.data;
      const artworksData = data.artworks || [];

      const processed = artworksData.map(artwork => {
        const isFollowing = followingRef.current.has(artwork.clerkUserId);
        const isSaved = savedRef.current.has(artwork._id);
        const hasLiked = artwork.likes?.includes(user?.id) || false;
        const likesCount = artwork.likes?.length || 0;

        return { 
          ...artwork, 
          isFollowing, 
          hasLiked, 
          likesCount,  
          views: artwork.views ?? artwork.viewedBy?.length ?? 0, 
          isSaved 
        };
      });

      setArtworks(processed);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      console.error("❌ Error fetching page:", err);
      setError("Failed to load artworks.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchMetadata();
      await fetchFullArtworks();
      await fetchAllPage(1);
      setCurrentPage(1);
      initialLoadDone.current = true;
    };
    init();
  }, [fetchMetadata, fetchFullArtworks, fetchAllPage]);

  // Re-fetch 'all' page when page changes (skip initial mount)
  useEffect(() => {
    if (!initialLoadDone.current) return;
    if (activeTab === 'all') {
      fetchAllPage(currentPage);
    }
  }, [activeTab, currentPage, fetchAllPage]);

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
        savedRef.current = newSavedSet;
        setSavedArtworks(newSavedSet);

        // Update artworks state
        const updateSaveState = (items) => items.map(art =>
          art._id === artworkId ? { ...art, isSaved: !isCurrentlySaved } : art
        );

        setAllArtworks(updateSaveState);
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
        followingRef.current = newFollowingSet;
        setFollowingArtists(newFollowingSet);

        const updateState = (items) => items.map(art =>
          art.clerkUserId === artistId ? { ...art, isFollowing: !isCurrentlyFollowing } : art
        );

        setAllArtworks(updateState);
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

        setAllArtworks(updateLikeState);
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




  const updateLocalViews = (artworkId, newViewCount) => {
    
    if (newViewCount === undefined) return;

    const updateState = (items) => items.map(artwork =>
      artwork._id === artworkId ? { ...artwork, views: newViewCount } : artwork
    );

    setAllArtworks(updateState);
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
    setCurrentPage(1);
  };

  const getArtworksForDisplay = () => {
    let sourceArray = [];

    if (activeTab === 'all') {
      sourceArray = artworks;
    } else if (activeTab === 'recommended') {
      sourceArray = recommendedArtworks;
    } else if (activeTab === 'following') {
      sourceArray = allArtworks.filter(art => followingArtists.has(art.clerkUserId));
    }

    // Apply search
    if (searchTerm) {
      sourceArray = sourceArray.filter(art =>
        art &&
        (art.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          art.artistName?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return sourceArray;
  };

  const allFiltered = getArtworksForDisplay();
  const totalFilteredPages = Math.ceil(allFiltered.length / itemsPerPage) || 1;
  const displayTotalPages = activeTab === 'all' ? totalPages : totalFilteredPages;

  const artworksForDisplay = activeTab === 'all'
    ? allFiltered
    : allFiltered.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      );

  


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

        {/* Pagination Controls */}
        {!loading && !recommendationsLoading && artworksForDisplay.length > 0 && displayTotalPages > 1 && (
          <div className="flex items-center justify-center gap-3 my-12">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white/5 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-all duration-200 border border-white/10"
            >
              ← Previous
            </button>
            
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, displayTotalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (displayTotalPages > 5 && currentPage > 3) {
                  pageNum = currentPage - 2 + i;
                  if (pageNum > displayTotalPages) pageNum = displayTotalPages - 4 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 rounded-lg transition-all duration-200 font-medium ${
                      currentPage === pageNum
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, displayTotalPages))}
              disabled={currentPage === displayTotalPages}
              className="px-4 py-2 bg-white/5 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-all duration-200 border border-white/10"
            >
              Next →
            </button>

            <span className="text-gray-400 text-sm ml-4">
              Page {currentPage} of {displayTotalPages}
            </span>
          </div>
        )}

        {/* Empty States */}
        {allFiltered.length === 0 && !loading && !recommendationsLoading && (
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
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
            onClick={handleBackdropClick}
          >
            <div className="bg-gray-900 rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto border border-white/10">
              {/* Close Button */}
              <button
                onClick={closeModal}
                className="absolute top-3 right-3 z-20 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-all duration-300 shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Artwork Image - Full width, full artwork visible */}
              <div className="relative w-full bg-gray-800 flex items-center justify-center" style={{ minHeight: '50vh', maxHeight: '70vh' }}>
                <img
                  src={selectedArtwork.imageUrl}
                  alt={selectedArtwork.title}
                  className="w-full h-full object-contain p-4"
                  style={{ maxHeight: '70vh' }}
                />
                {/* Save Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSave(selectedArtwork._id, e);
                  }}
                  disabled={savingArtwork === selectedArtwork._id || !user}
                  className={`absolute top-3 left-3 z-10 px-4 py-2 rounded-full transition-all duration-300 shadow-lg text-sm font-medium ${
                    selectedArtwork.isSaved 
                      ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                      : 'bg-white/10 text-white hover:bg-white/20'
                  } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {savingArtwork === selectedArtwork._id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <span>{selectedArtwork.isSaved ? '⭐' : '☆'}</span>
                      <span>{selectedArtwork.isSaved ? 'Saved' : 'Save'}</span>
                    </span>
                  )}
                </button>
              </div>

              {/* Artwork Details */}
              <div className="p-4 sm:p-6 space-y-4">
                {/* Title & Artist Row */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">
                      {selectedArtwork.title}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-7 h-7 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                        {selectedArtwork.artistName?.charAt(0) || 'A'}
                      </div>
                      <p className="text-gray-300 font-medium truncate">by {selectedArtwork.artistName}</p>
                      {selectedArtwork.category && (
                        <span className="text-gray-500 text-sm hidden sm:inline">· {selectedArtwork.category}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {user && selectedArtwork.clerkUserId !== user.id && (
                      selectedArtwork.isFollowing ? (
                        <button onClick={(e) => toggleFollow(selectedArtwork.clerkUserId, selectedArtwork.artistName, e)} disabled={togglingFollow === selectedArtwork.clerkUserId} className="px-4 py-1.5 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 transition-colors text-sm font-medium">
                          {togglingFollow === selectedArtwork.clerkUserId ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <span>✓ Following</span>}
                        </button>
                      ) : (
                        <button onClick={(e) => toggleFollow(selectedArtwork.clerkUserId, selectedArtwork.artistName, e)} disabled={togglingFollow === selectedArtwork.clerkUserId} className="px-4 py-1.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm font-medium">
                          {togglingFollow === selectedArtwork.clerkUserId ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <span>+ Follow</span>}
                        </button>
                      )
                    )}
                    {user && selectedArtwork.clerkUserId === user.id && (
                      <span className="text-xs text-green-400 font-medium bg-green-400/10 px-3 py-1 rounded-full">Your artwork</span>
                    )}
                  </div>
                </div>

                {/* Description */}
                {selectedArtwork.description && (
                  <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                    {selectedArtwork.description}
                  </p>
                )}

                {/* Tags */}
                {selectedArtwork.tags && selectedArtwork.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedArtwork.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-purple-600/20 text-purple-300 px-3 py-1 rounded-full text-xs border border-purple-500/30"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Bar */}
                <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLike(selectedArtwork._id, e);
                    }}
                    disabled={likingArtwork === selectedArtwork._id || !user}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full transition-all duration-300 text-sm font-medium ${
                      selectedArtwork.hasLiked
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20 border border-white/10'
                    } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {likingArtwork === selectedArtwork._id ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <span>{selectedArtwork.hasLiked ? '❤️' : '🤍'}</span>
                    )}
                    <span>{selectedArtwork.likesCount || 0} Likes</span>
                  </button>

                  <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                    <span>👁️</span>
                    <span>{selectedArtwork.views || 0} Views</span>
                  </div>

                  <span className="text-gray-500 text-sm">· {new Date(selectedArtwork.createdAt).toLocaleDateString()}</span>

                  {selectedArtwork.dimensions && (
                    <span className="text-gray-500 text-sm hidden sm:inline">· {selectedArtwork.dimensions.width}×{selectedArtwork.dimensions.height} {selectedArtwork.dimensions.unit}</span>
                  )}

                  {message && (
                    <span className={`text-sm px-3 py-1 rounded-full ${
                      message.includes('❌') ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                    }`}>
                      {message}
                    </span>
                  )}
                </div>

                {/* Add to Collection */}
                {user && selectedArtwork.clerkUserId === user.id && (
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCollectionDropdown(!showCollectionDropdown);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-300 text-sm font-medium border border-white/10"
                    >
                      📁 Add to Collection
                    </button>

                    {showCollectionDropdown && (
                      <div className="absolute top-full left-0 mt-2 w-72 bg-gray-800 border border-white/10 rounded-xl shadow-2xl z-30">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                          <h4 className="text-white font-medium text-sm">Add to Collection</h4>
                          <button onClick={() => setShowCollectionDropdown(false)} className="text-gray-400 hover:text-white text-lg leading-none">&times;</button>
                        </div>
                        <div className="max-h-48 overflow-y-auto py-1">
                          {userCollections.length > 0 ? (
                            userCollections.map(collection => (
                              <button
                                key={collection._id}
                                onClick={() => handleAddToCollection(collection._id, collection.name)}
                                disabled={addingToCollection === collection._id}
                                className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-white/5 transition-colors text-left disabled:opacity-50"
                              >
                                {addingToCollection === collection._id ? (
                                  <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                                ) : (
                                  <span className="flex-shrink-0">🖼️</span>
                                )}
                                <div className="flex-1 min-w-0">
                                  <span className="block text-white text-sm truncate">{collection.name}</span>
                                  <span className="block text-gray-400 text-xs">{collection.artworks?.length || 0} artworks</span>
                                </div>
                                {collection.artworks?.includes(selectedArtwork._id) && (
                                  <span className="text-green-400 text-sm flex-shrink-0">✓</span>
                                )}
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-6 text-center text-gray-400 text-sm">No collections yet</div>
                          )}
                        </div>
                        <div className="px-4 py-3 border-t border-white/10">
                          <button onClick={handleCreateNewCollection} className="w-full py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-lg transition-colors text-sm font-medium border border-purple-500/30">
                            + Create New Collection
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {user && selectedArtwork.clerkUserId !== user.id && (
                  <p className="text-gray-500 text-xs">You can only add your own artworks to collections</p>
                )}

                {/* Comments Section */}
                <CommentsSection artworkId={selectedArtwork._id} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Discover;