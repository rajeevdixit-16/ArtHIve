import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserButton, useUser, SignedIn, SignedOut } from '@clerk/clerk-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const location = useLocation();
  const { user } = useUser();

  const navItems = [
    { id: 'discover', label: 'Discover', icon: '🔍', color: 'from-blue-500 to-cyan-500', path: '/discover' },
    { id: 'collections', label: 'Collections', icon: '🖼️', color: 'from-purple-500 to-pink-500', path: '/collections' },
    { id: 'saved', label: 'Saved', icon: '⭐', color: 'from-red-500 to-orange-500', path: '/saved' },
    { id: 'dashboard', label: 'Dashboard', icon: '📊', color: 'from-green-500 to-emerald-500', path: '/dashboard' },
  ];

  const isActive = (path) => {
    if (path === '/discover' || path === '/') {
      return location.pathname === '/' || location.pathname === '/discover';
    }
    return location.pathname === path;
  };

  const getUserInitial = () => {
    if (user?.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-black/95 backdrop-blur-xl border-b border-white/10">
      <div className="w-full px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 cursor-pointer flex-shrink-0">
            <div className="w-9 h-9 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/25">
              <span className="text-white font-bold text-sm">AH</span>
            </div>
            <span className="text-white text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              ArtHive
            </span>
          </Link>

          {/* Desktop Navigation */}
          <SignedIn>
            <nav className="hidden lg:flex items-center space-x-1 bg-white/5 rounded-2xl p-1 border border-white/10 mx-8">
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`relative flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                    isActive(item.path)
                      ? `text-white bg-gradient-to-r ${item.color} shadow-lg`
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="text-sm">{item.icon}</span>
                  <span className="text-sm">{item.label}</span>
                  {isActive(item.path) && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>
                  )}
                </Link>
              ))}
            </nav>
          </SignedIn>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center space-x-3 flex-shrink-0">
            <SignedIn>
              {/* Upload Button */}
              <Link 
                to="/upload"
                className="group relative bg-gradient-to-r from-purple-600 to-pink-600 text-white px-5 py-2.5 rounded-full font-semibold text-sm hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 flex items-center space-x-2 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="text-lg font-bold">+</span>
                <span>Upload</span>
              </Link>

              {/* User Profile with Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center space-x-3 p-2 rounded-xl hover:bg-white/5 transition-all duration-300 group"
                >
                  <span className="text-gray-300 text-sm group-hover:text-white">
                    Hi, {user?.firstName || 'User'}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-sm border-2 border-white/20">
                      {getUserInitial()}
                    </div>
                    <span className={`text-gray-400 group-hover:text-white transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
                  </div>
                </button>

                {/* Profile Dropdown */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-black/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl py-2 z-50">
                    <Link 
                      to="/profile"
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-300"
                    >
                      <span>👤</span>
                      <span>My Profile</span>
                    </Link>
                    <Link 
                      to="/profile"
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-300"
                    >
                      <span>⚙️</span>
                      <span>Settings</span>
                    </Link>
                    <div className="border-t border-white/10 my-2"></div>
                    <div className="px-4 py-2">
                      <UserButton 
                        afterSignOutUrl="/"
                        appearance={{
                          elements: {
                            userButtonAvatarBox: "w-6 h-6",
                            userButtonTrigger: "w-full justify-start text-gray-300 hover:text-white text-sm"
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </SignedIn>

            <SignedOut>
              <div className="flex items-center space-x-3">
                <Link 
                  to="/login"
                  className="text-gray-300 hover:text-white px-4 py-2 rounded-full font-medium text-sm hover:bg-white/5 transition-all duration-300"
                >
                  Login
                </Link>
                <Link 
                  to="/signup"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-5 py-2.5 rounded-full font-semibold text-sm hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300"
                >
                  Sign Up
                </Link>
              </div>
            </SignedOut>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-3 md:hidden">
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="text-gray-300 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
            >
              🔍
            </button>

            <button 
              className="text-white relative p-2 hover:bg-white/5 rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <div className="w-6 h-6 flex flex-col justify-center space-y-1">
                <span className={`block h-0.5 w-full bg-current transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
                <span className={`block h-0.5 w-full bg-current transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`block h-0.5 w-full bg-current transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isSearchOpen && (
          <div className="md:hidden mt-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search artwork or artist..."
                className="w-full bg-white/10 border border-white/20 rounded-full px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pl-12"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
              </div>
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-white/10 pt-4">
            <SignedIn>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {navItems.map((item) => (
                  <Link
                    key={item.id}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-2 p-3 rounded-xl font-medium transition-all duration-300 text-center ${
                      isActive(item.path)
                        ? `text-white bg-gradient-to-r ${item.color} shadow-lg`
                        : 'text-gray-300 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-sm">{item.icon}</span>
                    <span className="text-sm">{item.label}</span>
                  </Link>
                ))}
              </div>
              
              <div className="space-y-2 border-t border-white/10 pt-4">
                <Link 
                  to="/upload"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold justify-center"
                >
                  <span>+</span>
                  <span>Upload Artwork</span>
                </Link>
                <Link 
                  to="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-3 p-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg w-full"
                >
                  <span>👤</span>
                  <span>My Profile</span>
                </Link>
                <Link 
                  to="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-3 p-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg w-full"
                >
                  <span>⚙️</span>
                  <span>Settings</span>
                </Link>
                <div className="pt-2 border-t border-white/10">
                  <div className="p-3 text-gray-300">
                    <UserButton 
                      afterSignOutUrl="/"
                      appearance={{
                        elements: {
                          userButtonTrigger: "w-full justify-start"
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </SignedIn>

            <SignedOut>
              <div className="space-y-2">
                <Link 
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full flex items-center justify-center p-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg"
                >
                  Login
                </Link>
                <Link 
                  to="/signup"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full flex items-center justify-center p-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold"
                >
                  Sign Up
                </Link>
              </div>
            </SignedOut>
          </div>
        )}
      </div>

      {/* Close dropdown when clicking outside */}
      {isProfileDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsProfileDropdownOpen(false)}
        ></div>
      )}
    </header>
  );
};

export default Header;