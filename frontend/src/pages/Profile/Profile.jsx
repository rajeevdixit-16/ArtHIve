import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

// SVG Icons
const MailIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M22 4L12 13 2 4" />
  </svg>
);

const GlobeIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
  </svg>
);

const LocationIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

const LinkIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
  </svg>
);

const TwitterIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22 4.01c-1 .49-1.98.689-3 .99-1.121-1.265-2.783-1.335-4.38-.737S11.977 5.323 12 7v1c-3.245.083-6.135-1.064-8-3 0 0-4.182 7.433 2 11-1.872 1.247-3.739 2.088-6 2 3.308 1.803 6.913 2.423 10.034 1.517 3.58-1.04 6.522-3.723 8.012-7.205.44-1.027.454-2.105.454-3.152 0-.473-.077-.953-.277-1.402-.18-.404-.405-.78-.723-1.062.247-.116.49-.246.725-.396.89-.57 1.602-1.269 2.225-2.1-.816.399-1.638.646-2.476.828.866-.571 1.497-1.331 2.026-2.186z" />
  </svg>
);

const InstagramIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
    <path d="M17.5 6.5h.01" />
  </svg>
);

const ArtworkIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87" />
    <path d="M16 3.13a4 4 0 010 7.75" />
  </svg>
);

const HeartIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);

const VerifiedIcon = () => (
  <svg className="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const Profile = () => {
  const { user, isLoaded } = useUser();
  const { currentUser, refreshUser } = useApp();
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      setLoading(false);
    }
  }, [isLoaded]);

  useEffect(() => {
    if (user) {
      refreshUser();
    }
  }, [user]);

  const getUserInitial = () => {
    if (user?.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    }
    return user?.username?.charAt(0).toUpperCase() || 'U';
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown';

  const stats = [
    { label: 'Artworks', value: currentUser?.stats?.artworksCount ?? '—', icon: <ArtworkIcon /> },
    { label: 'Followers', value: currentUser?.stats?.followersCount ?? '—', icon: <UsersIcon /> },
    { label: 'Following', value: currentUser?.stats?.followingCount ?? '—', icon: <HeartIcon /> },
  ];

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto" />
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900/20">
      <div className="page-content max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ===== Profile Header ===== */}
        <div className="animate-slide-in-up">
          {/* Gradient Banner */}
          <div className="relative rounded-3xl overflow-hidden mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 via-fuchsia-600/20 to-pink-600/30 animate-gradient" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(147,51,234,0.2),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(236,72,153,0.15),transparent_60%)]" />
            <div className="relative px-6 sm:px-10 pt-10 sm:pt-14 pb-8 sm:pb-10">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-10">
                {/* Avatar */}
                <div className="relative -mb-16 sm:-mb-20 group shrink-0">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 rounded-full opacity-75 blur-md group-hover:opacity-100 group-hover:blur-xl transition-all duration-500" />
                  <div className="absolute -inset-3 bg-gradient-to-r from-purple-500/20 via-fuchsia-500/20 to-pink-500/20 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500" />
                  <div className="relative">
                    {!imgError ? (
                      <img
                        src={user.imageUrl}
                        alt="Profile"
                        className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-white/20 shadow-2xl object-cover transform group-hover:scale-105 transition-transform duration-500"
                        onError={() => setImgError(true)}
                      />
                    ) : (
                      <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-white/20 shadow-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-4xl sm:text-5xl font-bold transform group-hover:scale-105 transition-transform duration-500">
                        {getUserInitial()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Name & Info */}
                <div className="flex-1 text-center sm:text-left pb-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-1">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
                      {user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User Name'}
                    </h1>
                    <VerifiedIcon />
                  </div>
                  <p className="text-lg sm:text-xl text-white/60 font-light mb-4">
                    @{user.username || user.primaryEmailAddress?.emailAddress?.split('@')[0] || 'user'}
                  </p>
                  {user.unsafeMetadata?.bio && (
                    <p className="text-white/80 max-w-xl leading-relaxed text-sm sm:text-base">
                      {user.unsafeMetadata.bio}
                    </p>
                  )}
                </div>

                
              </div>
            </div>
          </div>
        </div>

        {/* ===== Stats Row ===== */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`card-glass flex items-center gap-3 sm:gap-4 p-4 sm:p-5 animate-slide-in-up delay-${(i + 1) * 100}`}
            >
              <div className="text-purple-400 shrink-0">{stat.icon}</div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-xs sm:text-sm text-gray-400">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ===== Profile Info Cards ===== */}
        <div className="animate-slide-in-up delay-400">
          <h2 className="text-xl font-semibold text-white mb-5 flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full inline-block" />
            Profile Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Email */}
            {user.primaryEmailAddress && (
              <div className="card-glass flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
                  <MailIcon />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Email</p>
                  <p className="text-sm font-medium text-white truncate">
                    {user.primaryEmailAddress.emailAddress}
                  </p>
                </div>
              </div>
            )}

            {/* Website */}
            {user.publicMetadata?.website && (
              <div className="card-glass flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                  <GlobeIcon />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Website</p>
                  <a
                    href={user.publicMetadata.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-purple-300 hover:text-purple-200 transition-colors truncate block"
                  >
                    {user.publicMetadata.website}
                  </a>
                </div>
              </div>
            )}

            {/* Location */}
            {user.publicMetadata?.location && (
              <div className="card-glass flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                  <LocationIcon />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Location</p>
                  <p className="text-sm font-medium text-white truncate">
                    {user.publicMetadata.location}
                  </p>
                </div>
              </div>
            )}

            {/* Member Since */}
            <div className="card-glass flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                <CalendarIcon />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Member Since</p>
                <p className="text-sm font-medium text-white truncate">{memberSince}</p>
              </div>
            </div>

            {/* Social Links */}
            {(user.publicMetadata?.twitter || user.publicMetadata?.instagram) && (
              <div className="card-glass sm:col-span-2 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-pink-500/15 text-pink-400 flex items-center justify-center shrink-0">
                  <LinkIcon />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Social Links</p>
                  <div className="flex flex-wrap gap-3">
                    {user.publicMetadata.twitter && (
                      <a
                        href={`https://twitter.com/${user.publicMetadata.twitter}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white/80 hover:text-white transition-all duration-200"
                      >
                        <TwitterIcon />
                        <span>@{user.publicMetadata.twitter}</span>
                      </a>
                    )}
                    {user.publicMetadata.instagram && (
                      <a
                        href={`https://instagram.com/${user.publicMetadata.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white/80 hover:text-white transition-all duration-200"
                      >
                        <InstagramIcon />
                        <span>@{user.publicMetadata.instagram}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
