import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const CreateArtworkForm = () => {
  const { currentUser, clerkUser } = useApp();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    price: 0
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      alert('Please sign in to create artwork');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/artworks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          artistName: clerkUser.fullName || 'Anonymous Artist',
          tags: formData.tags.split(',').map(tag => tag.trim()),
          clerkUserId: clerkUser.id,
          isPublic: true
        }),
      });

      if (response.ok) {
        const createdArtwork = await response.json();
        console.log('Artwork created:', createdArtwork);
        // Reset form or redirect
        setFormData({
          title: '',
          description: '',
          category: '',
          tags: '',
          price: 0
        });
        alert('Artwork created successfully!');
      } else {
        const error = await response.json();
        alert('Error creating artwork: ' + error.message);
      }
    } catch (error) {
      console.error('Error creating artwork:', error);
      alert('Failed to create artwork');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Title"
        value={formData.title}
        onChange={(e) => setFormData({...formData, title: e.target.value})}
        required
      />
      <textarea
        placeholder="Description"
        value={formData.description}
        onChange={(e) => setFormData({...formData, description: e.target.value})}
        required
      />
      <input
        type="text"
        placeholder="Category"
        value={formData.category}
        onChange={(e) => setFormData({...formData, category: e.target.value})}
        required
      />
      <input
        type="text"
        placeholder="Tags (comma separated)"
        value={formData.tags}
        onChange={(e) => setFormData({...formData, tags: e.target.value})}
      />
      <input
        type="number"
        placeholder="Price"
        value={formData.price}
        onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
      />
      <button type="submit">Create Artwork</button>
    </form>
  );
};

export default CreateArtworkForm;