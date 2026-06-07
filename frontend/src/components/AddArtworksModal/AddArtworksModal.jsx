
import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { collectionService } from '../../services/collectionService';
import './AddArtworksModal.css';

const AddArtworksModal = ({ collectionId, onClose, onArtworksAdded }) => {
  const { user } = useUser();
  const [userArtworks, setUserArtworks] = useState([]);
  const [selectedArtworks, setSelectedArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      fetchUserArtworks();
    }
  }, [user]);

  const fetchUserArtworks = async () => {
  try {
    setLoading(true);
    console.log('🔄 Fetching artworks for user:', user.id);
    console.log('📝 Collection ID:', collectionId);
    
    // Use the available-artworks endpoint from collections
    const response = await collectionService.getAvailableArtworks(collectionId, user.id);
    
    console.log('📦 Full API response:', response);
    console.log('✅ Response success:', response?.success);
    console.log('🎨 Artworks array:', response?.artworks);
    console.log('📊 Artworks count:', response?.artworks?.length);
    
    if (response.success) {
      setUserArtworks(response.artworks || []);
    } else {
      console.error('❌ API error:', response.error);
      setUserArtworks([]);
    }
  } catch (error) {
    console.error('❌ Fetch error:', error);
    console.error('❌ Error details:', error.response?.data || error.message);
    setUserArtworks([]);
  } finally {
    setLoading(false);
  }
};

  const handleAddArtworks = async () => {
    if (selectedArtworks.length === 0) {
      alert('Please select at least one artwork');
      return;
    }

    try {
      // Add each selected artwork to the collection using your service
      for (const artworkId of selectedArtworks) {
        await collectionService.addArtwork(collectionId, artworkId, user.id);
      }

      // Fetch the updated collection
      const updatedCollection = await collectionService.getById(collectionId);
      
      onArtworksAdded(updatedCollection);
      onClose();
      
    } catch (error) {
      console.error('Error adding artworks:', error);
      alert('Failed to add artworks: ' + error.message);
    }
  };

  const filteredArtworks = userArtworks.filter(artwork =>
    artwork.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    artwork.artistName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    artwork.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleArtworkSelection = (artworkId) => {
    if (selectedArtworks.includes(artworkId)) {
      setSelectedArtworks(selectedArtworks.filter(id => id !== artworkId));
    } else {
      setSelectedArtworks([...selectedArtworks, artworkId]);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Artworks to Collection</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {/* Search Bar */}
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search artworks by title, artist, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading your artworks...</p>
            </div>
          ) : filteredArtworks.length === 0 ? (
            <div className="empty-state">
              <p>No artworks available to add.</p>
              <p>Create some artworks first or all your artworks are already in this collection.</p>
            </div>
          ) : (
            <div className="artworks-list">
              {filteredArtworks.map(artwork => (
                <div 
                  key={artwork._id}
                  className={`artwork-item ${selectedArtworks.includes(artwork._id) ? 'selected' : ''}`}
                  onClick={() => toggleArtworkSelection(artwork._id)}
                >
                  <input 
                    type="checkbox"
                    checked={selectedArtworks.includes(artwork._id)}
                    onChange={() => toggleArtworkSelection(artwork._id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <img 
                    src={artwork.imageUrl} 
                    alt={artwork.title}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/60x60?text=No+Image';
                    }}
                  />
                  <div className="artwork-info">
                    <h4>{artwork.title || 'Untitled'}</h4>
                    <p>By {artwork.artistName || 'Unknown Artist'}</p>
                    {artwork.tags && artwork.tags.length > 0 && (
                      <div className="artwork-tags">
                        {artwork.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="tag">{tag}</span>
                        ))}
                        {artwork.tags.length > 3 && (
                          <span className="tag">+{artwork.tags.length - 3} more</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button 
            onClick={handleAddArtworks}
            disabled={selectedArtworks.length === 0 || loading}
          >
            Add Selected ({selectedArtworks.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddArtworksModal;