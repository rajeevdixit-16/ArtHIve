import React, { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

const EditProfile = () => {
  const { user } = useUser();
  const { openUserProfile } = useClerk();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    bio: ''
  });

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        bio: user.publicMetadata?.bio || '',
        website: user.publicMetadata?.website || '',
        location: user.publicMetadata?.location || '',
        socialLinks: {
          twitter: user.publicMetadata?.socialLinks?.twitter || '',
          instagram: user.publicMetadata?.socialLinks?.instagram || '',
          behance: user.publicMetadata?.socialLinks?.behance || '',
          dribbble: user.publicMetadata?.socialLinks?.dribbble || ''
        }
      });
    }
  }, [user]);

  const validateForm = () => {
    const newErrors = {};

    // Required fields (remove username)
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    // Optional username validation (if you want to keep it for display)
    if (formData.username.trim() && formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (formData.username.trim() && !/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    if (formData.bio.length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters';
    }

    if (formData.website && !isValidUrl(formData.website)) {
      newErrors.website = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSocialLinkChange = (platform, value) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value
      }
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setErrors({});

    if (!validateForm()) {
      setSaving(false);
      setMessage('❌ Please fix the errors below.');
      return;
    }

    try {
      console.log('🔄 Starting profile update...');

      const updates = {};

      // 1. Only update firstName and lastName (remove username)
      if (formData.firstName.trim() !== (user.firstName || '')) {
        updates.firstName = formData.firstName.trim();
      }
      if (formData.lastName.trim() !== (user.lastName || '')) {
        updates.lastName = formData.lastName.trim();
      }

      // 2. Use unsafeMetadata for all custom fields
      const currentPublicMetadata = user.publicMetadata || {};

      updates.publicMetadata = {
        ...currentPublicMetadata,
        bio: formData.bio.trim() || null,
        website: formData.website?.trim() || null,
        location: formData.location?.trim() || null,
        socialLinks: formData.socialLinks || [],
      };

      

      console.log('Final updates payload:', updates);

      // Perform the update
      await user.update(updates);

      console.log('✅ Profile update successful');
      setMessage('✅ Profile updated successfully!');

      setTimeout(() => {
        navigate('/profile');
      }, 2000);

    } catch (error) {
      console.error('❌ Error updating profile:', error);

      if (error.errors) {
        console.error('Full Clerk errors:', error.errors);
      }

      let errorMessage = 'Failed to update profile.';

      if (error.errors && error.errors.length > 0) {
        const clerkError = error.errors[0];
        errorMessage = `❌ ${clerkError.message || clerkError.longMessage || 'Unknown error'}`;
      }

      setMessage(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/profile');
  };

  const openClerkProfile = () => {
    openUserProfile();
  };

  // Safe user check
  if (!user) {
    return (
      <div className="pt-20 pb-10 px-6">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-300 text-lg mb-8">Please sign in to edit your profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-10 px-6">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Edit Profile</h1>
          <p className="text-gray-300 text-lg">Update your personal information and preferences</p>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl border ${message.includes('✅')
            ? 'bg-green-500/20 border-green-500/30 text-green-200'
            : 'bg-red-500/20 border-red-500/30 text-red-200'
            }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Basic Information Card */}
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <span className="mr-3">👤</span>
                  Basic Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-white font-semibold block mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`w-full bg-white/10 border rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.firstName ? 'border-red-500' : 'border-white/20'
                        }`}
                      placeholder="Enter your first name"
                    />
                    {errors.firstName && (
                      <p className="text-red-400 text-sm mt-1">{errors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-white font-semibold block mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`w-full bg-white/10 border rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.lastName ? 'border-red-500' : 'border-white/20'
                        }`}
                      placeholder="Enter your last name"
                    />
                    {errors.lastName && (
                      <p className="text-red-400 text-sm mt-1">{errors.lastName}</p>
                    )}
                  </div>

                  {/* Username Field - Display Only */}
                  <div className="md:col-span-2">
                    <label className="text-white font-semibold block mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Display username "
                      disabled={true}
                    />
                    <p className="text-gray-400 text-sm mt-2">
                      Your username is managed through your account settings.
                      <button
                        type="button"
                        onClick={openClerkProfile}
                        className="text-purple-400 hover:underline ml-1 font-semibold"
                      >
                        Manage Account
                      </button>
                    </p>

                  </div>
                </div>
              </div>

              {/* Bio Card */}
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <span className="mr-3">📝</span>
                  About & Links
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="text-white font-semibold block mb-2">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows="4"
                      className={`w-full bg-white/10 border rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none ${errors.bio ? 'border-red-500' : 'border-white/20'
                        }`}
                      placeholder="Tell us about yourself, your art style, inspirations..."
                    />
                    {errors.bio ? (
                      <p className="text-red-400 text-sm mt-1">{errors.bio}</p>
                    ) : (
                      <p className={`text-sm mt-2 ${formData.bio.length > 450 ? 'text-yellow-400' : 'text-gray-400'
                        }`}>
                        {formData.bio.length}/500 characters
                      </p>
                    )}
                  </div>


                </div>
              </div>


              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-end pt-6">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-8 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-all duration-300 border border-white/20 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 disabled:opacity-50 flex items-center space-x-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>💾</span>
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Preview */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <span className="mr-2">👁️</span>
                Preview
              </h3>

              <div className="text-center">
                <img
                  src={user.imageUrl}
                  alt="Profile"
                  className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-white/20"
                />
                <h4 className="text-white font-semibold text-lg">
                  {formData.firstName} {formData.lastName}
                </h4>
                <p className="text-gray-400">@{formData.username}</p>
                {formData.bio && (
                  <p className="text-gray-300 text-sm mt-2 line-clamp-3">
                    {formData.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Account Settings */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <span className="mr-2">⚙️</span>
                Account Settings
              </h3>

              <div className="space-y-3">
                <button
                  onClick={openClerkProfile}
                  className="w-full text-left p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 text-white flex items-center space-x-3"
                >
                  <span>🔒</span>
                  <span>Security & Password</span>
                </button>

                <button
                  onClick={openClerkProfile}
                  className="w-full text-left p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 text-white flex items-center space-x-3"
                >
                  <span>📧</span>
                  <span>Email & Notifications</span>
                </button>

                <button
                  onClick={openClerkProfile}
                  className="w-full text-left p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 text-white flex items-center space-x-3"
                >
                  <span>🖼️</span>
                  <span>Change Profile Picture</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;