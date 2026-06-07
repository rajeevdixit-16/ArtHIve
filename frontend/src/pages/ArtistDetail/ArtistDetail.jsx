import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const ArtistDetail = () => {
  const { clerkUserId } = useParams();
  const { user } = useUser();
  const navigate = useNavigate();
  const [artist, setArtist] = useState(null);
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchArtistData();
  }, [clerkUserId]);

  const fetchArtistData = async () => {
    try {
      setLoading(true);
      setError('');

      const [userRes, artworksRes] = await Promise.all([
        fetch(`${BASE_URL}/api/users/clerk/${clerkUserId}`),
        fetch(`${BASE_URL}/api/artworks/user/${clerkUserId}`)
      ]);

      if (!userRes.ok) throw new Error('Artist not found');
      const userData = await userRes.json();

      const artworksData = artworksRes.ok ? (await artworksRes.json()).artworks || [] : [];

      setArtist(userData);
      setArtworks(artworksData);
    } catch (err) {
      setError(err.message || 'Failed to load artist');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900/20 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto" />
          <p className="text-gray-300 mt-4 text-lg">Loading artist...</p>
        </div>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900/20 pt-20 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-500/30">
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">Artist Not Found</h3>
          <p className="text-gray-400 mb-8">{error || 'The artist you are looking for does not exist.'}</p>
          <Link
            to="/discover"
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Discover
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900/20 pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to="/saved"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-300 mb-8 group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Back</span>
        </Link>

        <div className="card-glass p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {artist.profileImage ? (
              <img
                src={artist.profileImage}
                alt={artist.username}
                className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-white/10 shadow-2xl object-cover"
              />
            ) : (
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-white/10 shadow-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-5xl font-bold">
                {(artist.firstName || artist.username || 'A').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">
                {artist.firstName ? `${artist.firstName} ${artist.lastName || ''}` : artist.username}
              </h1>
              <p className="text-gray-400 text-lg mb-4">@{artist.username}</p>
              {artist.bio && (
                <p className="text-gray-300 leading-relaxed mb-6 max-w-xl">{artist.bio}</p>
              )}
              <div className="flex flex-wrap justify-center sm:justify-start gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{artist.stats?.artworksCount || 0}</p>
                  <p className="text-gray-400 text-sm">Artworks</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{artist.stats?.followersCount || 0}</p>
                  <p className="text-gray-400 text-sm">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{artist.stats?.followingCount || 0}</p>
                  <p className="text-gray-400 text-sm">Following</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            Artworks by {artist.firstName || artist.username}
          </h2>
          <div className="w-12 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-6" />
          {artworks.length === 0 ? (
            <div className="text-center py-16 card-glass">
              <svg className="w-16 h-16 mx-auto mb-4 text-white/[0.06]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1}>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              <p className="text-gray-400 text-lg">No artworks yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {artworks.map((artwork, i) => (
                <div
                  key={artwork._id}
                  className="group bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300 overflow-hidden hover:-translate-y-0.5 cursor-pointer animate-fade-in-up"
                  style={{ animationDelay: `${i * 75}ms` }}
                  onClick={() => navigate(`/artwork/${artwork._id}`)}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={artwork.imageUrl}
                      alt={artwork.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-semibold mb-1 truncate group-hover:text-purple-300 transition-colors">{artwork.title}</h3>
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                        {artwork.likes?.length || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        {artwork.viewedBy?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArtistDetail;
