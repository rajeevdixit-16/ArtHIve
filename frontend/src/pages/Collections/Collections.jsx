import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { collectionService } from '../../services/collectionService';

const Collections = () => {
  const { user } = useUser();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('public');
  const [viewLayout, setViewLayout] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(12);

  useEffect(() => {
    fetchCollections();
  }, [viewMode, currentPage]);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      setError('');

      let response;
      if (viewMode === 'my' && user) {
        response = await collectionService.getUserCollections(user.id);
        console.log('This is my collection', response);

      } else {
        response = await collectionService.getAll();

      }
      if (response && response.collections) {
        setCollections(response.collections);
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages || 1);
        }
      } else {
        setCollections([]);
        console.warn("Collections data not found in the expected format:", response);
      }

      console.log('📦 Collections data:', response);

    } catch (err) {
      console.error('Error fetching collections:', err);
      setError('Failed to load collections');
      setCollections([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCollections = collections.filter(collection => {
    const matchesSearch = collection.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collection.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || collection.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...new Set(collections.map(c => c.category).filter(Boolean))];

  const getCoverImage = (collection) => {
    if (collection.coverImage) return collection.coverImage;
    if (collection.artworks && collection.artworks.length > 0) {
      return collection.artworks[0].imageUrl;
    }
    return '/default-collection-cover.jpg';
  };

  useEffect(() => {
  const handleFocus = () => {
    console.log('🔄 Page focused, refetching collections...');
    fetchCollections();
  };

  window.addEventListener('focus', handleFocus);

  return () => {
    window.removeEventListener('focus', handleFocus);
  };
}, []);

  const getGradientClass = (index) => {
    const gradients = [
      'from-purple-500/20 to-pink-500/20',
      'from-blue-500/20 to-cyan-500/20',
      'from-green-500/20 to-emerald-500/20',
      'from-orange-500/20 to-red-500/20',
      'from-indigo-500/20 to-purple-500/20',
      'from-teal-500/20 to-blue-500/20',
      'from-rose-500/20 to-pink-500/20',
      'from-amber-500/20 to-yellow-500/20'
    ];
    return gradients[index % gradients.length];
  };

  const getCategoryColor = (category) => {
    const colors = {
      digital: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      traditional: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      photography: 'bg-green-500/20 text-green-300 border-green-500/30',
      abstract: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      portrait: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      landscape: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      default: 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    };
    return colors[category] || colors.default;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 pt-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400 text-lg">Loading collections...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-purple-900/20 pt-20 px-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mb-6 shadow-2xl shadow-purple-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Art Collections
          </h1>
          <div className="w-12 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-6" />
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Discover curated artworks and organize your favorite pieces into beautiful collections
          </p>
        </div>

        {/* Controls Section */}
        <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-6 border border-white/[0.06] mb-8 shadow-2xl">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            {/* View Mode Toggle + View Layout Toggle */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Public/My Toggle */}
              <div className="flex bg-white/[0.04] rounded-xl p-1 border border-white/[0.06]">
                <button
                  className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${
                    viewMode === 'public'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  onClick={() => setViewMode('public')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  Public
                </button>
                {user && (
                  <button
                    className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${
                      viewMode === 'my'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                        : 'text-gray-400 hover:text-white'
                    }`}
                    onClick={() => setViewMode('my')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    My Collections
                  </button>
                )}
              </div>

              {/* Grid/List Toggle */}
              <div className="flex bg-white/[0.04] rounded-xl p-1 border border-white/[0.06]">
                <button
                  className={`p-2.5 rounded-lg transition-all duration-300 ${
                    viewLayout === 'grid'
                      ? 'bg-white/10 text-purple-400 shadow-lg'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                  onClick={() => setViewLayout('grid')}
                  title="Grid view"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                  </svg>
                </button>
                <button
                  className={`p-2.5 rounded-lg transition-all duration-300 ${
                    viewLayout === 'list'
                      ? 'bg-white/10 text-purple-400 shadow-lg'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                  onClick={() => setViewLayout('list')}
                  title="List view"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <div className="relative flex-1 min-w-[240px]">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search collections..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/10 transition-all duration-300 outline-none"
                />
              </div>

              {/* Create Collection Button */}
              {user && viewMode === 'my' && (
                <Link
                  to="/collections/create"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 whitespace-nowrap flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Create Collection
                </Link>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="mt-4">
            <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 flex-shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20'
                      : 'bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:text-white hover:border-white/20'
                  }`}
                >
                  {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center mb-8 backdrop-blur-xl">
            <p className="text-red-300 text-lg mb-4">{error}</p>
            <button
              onClick={fetchCollections}
              className="bg-red-500/20 text-red-300 px-6 py-2 rounded-xl hover:bg-red-500/30 transition-all duration-300 border border-red-500/30"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Collections Grid/List */}
        <div className={`mb-12 ${
          viewLayout === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'flex flex-col gap-4'
        }`}>
          {filteredCollections.map((collection, index) => (
            <div
              key={collection._id}
              className={`group bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] hover:border-purple-500/50 transition-all duration-500 overflow-hidden hover:-translate-y-0.5 hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)] ${
                viewLayout === 'list' ? 'flex flex-row h-36' : ''
              } animate-fade-in-up opacity-0 [animation-fill-mode:forwards]`}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <Link to={`/collections/${collection._id}`} className={`block ${viewLayout === 'list' ? 'flex flex-row w-full h-full' : ''}`}>
                {/* Cover Image */}
                <div className={`relative overflow-hidden flex-shrink-0 ${
                  viewLayout === 'grid' ? 'h-48 rounded-t-2xl' : 'h-full w-48 rounded-l-2xl'
                }`}>
                  <div
                    className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
                    style={{ backgroundImage: `url(${getCoverImage(collection)})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500"></div>

                  {/* Overlay Info */}
                  <div className={`absolute bottom-3 left-3 right-3 ${viewLayout === 'list' ? 'bottom-2 left-2 right-2' : ''}`}>
                    <div className="flex justify-between items-center gap-2">
                      <span className="bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap badge">
                        {collection.artworksCount || collection.artworks?.length || 0} artworks
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border whitespace-nowrap badge ${getCategoryColor(collection.category)}`}>
                        {collection.category || 'Art'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Collection Info */}
                <div className={`p-5 flex flex-col justify-between ${viewLayout === 'list' ? 'flex-1 min-w-0' : ''}`}>
                  <div>
                    <h3 className="text-white font-bold text-lg mb-2 line-clamp-1 group-hover:text-purple-300 transition-colors duration-300">
                      {collection.name}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">
                      {collection.description || 'No description available'}
                    </p>
                  </div>

                  {/* Owner Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {collection.owner?.profileImage ? (
                        <img
                          src={collection.owner.profileImage}
                          alt={collection.owner.username}
                          className="w-8 h-8 rounded-full border-2 border-white/20"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {collection.owner?.username?.charAt(0) || 'U'}
                        </div>
                      )}
                      <span className="text-gray-300 text-sm truncate">
                        by {collection.owner?.username || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredCollections.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-white/[0.03] backdrop-blur-xl rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/[0.06]">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              {searchTerm || selectedCategory !== 'all' ? 'No matching collections' : 'No collections found'}
            </h3>
            <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
              {viewMode === 'my'
                ? "You haven't created any collections yet. Start building your art portfolio!"
                : "No public collections available. Be the first to create one!"
              }
            </p>
            {viewMode === 'my' && user && (
              <Link
                to="/collections/create"
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 inline-flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Create Your First Collection
              </Link>
            )}
            {(searchTerm || selectedCategory !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
                className="bg-white/10 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition-all duration-300 border border-white/20 mt-4"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Pagination Controls */}
        {filteredCollections.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mb-12 animate-fade-in-up">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white/[0.04] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-all duration-200 border border-white/[0.06] flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Previous
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = currentPage - 2 + i;
                  if (pageNum > totalPages) pageNum = totalPages - 4 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 rounded-lg transition-all duration-200 font-medium ${
                      currentPage === pageNum
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                        : 'bg-white/[0.04] text-gray-300 hover:bg-white/10 border border-white/[0.06]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white/[0.04] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-all duration-200 border border-white/[0.06] flex items-center gap-1"
            >
              Next
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            <span className="text-gray-400 text-sm ml-4">
              Page {currentPage} of {totalPages}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Collections;
