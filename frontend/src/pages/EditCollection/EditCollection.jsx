// pages/EditCollection/EditCollection.jsx
import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useParams, useNavigate } from 'react-router-dom';
import { collectionService } from '../../services/collectionService';


const EditCollection = () => {
  const { id } = useParams();
  const { user } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    fetchCollection();
  }, [id]);

  const fetchCollection = async () => {
    try {
      setLoading(true);
      const response = await collectionService.getById(id);
      
      if (response.clerkUserId !== user?.id) {
        setError('You are not authorized to edit this collection');
        return;
      }

      setFormData({
        name: response.name,
        description: response.description || '',
        category: response.category || 'personal',
        tags: response.tags?.join(', ') || '',
        isPublic: response.isPublic
      });
      
    } catch (err) {
      console.error('Error fetching collection:', err);
      setError('Collection not found');
    } finally {
      setLoading(false);
    }
  };

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
      setError('Please sign in to edit collection');
      return;
    }

    if (!formData.name.trim()) {
      setError('Collection name is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const updates = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        clerkUserId: user.id
      };

      const result = await collectionService.update(id, updates);
      
      if (result.success) {
        navigate(`/collections/${id}`);
      } else {
        setError(result.error || 'Failed to update collection');
      }
    } catch (err) {
      console.error('Error updating collection:', err);
      setError(err.response?.data?.error || 'Failed to update collection');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this collection? This action cannot be undone.')) {
      return;
    }

    try {
      await collectionService.delete(id, user.id);
      navigate('/collections');
    } catch (err) {
      console.error('Error deleting collection:', err);
      setError('Failed to delete collection');
    }
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

  if (error && !formData.name) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 pt-20 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">Access Denied</h3>
          <p className="text-gray-400 mb-8">{error}</p>
          <button 
            onClick={() => navigate('/collections')} 
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300"
          >
            ← Back to Collections
          </button>
        </div>
      </div>
    );
  }

  const selectedCategory = categories.find(cat => cat.value === formData.category);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-purple-900/20 pt-20">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button 
              onClick={() => navigate(`/collections/${id}`)}
              className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-300 mb-4 group"
            >
              <span className="group-hover:-translate-x-1 transition-transform duration-300">←</span>
              <span>Back to Collection</span>
            </button>
            <h1 className="text-4xl font-bold text-white mb-2">Edit Collection</h1>
            <p className="text-gray-400 text-lg">Update your collection details and settings</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Edit Form */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              {/* Collection Name */}
              <div>
                <label htmlFor="name" className="block text-white font-semibold mb-3 text-lg">
                  Collection Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Digital Art Inspiration"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                  required
                  maxLength={100}
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-400 text-sm">Required field</span>
                  <span className="text-gray-400 text-sm">
                    {formData.name.length}/100
                  </span>
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
                  placeholder="Describe what this collection is about..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 resize-none"
                  rows="4"
                  maxLength={500}
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-400 text-sm">Optional</span>
                  <span className="text-gray-400 text-sm">
                    {formData.description.length}/500
                  </span>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-white font-semibold mb-4 text-lg">
                  Category
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                      <div className={`bg-white/5 border-2 rounded-xl p-4 text-center transition-all duration-300 hover:scale-105 ${
                        formData.category === category.value 
                          ? 'border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/20' 
                          : 'border-white/10 hover:border-purple-500/50'
                      }`}>
                        <div className="text-2xl mb-2">{category.icon}</div>
                        <div className="text-white font-medium">{category.label}</div>
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
                  placeholder="e.g., digital, nature, abstract, photography"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                />
                <div className="text-gray-400 text-sm mt-2">
                  Separate tags with commas
                </div>
              </div>

              {/* Privacy Settings */}
              <div>
                <label className="block text-white font-semibold mb-4 text-lg">
                  Visibility
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      name="isPublic"
                      value={true}
                      checked={formData.isPublic === true}
                      onChange={() => setFormData(prev => ({ ...prev, isPublic: true }))}
                      className="hidden"
                    />
                    <div className={`bg-white/5 border-2 rounded-xl p-6 transition-all duration-300 hover:scale-105 ${
                      formData.isPublic 
                        ? 'border-green-500 bg-green-500/20 shadow-lg shadow-green-500/20' 
                        : 'border-white/10 hover:border-green-500/50'
                    }`}>
                      <div className="flex items-center space-x-4">
                        <span className="text-3xl">🌎</span>
                        <div>
                          <div className="text-white font-semibold text-lg">Public</div>
                          <div className="text-gray-400 text-sm">Anyone can view this collection</div>
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
                    <div className={`bg-white/5 border-2 rounded-xl p-6 transition-all duration-300 hover:scale-105 ${
                      !formData.isPublic 
                        ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/20' 
                        : 'border-white/10 hover:border-blue-500/50'
                    }`}>
                      <div className="flex items-center space-x-4">
                        <span className="text-3xl">🔒</span>
                        <div>
                          <div className="text-white font-semibold text-lg">Private</div>
                          <div className="text-gray-400 text-sm">Only you can view this collection</div>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-white/10">
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => navigate(`/collections/${id}`)}
                    className="bg-white/10 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition-all duration-300 border border-white/10"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={saving || !formData.name.trim()}
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>
                
                <button
                  type="button"
                  onClick={handleDelete}
                  className="bg-red-500/20 text-red-300 px-6 py-3 rounded-xl font-semibold hover:bg-red-500/30 transition-all duration-300 border border-red-500/30 flex items-center space-x-2"
                  disabled={saving}
                >
                  <span>🗑️</span>
                  <span>Delete Collection</span>
                </button>
              </div>
            </form>
          </div>

          {/* Preview Section */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-6">Collection Preview</h3>
            
            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
              {/* Preview Cover */}
              <div className={`h-48 bg-gradient-to-r ${selectedCategory?.color || 'from-purple-500 to-pink-500'} relative overflow-hidden`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-6xl text-white/80 font-bold">
                    {formData.name ? formData.name.charAt(0).toUpperCase() : 'C'}
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex justify-between items-center">
                    <span className="bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                      {formData.isPublic ? '🌎 Public' : '🔒 Private'}
                    </span>
                    <span className="bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                      {selectedCategory?.icon} {selectedCategory?.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Preview Content */}
              <div className="p-6">
                <h4 className="text-2xl font-bold text-white mb-3">
                  {formData.name || 'Your Collection Name'}
                </h4>
                <p className="text-gray-300 mb-4 leading-relaxed">
                  {formData.description || 'Collection description will appear here...'}
                </p>
                
                {/* Tags Preview */}
                {formData.tags && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.split(',').map((tag, index) => (
                        tag.trim() && (
                          <span key={index} className="bg-white/10 text-gray-300 px-3 py-1 rounded-lg text-sm border border-white/10">
                            #{tag.trim()}
                          </span>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats Preview */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {user?.firstName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">by {user?.firstName || 'User'}</div>
                      <div className="text-gray-400 text-xs">Last updated just now</div>
                    </div>
                  </div>
                  <div className="text-gray-400 text-sm">
                    0 artworks
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Help Text */}
            <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-start space-x-3">
                <span className="text-purple-400 text-lg">💡</span>
                <div>
                  <h5 className="text-white font-semibold mb-1">Preview Tips</h5>
                  <p className="text-gray-400 text-sm">
                    This is how your collection will appear to others. Make sure all information is accurate and appealing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCollection;