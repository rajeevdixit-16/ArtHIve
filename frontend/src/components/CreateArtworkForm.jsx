import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const CreateArtworkForm = () => {
  const { currentUser, clerkUser } = useApp();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    price: 0
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [cloudinaryUrl, setCloudinaryUrl] = useState('');
  const [cloudinaryId, setCloudinaryId] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));

    // Auto-analyze: upload to preview endpoint for AI description
    setAnalyzing(true);
    const fd = new FormData();
    fd.append('image', file);
    fd.append('title', formData.title || 'Untitled');
    fd.append('category', formData.category || 'digital');
    fd.append('customTags', formData.tags);
    fd.append('description', formData.description);

    try {
      const res = await fetch(`${API_BASE}/api/upload/preview`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        setCloudinaryUrl(data.cloudinaryUrl);
        setCloudinaryId(data.cloudinaryId);
        if (data.generatedDescription) {
          setFormData(prev => ({ ...prev, description: data.generatedDescription }));
        }
      }
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      alert('Please sign in to create artwork');
      return;
    }

    if (!imageFile && !cloudinaryUrl) {
      alert('Please select an image');
      return;
    }

    setUploading(true);

    try {
      const fd = new FormData();
      if (imageFile) fd.append('image', imageFile);
      fd.append('title', formData.title);
      fd.append('description', formData.description);
      fd.append('category', formData.category);
      fd.append('customTags', formData.tags);
      fd.append('clerkUserId', clerkUser.id);
      if (cloudinaryUrl) fd.append('cloudinaryUrl', cloudinaryUrl);
      if (cloudinaryId) fd.append('cloudinaryId', cloudinaryId);

      const res = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: fd });
      const data = await res.json();

      if (data.success) {
        setFormData({ title: '', description: '', category: '', tags: '', price: 0 });
        setImageFile(null);
        setPreviewUrl('');
        setCloudinaryUrl('');
        setCloudinaryId('');
        alert('Artwork created successfully!');
      } else {
        alert('Error: ' + (data.error || 'Upload failed'));
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to create artwork');
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-4 p-6 bg-white/5 rounded-2xl border border-white/10">
      {/* Image picker */}
      <div>
        {previewUrl ? (
          <div className="relative mb-2">
            <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
            <button type="button" onClick={() => { setImageFile(null); setPreviewUrl(''); setCloudinaryUrl(''); setCloudinaryId(''); }} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 text-sm">&times;</button>
          </div>
        ) : (
          <label className="block border-2 border-dashed border-white/20 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500/50 transition-colors">
            <span className="text-gray-400">Click to upload artwork image</span>
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </label>
        )}
        {analyzing && (
          <div className="flex items-center gap-2 text-sm text-purple-400">
            <span className="inline-block w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            AI is generating a description...
          </div>
        )}
      </div>

      <input
        type="text"
        placeholder="Title *"
        value={formData.title}
        onChange={e => handleChange('title', e.target.value)}
        required
        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
      />

      <div className="relative">
        <textarea
          placeholder="Description (AI auto-generates from your image)"
          value={formData.description}
          onChange={e => handleChange('description', e.target.value)}
          rows={4}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 resize-none"
        />
        {formData.description && (
          <span className="absolute bottom-3 right-3 text-xs text-gray-500">{formData.description.split(' ').length} words</span>
        )}
      </div>

      <input
        type="text"
        placeholder="Category (e.g. painting, digital, photography)"
        value={formData.category}
        onChange={e => handleChange('category', e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
      />

      <input
        type="text"
        placeholder="Tags (comma separated)"
        value={formData.tags}
        onChange={e => handleChange('tags', e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
      />

      <button
        type="submit"
        disabled={uploading || !formData.title.trim()}
        className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-300"
      >
        {uploading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Uploading...
          </span>
        ) : 'Create Artwork'}
      </button>
    </form>
  );
};

export default CreateArtworkForm;
