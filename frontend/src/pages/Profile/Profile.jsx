import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

const Profile = () => {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      setLoading(false);
    }
  }, [isLoaded]);

  // Get user initial for avatar fallback
  const getUserInitial = () => {
    if (user?.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    }
    return user?.username?.charAt(0).toUpperCase() || 'U';
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-gray-300 mt-4 text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900/20 flex items-center justify-center px-6">
        <div className="text-center max-w-2xl">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
            Profile Not Found
          </h1>
          <p className="text-gray-300 text-xl mb-8">Please sign in to view your profile</p>
          <Link 
            to="/login" 
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-10 py-4 rounded-2xl font-semibold hover:shadow-2xl hover:shadow-purple-500/40 transition-all duration-300 transform hover:scale-105"
          >
            <span>Sign In</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900/20 flex items-center justify-center px-6">
      <div className="w-full max-w-4xl">
        {/* Profile Header */}
        <div className="relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 rounded-3xl blur-3xl"></div>
          
          <div className="relative bg-gradient-to-br from-white/5 to-white/10 rounded-3xl p-12 border border-white/10 backdrop-blur-2xl shadow-2xl">
            <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-8 lg:space-y-0 lg:space-x-12">
              {/* Profile Picture */}
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500"></div>
                <div className="relative">
                  {!imgError ? (
                    <img 
                      src={user.imageUrl} 
                      alt="Profile" 
                      className="w-40 h-40 rounded-full border-4 border-white/20 shadow-2xl object-cover transform group-hover:scale-105 transition-transform duration-300"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div 
                      className="w-40 h-40 rounded-full border-4 border-white/20 shadow-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-5xl font-bold transform group-hover:scale-105 transition-transform duration-300"
                    >
                      {getUserInitial()}
                    </div>
                  )}
                  <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full border-4 border-gray-900 flex items-center justify-center shadow-lg">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                </div>
              </div>
              
              {/* User Info */}
              <div className="flex-1 text-center lg:text-left">
                <div className="mb-8">
                  <h1 className="text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-3">
                    {user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User Name'}
                  </h1>
                  <p className="text-2xl text-gray-400 mb-8 font-light">
                    @{user.username || user.primaryEmailAddress?.emailAddress?.split('@')[0] || 'user'}
                  </p>
                </div>

                {/* Contact Info */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                  {user.primaryEmailAddress && (
                    <div className="flex items-center space-x-2 bg-white/10 px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-sm hover:bg-white/15 transition-all duration-300">
                      <span className="text-lg">📧</span>
                      <span className="text-sm font-medium">{user.primaryEmailAddress.emailAddress}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 bg-white/10 px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-sm hover:bg-white/15 transition-all duration-300">
                    <span className="text-lg">📅</span>
                    <span className="text-sm font-medium">
                      Joined {new Date(user.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  {user.publicMetadata?.website && (
                    <div className="flex items-center space-x-2 bg-white/10 px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-sm hover:bg-white/15 transition-all duration-300">
                      <span className="text-lg">🌐</span>
                      <a 
                        href={user.publicMetadata.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm font-medium hover:text-purple-300 transition-colors"
                      >
                        {user.publicMetadata.website}
                      </a>
                    </div>
                  )}
                  {user.publicMetadata?.location && (
                    <div className="flex items-center space-x-2 bg-white/10 px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-sm hover:bg-white/15 transition-all duration-300">
                      <span className="text-lg">📍</span>
                      <span className="text-sm font-medium">{user.publicMetadata.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;