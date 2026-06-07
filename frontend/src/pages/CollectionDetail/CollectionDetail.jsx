import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { collectionService } from '../../services/collectionService';
import { likeService } from '../../services/likeService';
import AddArtworksModal from '../../components/AddArtworksModal/AddArtworksModal';

const CollectionDetail = () => {
  const { id } = useParams();
  const { user } = useUser();
  const navigate = useNavigate();
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAddArtworks, setShowAddArtworks] = useState(false);

  useEffect(() => {
    fetchCollection();
  }, [id]);

  const fetchCollection = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await collectionService.getById(id);
      setCollection(response);

      if (user && response.clerkUserId === user.id) {
        setIsOwner(true);
      }
    } catch (err) {
      console.error('Error fetching collection:', err);
      setError('Collection not found or access denied');
    } finally {
      setLoading(false);
    }
  };

  const handleArtworkClick = (artwork) => {
    setSelectedArtwork(artwork);
    setIsModalOpen(true);
  };

  const handleDeleteCollection = async () => {
    if (!window.confirm('Are you sure you want to delete this collection? This action cannot be undone.')) {
      return;
    }

    try {
      await collectionService.delete(id, user.id);
      navigate('/collections');
    } catch (err) {
      console.error('Error deleting collection:', err);
      alert('Failed to delete collection');
    }
  };

  const handleRemoveArtwork = async (artworkId) => {
    if (!window.confirm('Remove this artwork from collection?')) {
      return;
    }

    try {
      await collectionService.removeArtwork(id, artworkId, user.id);
      fetchCollection();
    } catch (err) {
      console.error('Error removing artwork:', err);
      alert('Failed to remove artwork');
    }
  };

  const handleArtworksAdded = (updatedCollection) => {
    setCollection(updatedCollection);
    setShowAddArtworks(false);
  };

  const getGradientClass = () => {
    const gradients = {
      personal: 'from-purple-500 to-pink-500',
      inspiration: 'from-blue-500 to-cyan-500',
      work: 'from-green-500 to-emerald-500',
      favorites: 'from-orange-500 to-yellow-500',
      other: 'from-gray-500 to-gray-700'
    };
    return gradients[collection?.category] || 'from-purple-500 to-pink-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading collection...</p>
        </div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 pt-20 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">Collection Not Found</h3>
          <p className="text-gray-400 mb-8">{error || 'The collection you are looking for does not exist.'}</p>
          <Link
            to="/collections"
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 inline-flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Collections
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-purple-900/20 pt-20">
      {/* Header Section */}
      <div className="relative">
        <div className={`absolute inset-0 bg-gradient-to-r ${getGradientClass()} opacity-10 h-96`}></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <Link
            to="/collections"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-300 mb-8 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Back to Collections</span>
          </Link>

          {/* Collection Hero */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Cover Image */}
            <div className="lg:col-span-1">
              <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-6 border border-white/[0.06] shadow-2xl h-full flex flex-col">
                {collection.coverImage ? (
                  <img
                    src={collection.coverImage}
                    alt={collection.name}
                    className="w-full h-64 object-cover rounded-xl flex-shrink-0"
                  />
                ) : (
                  <div className={`w-full h-64 bg-gradient-to-r ${getGradientClass()} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <span className="text-6xl text-white/80 font-bold">
                      {collection.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-grow"></div>
              </div>
            </div>

            {/* Collection Info */}
            <div className="lg:col-span-2">
              <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-8 border border-white/[0.06] shadow-2xl h-full">
                {/* Meta Badges */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <span className={`px-4 py-2 rounded-full text-sm font-medium border badge flex items-center gap-1.5 ${
                    collection.isPublic
                      ? 'bg-green-500/20 text-green-300 border-green-500/30'
                      : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  }`}>
                    {collection.isPublic ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    )}
                    {collection.isPublic ? 'Public' : 'Private'}
                  </span>
                  <span className="bg-white/[0.04] text-gray-300 px-4 py-2 rounded-full text-sm font-medium border border-white/[0.06] badge">
                    {collection.category}
                  </span>
                  <span className="bg-white/[0.04] text-gray-300 px-4 py-2 rounded-full text-sm font-medium border border-white/[0.06] badge">
                    {collection.artworks?.length || 0} artworks
                  </span>
                </div>

                {/* Title and Description */}
                <div className="mb-8">
                  <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {collection.name}
                  </h1>
                  <div className="w-12 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4" />
                  <p className="text-gray-300 text-lg leading-relaxed">
                    {collection.description || 'No description provided.'}
                  </p>
                </div>

                {/* Owner Info and Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mt-auto">
                  {/* Owner Info */}
                  <div className="flex items-center space-x-4">
                    {collection.owner?.profileImage ? (
                      <img
                        src={collection.owner.profileImage}
                        alt={collection.owner.username}
                        className="w-12 h-12 rounded-full border-2 border-white/20"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                        {collection.owner?.username?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div>
                      <p className="text-white font-semibold">by {collection.owner?.username || 'Unknown'}</p>
                      <p className="text-gray-400 text-sm">
                        Created {new Date(collection.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Owner Actions */}
                  {isOwner && (
                    <div className="flex flex-wrap gap-3">
                      <Link
                        to={`/collections/${id}/edit`}
                        className="bg-white/[0.04] text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition-all duration-300 border border-white/[0.06] flex items-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        <span>Edit Collection</span>
                      </Link>
                      <button
                        onClick={handleDeleteCollection}
                        className="bg-red-500/20 text-red-300 px-6 py-3 rounded-xl font-semibold hover:bg-red-500/30 transition-all duration-300 border border-red-500/30 flex items-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Artworks Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-8 border border-white/[0.06] shadow-2xl">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Artworks ({collection.artworks?.length || 0})
              </h2>
              <p className="text-gray-400">
                {isOwner ? 'Manage your collection artworks' : 'Browse the artworks in this collection'}
              </p>
            </div>
            {isOwner && (
              <button
                onClick={() => setShowAddArtworks(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 mt-4 sm:mt-0 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Artworks
              </button>
            )}
          </div>

          {/* Artworks Grid */}
          {collection.artworks && collection.artworks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {collection.artworks.map((artwork, index) => (
                <div
                  key={artwork._id}
                  className="group bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] hover:border-purple-500/50 transition-all duration-500 overflow-hidden hover:-translate-y-0.5 hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)] cursor-pointer animate-fade-in-up opacity-0 [animation-fill-mode:forwards]"
                  style={{ animationDelay: `${index * 80}ms` }}
                  onClick={() => handleArtworkClick(artwork)}
                >
                  {/* Artwork Image */}
                  <div className="relative h-48 overflow-hidden rounded-t-2xl">
                    <img
                      src={artwork.imageUrl}
                      alt={artwork.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500"></div>

                    {/* Overlay Stats */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-2">
                          <span className="bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                            {artwork.likes?.length || 0}
                          </span>
                          <span className="bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            {artwork.views || 0}
                          </span>
                        </div>
                        {isOwner && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveArtwork(artwork._id);
                            }}
                            className="bg-red-500/80 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs hover:bg-red-600 transition-colors duration-300 flex items-center gap-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Artwork Info */}
                  <div className="p-4">
                    <h4 className="text-white font-semibold mb-1 line-clamp-1 group-hover:text-purple-300 transition-colors duration-300">
                      {artwork.title}
                    </h4>
                    <p className="text-gray-400 text-sm line-clamp-1">
                      by {artwork.artistName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-white/[0.03] backdrop-blur-xl rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/[0.06]">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">No Artworks Yet</h3>
              <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
                {isOwner
                  ? 'Start building your collection by adding amazing artworks!'
                  : 'This collection is empty. Check back later for updates.'
                }
              </p>
              {isOwner && (
                <button
                  onClick={() => setShowAddArtworks(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 inline-flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add Your First Artwork
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tags Section */}
        {collection.tags && collection.tags.length > 0 && (
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-6 border border-white/[0.06] shadow-2xl mt-6">
            <h3 className="text-xl font-bold text-white mb-4">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {collection.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-white/[0.04] text-gray-300 px-3 py-2 rounded-lg text-sm border border-white/[0.06] hover:border-purple-500/50 transition-all duration-300 badge"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Artworks Modal */}
      {showAddArtworks && (
        <AddArtworksModal
          collectionId={id}
          onClose={() => setShowAddArtworks(false)}
          onArtworksAdded={handleArtworksAdded}
        />
      )}
    </div>
  );
};

export default CollectionDetail;
