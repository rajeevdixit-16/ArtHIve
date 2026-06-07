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

  

  const LikeIcon = ({ filled }) => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );

  const ViewIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

  const SaveIcon = ({ filled }) => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );

  const SearchIcon = () => (
    <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );

  const HeartIcon = ({ filled }) => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );

  const BookmarkIcon = ({ filled }) => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );

  const CloseIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );

  const ChevronLeftIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );

  const ChevronRightIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M9 18l6-6-6-6" />
    </svg>
  );

  const SparklesIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z" />
      <path d="M18 5l1 2.5L21.5 7l-2.5 1L18 11l-1-2.5L14.5 7l2.5-1z" />
    </svg>
  );

  const UserIcon = () => (
    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="relative">
            <div className="w-14 h-14 border-4 border-white/10 rounded-full"></div>
            <div className="absolute inset-0 w-14 h-14 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-300 mt-6 text-lg font-medium">Loading artworks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
          Discover
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> Artworks</span>
        </h1>
        <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-4"></div>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">Explore amazing artwork from our creative community</p>
      </div>

      {/* Tabs */}
      <div className="relative max-w-2xl mx-auto mb-8">
        <div className="flex bg-white/5 backdrop-blur-sm rounded-2xl p-1.5 border border-white/10">
          {[
            { id: 'all', label: 'All Artworks' },
            { id: 'recommended', label: 'Recommended' },
            { id: 'following', label: 'Following' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`relative flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${
                activeTab === tab.id
                  ? 'text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {activeTab === tab.id && (
                <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg shadow-purple-500/20"></span>
              )}
              <span className="relative z-10 flex items-center justify-center gap-2">
                {tab.label}
                {tab.id === 'recommended' && recommendationsLoading && (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-xl mx-auto mb-10">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur-sm"></div>
          <div className="relative flex items-center">
            <div className="absolute left-5 pointer-events-none">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder={`Search ${activeTab === 'all' ? 'all' : activeTab} artworks...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-full pl-12 pr-6 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-transparent transition-all duration-300 group-focus-within:bg-white/[0.15]"
            />
          </div>
        </div>
      </div>

      {/* Tab-specific messages */}
      {activeTab === 'recommended' && user && (
        <div className="max-w-2xl mx-auto mb-8 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl backdrop-blur-sm">
          <p className="text-purple-300 text-center flex items-center justify-center gap-2">
            <SparklesIcon />
            Personalized recommendations based on your likes and interests
          </p>
        </div>
      )}

      {activeTab === 'recommended' && !user && (
        <div className="max-w-2xl mx-auto mb-8 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl backdrop-blur-sm">
          <p className="text-yellow-300 text-center flex items-center justify-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Sign in to get personalized artwork recommendations
          </p>
        </div>
      )}

      {activeTab === 'following' && followingArtists.size === 0 && (
        <div className="max-w-2xl mx-auto mb-8 p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl backdrop-blur-sm">
          <p className="text-blue-300 text-center flex items-center justify-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Follow artists to see their latest artworks here
          </p>
        </div>
      )}

      {error && (
        <div className="max-w-2xl mx-auto mb-8 p-4 bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-2xl backdrop-blur-sm">
          <p className="text-red-300 text-center">{error}</p>
        </div>
      )}

      {/* Loading States */}
      {loading && activeTab === 'all' && (
        <div className="text-center py-16">
          <div className="relative inline-block">
            <div className="w-14 h-14 border-4 border-white/10 rounded-full"></div>
            <div className="absolute inset-0 w-14 h-14 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-300 mt-6 text-lg font-medium">Loading artworks...</p>
        </div>
      )}

      {recommendationsLoading && activeTab === 'recommended' && (
        <div className="text-center py-16">
          <div className="relative inline-block">
            <div className="w-14 h-14 border-4 border-white/10 rounded-full"></div>
            <div className="absolute inset-0 w-14 h-14 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-300 mt-6 text-lg font-medium">Finding personalized recommendations...</p>
        </div>
      )}

      {/* Artworks Grid */}
      {!loading && !recommendationsLoading && artworksForDisplay.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {artworksForDisplay.map((artwork, index) => (
            <div
              key={artwork._id}
              className="group bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden cursor-pointer hover:-translate-y-1 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/5 animate-fade-in-up"
              style={{ animationDelay: `${(index % 8) * 75}ms`, animationDuration: '400ms' }}
              onClick={() => handleArtworkClick(artwork)}
            >
              {/* Image Container */}
              <div className="relative overflow-hidden">
                <img
                  src={artwork.imageUrl}
                  alt={artwork.title}
                  className="w-full h-52 object-cover rounded-t-2xl group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Recommendation badge */}
                {activeTab === 'recommended' && artwork.score > 0 && (
                  <div className="absolute top-3 right-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full z-10 flex items-center gap-1 shadow-lg shadow-purple-500/30">
                    <SparklesIcon />
                    Recommended
                  </div>
                )}

                {/* ✅ SAVE BUTTON */}
                <div className="absolute top-3 left-3 z-10">
                  <button
                    onClick={(e) => toggleSave(artwork._id, e)}
                    disabled={savingArtwork === artwork._id || !user}
                    className={`p-2 rounded-full transition-all duration-300 shadow-lg backdrop-blur-sm ${
                      artwork.isSaved 
                        ? 'bg-yellow-500/90 text-white hover:bg-yellow-500' 
                        : 'bg-black/40 text-white hover:bg-black/60'
                    } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={artwork.isSaved ? "Remove from saved" : "Save artwork"}
                  >
                    {savingArtwork === artwork._id ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <BookmarkIcon filled={artwork.isSaved} />
                    )}
                  </button>
                </div>

                {/* Category Badge */}
                {artwork.category && (
                  <div className="absolute bottom-3 left-3 z-10">
                    <span className="bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full border border-white/10">
                      {artwork.category}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-white font-bold text-base mb-1 truncate group-hover:text-purple-300 transition-colors duration-300">{artwork.title}</h3>

                {/* Artist Avatar + Name */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                    {artwork.artistName?.charAt(0)?.toUpperCase() || 'A'}
                  </div>
                  <p className="text-gray-400 text-sm truncate">{artwork.artistName}</p>
                </div>

                <p className="text-gray-500 text-sm mb-4 line-clamp-2 leading-relaxed">{artwork.description}</p>

                {/* Stats Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={(e) => handleLike(artwork._id, e)}
                    disabled={likingArtwork === artwork._id || !user}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 text-sm ${
                      artwork.hasLiked
                        ? 'text-red-400 bg-red-500/10'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                    } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {likingArtwork === artwork._id ? (
                      <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <LikeIcon filled={artwork.hasLiked} />
                    )}
                    <span className="text-xs font-medium">{artwork.likesCount || 0}</span>
                  </button>

                  <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                    <SaveIcon filled={false} />
                    <span className="text-xs">{artwork.isSaved ? 'Saved' : 'Save'}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                    <ViewIcon />
                    <span className="text-xs">{artwork.views || 0}</span>
                  </div>
                </div>

                {/* Artist Row with Follow */}
                {user && artwork.clerkUserId !== user.id && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    {artwork.isFollowing ? (
                      <button onClick={(e) => toggleFollow(artwork.clerkUserId, artwork.artistName, e)} disabled={togglingFollow === artwork.clerkUserId} className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all duration-300 disabled:opacity-50">
                        {togglingFollow === artwork.clerkUserId ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : (
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        )}
                        <span>Following</span>
                      </button>
                    ) : (
                      <button onClick={(e) => toggleFollow(artwork.clerkUserId, artwork.artistName, e)} disabled={togglingFollow === artwork.clerkUserId} className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-medium bg-white/5 text-gray-400 border border-white/10 hover:bg-purple-500/10 hover:text-purple-300 hover:border-purple-500/30 transition-all duration-300 disabled:opacity-50">
                        {togglingFollow === artwork.clerkUserId ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : (
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                        )}
                        <span>Follow</span>
                      </button>
                    )}
                  </div>
                )}
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
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white/5 text-gray-300 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 transition-all duration-200 border border-white/10 text-sm font-medium"
          >
            <ChevronLeftIcon />
            Previous
          </button>
          
          <div className="flex items-center gap-1.5">
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
                  className={`w-10 h-10 rounded-xl transition-all duration-200 font-semibold text-sm ${
                    currentPage === pageNum
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/20'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
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
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white/5 text-gray-300 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 transition-all duration-200 border border-white/10 text-sm font-medium"
          >
            Next
            <ChevronRightIcon />
          </button>

          <span className="text-gray-500 text-sm ml-2">
            Page {currentPage} of {displayTotalPages}
          </span>
        </div>
      )}

      {/* Empty States */}
      {allFiltered.length === 0 && !loading && !recommendationsLoading && (
        <div className="text-center py-16 max-w-md mx-auto">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              {activeTab === 'recommended' ? (
                <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z" />
              ) : activeTab === 'following' ? (
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              ) : (
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              )}
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            {activeTab === 'recommended' ? 'No Recommendations Yet' :
              activeTab === 'following' ? 'Not Following Any Artists' :
                'No Artworks Found'}
          </h3>
          <p className="text-gray-400 mb-8">
            {activeTab === 'recommended' ? 'Like some artworks to get personalized recommendations' :
              activeTab === 'following' ? 'Follow artists to see their latest creations here' :
                'Try adjusting your search terms or browse all artworks'}
          </p>
          {activeTab === 'recommended' && (
            <button
              onClick={() => setActiveTab('all')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300"
            >
              Browse All Artworks
            </button>
          )}
          {activeTab === 'following' && (
            <button
              onClick={() => setActiveTab('all')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300"
            >
              Discover Artists
            </button>
          )}
        </div>
      )}

      {/* Artwork Detail Modal */}
      {isModalOpen && selectedArtwork && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4"
          onClick={handleBackdropClick}
        >
          <div className="relative bg-gradient-to-b from-gray-900 to-gray-950 rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto border border-white/10 shadow-2xl shadow-purple-500/5">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-20 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-all duration-300 shadow-lg backdrop-blur-sm"
            >
              <CloseIcon />
            </button>

            {/* Artwork Image */}
            <div className="relative w-full bg-gray-800/50 flex items-center justify-center" style={{ minHeight: '50vh', maxHeight: '70vh' }}>
              <img
                src={selectedArtwork.imageUrl}
                alt={selectedArtwork.title}
                className="w-full h-full object-contain p-4"
                style={{ maxHeight: '70vh' }}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSave(selectedArtwork._id, e);
                }}
                disabled={savingArtwork === selectedArtwork._id || !user}
                className={`absolute top-4 left-4 z-10 px-4 py-2 rounded-full transition-all duration-300 shadow-lg text-sm font-medium backdrop-blur-sm ${
                  selectedArtwork.isSaved 
                    ? 'bg-yellow-500/90 text-white hover:bg-yellow-500' 
                    : 'bg-black/40 text-white hover:bg-black/60 border border-white/10'
                } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {savingArtwork === selectedArtwork._id ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <BookmarkIcon filled={selectedArtwork.isSaved} />
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
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 shadow-lg shadow-purple-500/20">
                      {selectedArtwork.artistName?.charAt(0)?.toUpperCase() || 'A'}
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
                      <button onClick={(e) => toggleFollow(selectedArtwork.clerkUserId, selectedArtwork.artistName, e)} disabled={togglingFollow === selectedArtwork.clerkUserId} className="flex items-center gap-1.5 px-4 py-1.5 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 transition-colors text-sm font-medium shadow-lg shadow-green-600/20">
                        {togglingFollow === selectedArtwork.clerkUserId ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        )}
                        <span>Following</span>
                      </button>
                    ) : (
                      <button onClick={(e) => toggleFollow(selectedArtwork.clerkUserId, selectedArtwork.artistName, e)} disabled={togglingFollow === selectedArtwork.clerkUserId} className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 transition-all duration-300 text-sm font-medium">
                        {togglingFollow === selectedArtwork.clerkUserId ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                        )}
                        <span>Follow</span>
                      </button>
                    )
                  )}
                  {user && selectedArtwork.clerkUserId === user.id && (
                    <span className="text-xs text-green-400 font-medium bg-green-400/10 px-3 py-1.5 rounded-full border border-green-500/20">Your artwork</span>
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
                      className="bg-purple-500/10 text-purple-300 px-3 py-1 rounded-full text-xs border border-purple-500/20"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Action Bar */}
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike(selectedArtwork._id, e);
                  }}
                  disabled={likingArtwork === selectedArtwork._id || !user}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full transition-all duration-300 text-sm font-medium ${
                    selectedArtwork.hasLiked
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : 'bg-white/5 text-gray-400 hover:text-gray-200 border border-white/10 hover:bg-white/10'
                  } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {likingArtwork === selectedArtwork._id ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <HeartIcon filled={selectedArtwork.hasLiked} />
                  )}
                  <span>{selectedArtwork.likesCount || 0} Likes</span>
                </button>

                <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                  <ViewIcon />
                  <span>{selectedArtwork.views || 0} Views</span>
                </div>

                <span className="text-gray-500 text-sm">· {new Date(selectedArtwork.createdAt).toLocaleDateString()}</span>

                {selectedArtwork.dimensions && (
                  <span className="text-gray-500 text-sm hidden sm:inline">· {selectedArtwork.dimensions.width}×{selectedArtwork.dimensions.height} {selectedArtwork.dimensions.unit}</span>
                )}

                {message && (
                  <span className={`text-sm px-3 py-1 rounded-full ${
                    message.includes('❌') ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'
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
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-200 rounded-full transition-all duration-300 text-sm font-medium border border-white/10"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                    Add to Collection
                  </button>

                  {showCollectionDropdown && (
                    <div className="absolute top-full left-0 mt-2 w-72 bg-gray-800/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl z-30">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                        <h4 className="text-white font-medium text-sm">Add to Collection</h4>
                        <button onClick={() => setShowCollectionDropdown(false)} className="text-gray-400 hover:text-white transition-colors">
                          <CloseIcon />
                        </button>
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
                                <svg className="w-4 h-4 text-purple-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                  <line x1="12" y1="8" x2="12" y2="16" />
                                  <line x1="8" y1="12" x2="16" y2="12" />
                                </svg>
                              )}
                              <div className="flex-1 min-w-0">
                                <span className="block text-white text-sm truncate">{collection.name}</span>
                                <span className="block text-gray-400 text-xs">{collection.artworks?.length || 0} artworks</span>
                              </div>
                              {collection.artworks?.includes(selectedArtwork._id) && (
                                <span className="text-green-400 text-sm flex-shrink-0">
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                    <path d="M20 6L9 17l-5-5" />
                                  </svg>
                                </span>
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
  );
};

export default Discover;
