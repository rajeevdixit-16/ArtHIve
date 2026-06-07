import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import API from '../utils/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const { isLoaded, isSignedIn, user } = useUser();
  const [currentUser, setCurrentUser] = useState(null);
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync user with backend when authentication state changes
  useEffect(() => {
    const syncUserWithBackend = async () => {
      if (isSignedIn && user) {
        try {
          setLoading(true);
          setError(null);

          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
          
          const response = await fetch(`${backendUrl}/api/users/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              clerkUserId: user.id,
              email: user.primaryEmailAddress?.emailAddress,
              username: user.username || user.primaryEmailAddress?.emailAddress.split('@')[0],
              firstName: user.firstName,
              lastName: user.lastName,
              profileImage: user.profileImageUrl,
              lastSignInAt: user.lastSignInAt,
            }),
          });

          if (response.ok) {
            const userData = await response.json();
            console.log('User data from backend:', userData);
            setCurrentUser(userData.user);
            console.log('✅ User synced with backend:', userData.user.username);
          } else {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to sync user');
          }
        } catch (error) {
          console.error('❌ Failed to sync user with backend:', error);
          setError(error.message);
        } finally {
          setLoading(false);
        }
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    };

    if (isLoaded) {
      syncUserWithBackend();
    }
  }, [isLoaded, isSignedIn, user]);

  // Fetch user's artworks when user changes
  useEffect(() => {
    const fetchUserArtworks = async () => {
      if (currentUser?.clerkUserId) {
        try {
          setLoading(true);
          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
          
          const response = await fetch(
            `${backendUrl}/api/artworks/user/${currentUser.clerkUserId}`
          );

          if (response.ok) {
            const data = await response.json();
            setArtworks(data.artworks || []);
          }
        } catch (error) {
          console.error('❌ Failed to fetch user artworks:', error);
          setError('Failed to load artworks');
        } finally {
          setLoading(false);
        }
      } else {
        setArtworks([]);
      }
    };

    fetchUserArtworks();
  }, [currentUser]);

  // Create new artwork
  const createArtwork = async (artworkData) => {
    try {
      setError(null);
      const response = await API.post('/artworks', {
        ...artworkData,
        clerkUserId: user.id,
      });
      const newArtwork = response.data;
      setArtworks(prev => [newArtwork.artwork, ...prev]);
      return newArtwork;
    } catch (error) {
      console.error('❌ Failed to create artwork:', error);
      setError(error.response?.data?.error || error.message);
      throw error;
    }
  };

  // Update artwork
  const updateArtwork = async (artworkId, updates) => {
    try {
      setError(null);
      const response = await API.put(`/artworks/${artworkId}`, {
        ...updates,
        clerkUserId: user.id,
      });
      const updatedArtwork = response.data;
      setArtworks(prev =>
        prev.map(artwork =>
          artwork._id === artworkId ? updatedArtwork.artwork : artwork
        )
      );
      return updatedArtwork;
    } catch (error) {
      console.error('❌ Failed to update artwork:', error);
      setError(error.response?.data?.error || error.message);
      throw error;
    }
  };

  // Delete artwork
  const deleteArtwork = async (artworkId) => {
    try {
      setError(null);
      const response = await API.delete(`/artworks/${artworkId}`, {
        data: { clerkUserId: user.id },
      });
      setArtworks(prev => prev.filter(artwork => artwork._id !== artworkId));
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to delete artwork:', error);
      setError(error.response?.data?.error || error.message);
      throw error;
    }
  };

  // Like artwork
  const likeArtwork = async (artworkId) => {
    try {
      const response = await API.post(`/artworks/${artworkId}/like`, {
        clerkUserId: user.id,
      });
      return response.data;
    } catch (error) {
      console.error('❌ Failed to like artwork:', error);
      setError(error.response?.data?.error || error.message);
      throw error;
    }
  };

  // Clear error
  const clearError = () => setError(null);

  // Refresh user data
  const refreshUser = async () => {
    if (user) {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      
      try {
        const response = await fetch(`${backendUrl}/api/users/clerk/${user.id}`);
        if (response.ok) {
          const userData = await response.json();
          setCurrentUser(userData);
        }
      } catch (error) {
        console.error('❌ Failed to refresh user:', error);
      }
    }
  };

  const value = {
    // User state
    currentUser,
    isSignedIn,
    clerkUser: user,
    
    // Artwork state
    artworks,
    
    // UI state
    loading,
    error,
    
    // Actions
    createArtwork,
    updateArtwork,
    deleteArtwork,
    likeArtwork,
    clearError,
    refreshUser,
    
    // Utilities
    isAuthenticated: isSignedIn && !!currentUser,
    userRole: currentUser?.role || 'user',
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};