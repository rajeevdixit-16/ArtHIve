import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { collectionService } from '../../services/collectionService';

const CreateCollection = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'personal',
    tags: '',
    isPublic: true
  });

  const categories = [
    { value: 'personal', label: 'Personal', icon: '👤', color: 'from-purple-500 to-pink-500' },
    { value: 'inspiration', label: 'Inspiration', icon: '💫', color: 'from-blue-500 to-cyan-500' },
    { value: 'work', label: 'Work', icon: '💼', color: 'from-green-500 to-emerald-500' },
    { value: 'favorites', label: 'Favorites', icon: '⭐', color: 'from-orange-500 to-yellow-500' },
    { value: 'other', label: 'Other', icon: '📁', color: 'from-gray-500 to-gray-700' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      setError('Please sign in to create a collection');
      return;
    }

    if (!formData.name.trim()) {
      setError('Collection name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const collectionData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        clerkUserId: user.id
      };

      const result = await collectionService.create(collectionData);

      if (result.success) {
        navigate(`/collections/${result.collection._id}`);
      } else {
        setError(result.error || 'Failed to create collection');
      }
    } catch (err) {
      console.error('Error creating collection:', err);
      setError(err.response?.data?.error || 'Failed to create collection');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 pt-20 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Sign In Required</h2>
          <p className="text-gray-400 text-lg mb-8">Please sign in to create a collection.</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-purple-900/20 pt-20 px-4">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mb-6 shadow-2xl shadow-purple-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Create Collection
          </h1>
          <div className="w-12 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-6" />
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Organize your favorite artworks into beautiful, curated collections
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Form Section */}
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-8 border border-white/[0.06] shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 backdrop-blur-xl">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              {/* Collection Name */}
              <div>
                <label htmlFor="name" className="block text-white font-semibold mb-3 text-lg">
                  Collection Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Digital Art Inspiration, Nature Photography, My Portfolio"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/10 transition-all duration-300 outline-none"
                  required
                  maxLength={100}
                />
                <div className="flex justify-between mt-2">
                  <span className="text-gray-400 text-sm">Give your collection a meaningful name</span>
                  <span className="text-gray-400 text-sm">{formData.name.length}/100</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-white font-semibold mb-3 text-lg">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe what this collection is about, the theme, or what inspired it..."
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/10 transition-all duration-300 outline-none resize-none"
                  rows="4"
                  maxLength={500}
                />
                <div className="flex justify-between mt-2">
                  <span className="text-gray-400 text-sm">Optional but helpful for others</span>
                  <span className="text-gray-400 text-sm">{formData.description.length}/500</span>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-white font-semibold mb-3 text-lg">
                  Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {categories.map(category => (
                    <label key={category.value} className="cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        value={category.value}
                        checked={formData.category === category.value}
                        onChange={handleChange}
                        className="hidden"
                      />
                      <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                        formData.category === category.value
                          ? 'border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/20'
                          : 'border-white/[0.06] bg-white/[0.03] hover:border-white/20'
                      }`}>
                        <div className="text-center">
                          <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${category.color} flex items-center justify-center mx-auto mb-2`}>
                            <span className="text-xl">{category.icon}</span>
                          </div>
                          <span className="text-white font-medium text-sm">{category.label}</span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label htmlFor="tags" className="block text-white font-semibold mb-3 text-lg">
                  Tags
                </label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="digital, nature, abstract, photography, landscape"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/10 transition-all duration-300 outline-none"
                />
                <div className="mt-2">
                  <span className="text-gray-400 text-sm">Separate tags with commas</span>
                </div>
              </div>

              {/* Privacy Settings */}
              <div>
                <label className="block text-white font-semibold mb-3 text-lg">
                  Visibility
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      name="isPublic"
                      value={true}
                      checked={formData.isPublic === true}
                      onChange={() => setFormData(prev => ({ ...prev, isPublic: true }))}
                      className="hidden"
                    />
                    <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                      formData.isPublic
                        ? 'border-green-500 bg-green-500/20 shadow-lg shadow-green-500/20'
                        : 'border-white/[0.06] bg-white/[0.03] hover:border-white/20'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-green-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="2" y1="12" x2="22" y2="12" />
                          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                        <div>
                          <div className="text-white font-semibold">Public</div>
                          <div className="text-gray-400 text-sm">Anyone can view</div>
                        </div>
                      </div>
                    </div>
                  </label>

                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      name="isPublic"
                      value={false}
                      checked={formData.isPublic === false}
                      onChange={() => setFormData(prev => ({ ...prev, isPublic: false }))}
                      className="hidden"
                    />
                    <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                      !formData.isPublic
                        ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/20'
                        : 'border-white/[0.06] bg-white/[0.03] hover:border-white/20'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-blue-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        <div>
                          <div className="text-white font-semibold">Private</div>
                          <div className="text-gray-400 text-sm">Only you can view</div>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => navigate('/collections')}
                  disabled={loading}
                  className="flex-1 bg-white/10 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition-all duration-300 border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.name.trim()}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      <span>Create Collection</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Preview Section */}
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-8 border border-white/[0.06] shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Collection Preview
            </h3>
            <div className="w-12 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-6" />
            <div className="group bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] hover:border-purple-500/50 transition-all duration-500 overflow-hidden hover:-translate-y-0.5 hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)]">
              {/* Cover Image */}
              <div className="relative h-48 overflow-hidden rounded-t-2xl">
                {formData.name ? (
                  <div className={`w-full h-full bg-gradient-to-r ${
                    categories.find(cat => cat.value === formData.category)?.color || 'from-purple-500 to-pink-500'
                  } flex items-center justify-center`}>
                    <span className="text-6xl text-white/80 font-bold">
                      {formData.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-gray-600 to-gray-800 flex items-center justify-center">
                    <span className="text-white/60 text-lg">Collection Cover</span>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="flex justify-between items-center gap-2">
                    <span className="bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium badge">
                      0 artworks
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border badge flex items-center gap-1 ${
                      formData.isPublic
                        ? 'bg-green-500/20 text-green-300 border-green-500/30'
                        : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                    }`}>
                      {formData.isPublic ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="2" y1="12" x2="22" y2="12" />
                          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      )}
                      {formData.isPublic ? 'Public' : 'Private'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Collection Info */}
              <div className="p-6">
                <h4 className="text-white font-bold text-xl mb-3 line-clamp-1">
                  {formData.name || 'Your Collection Name'}
                </h4>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">
                  {formData.description || 'Collection description will appear here...'}
                </p>

                {/* Category */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${
                      categories.find(cat => cat.value === formData.category)?.color || 'from-purple-500 to-pink-500'
                    } flex items-center justify-center`}>
                      <span className="text-sm">
                        {categories.find(cat => cat.value === formData.category)?.icon || '📁'}
                      </span>
                    </div>
                    <span className="text-gray-300 text-sm">
                      {categories.find(cat => cat.value === formData.category)?.label || 'Personal'}
                    </span>
                  </div>
                </div>

                {/* Tags */}
                {formData.tags && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {formData.tags.split(',').map((tag, index) => (
                      tag.trim() && (
                        <span key={index} className="bg-white/[0.04] text-gray-300 px-2 py-1 rounded-lg text-xs border border-white/[0.06] badge">
                          {tag.trim()}
                        </span>
                      )
                    ))}
                  </div>
                )}

                {/* Stats */}
                <div className="flex justify-between items-center pt-4 border-t border-white/[0.06]">
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <div className="flex items-center space-x-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      <span>0</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                      <span>0</span>
                    </div>
                  </div>
                  <div className="text-purple-400 text-sm font-medium flex items-center gap-1">
                    Preview
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Tips */}
            <div className="mt-6 p-4 bg-white/[0.03] backdrop-blur-xl rounded-xl border border-white/[0.06]">
              <h4 className="text-white font-semibold mb-2 text-sm flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                Preview Tips
              </h4>
              <ul className="text-gray-400 text-sm space-y-1">
                <li className="flex items-center gap-2">• Collection name appears prominently</li>
                <li className="flex items-center gap-2">• Description helps others understand your theme</li>
                <li className="flex items-center gap-2">• Category and tags improve discoverability</li>
                <li className="flex items-center gap-2">• Privacy settings control visibility</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCollection;
