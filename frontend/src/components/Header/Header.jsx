import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserButton, useUser, SignedIn, SignedOut } from '@clerk/clerk-react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { user } = useUser();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems = [
    { id: 'discover', label: 'Discover', path: '/discover' },
    { id: 'collections', label: 'Collections', path: '/collections' },
    { id: 'saved', label: 'Saved', path: '/saved' },
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard' },
  ];

  const isActive = (path) => {
    if (path === '/discover') {
      return location.pathname === '/' || location.pathname === '/discover';
    }
    return location.pathname === path;
  };

  const getUserInitial = () => {
    if (user?.firstName) return user.firstName.charAt(0).toUpperCase();
    return 'U';
  };

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-500 ${
      scrolled
        ? 'bg-gray-950/80 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_4px_30px_rgba(0,0,0,0.3)]'
        : 'bg-transparent'
    }`}>
      <div className="w-full px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 cursor-pointer flex-shrink-0 group">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:shadow-purple-500/40 transition-shadow duration-300">
              <span className="text-white font-bold text-lg">AH</span>
            </div>
            <span className="text-white text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              ArtHive
            </span>
          </Link>

          <SignedIn>
            <nav className="hidden lg:flex items-center space-x-1 bg-white/[0.03] backdrop-blur-sm rounded-2xl p-1 border border-white/[0.06] mx-8">
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`relative px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 ${
                    isActive(item.path)
                      ? 'text-white bg-gradient-to-r from-purple-600/80 to-pink-600/80 shadow-lg shadow-purple-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  {item.label}
                  {isActive(item.path) && (
                    <span className="absolute -bottom-px left-1/2 -translate-x-1/2 w-8 h-[2px] bg-gradient-to-r from-purple-400 to-pink-400 rounded-full" />
                  )}
                </Link>
              ))}
            </nav>
          </SignedIn>

          <div className="hidden md:flex items-center space-x-3 flex-shrink-0">
            <SignedIn>
              <Link
                to="/upload"
                className="group relative bg-gradient-to-r from-purple-600 to-pink-600 text-white px-5 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 flex items-center space-x-2 overflow-hidden hover:shadow-xl hover:shadow-purple-500/30"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="text-lg font-bold relative z-10">+</span>
                <span className="relative z-10">Upload</span>
              </Link>

              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center space-x-3 p-1.5 pr-3 rounded-xl hover:bg-white/[0.06] transition-all duration-300 group border border-transparent hover:border-white/[0.06]"
                >
                  <span className="text-gray-400 text-sm group-hover:text-white transition-colors">
                    Hi, {user?.firstName || 'User'}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-sm ring-2 ring-white/10">
                      {getUserInitial()}
                    </div>
                    <svg className={`w-3 h-3 text-gray-500 group-hover:text-gray-300 transition-all duration-300 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isProfileDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileDropdownOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-52 bg-gray-900/95 backdrop-blur-xl rounded-xl border border-white/[0.06] shadow-2xl py-2 z-50 animate-fade-in">
                      <div className="px-4 py-3 border-b border-white/[0.06] mb-1">
                        <p className="text-white text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
                        <p className="text-gray-500 text-xs truncate">{user?.emailAddresses?.[0]?.emailAddress || ''}</p>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center space-x-3 px-4 py-2.5 text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all duration-200 text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        <span>My Profile</span>
                      </Link>
                      <Link
                        to="/dashboard"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center space-x-3 px-4 py-2.5 text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all duration-200 text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                        <span>Dashboard</span>
                      </Link>
                      
                      <div className="border-t border-white/[0.06] my-1" />
                      <div className="px-4 py-2">
                        <UserButton
                          afterSignOutUrl="/"
                          appearance={{
                            elements: {
                              userButtonAvatarBox: "w-6 h-6",
                              userButtonTrigger: "w-full justify-start text-gray-400 hover:text-white text-sm"
                            }
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </SignedIn>

            <SignedOut>
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-gray-400 hover:text-white px-4 py-2 rounded-full font-medium text-sm hover:bg-white/[0.06] transition-all duration-300"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-5 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30"
                >
                  Sign Up
                </Link>
              </div>
            </SignedOut>
          </div>

          <div className="flex items-center space-x-3 md:hidden">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/[0.06] rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>

            <button
              className="text-white relative p-2 hover:bg-white/[0.06] rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <div className="w-5 h-5 flex flex-col justify-center space-y-1">
                <span className={`block h-0.5 w-full bg-current transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
                <span className={`block h-0.5 w-full bg-current transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`} />
                <span className={`block h-0.5 w-full bg-current transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
              </div>
            </button>
          </div>
        </div>

        {isSearchOpen && (
          <div className="md:hidden mt-3 animate-fade-in-down">
            <div className="relative">
              <input
                type="text"
                placeholder="Search artwork or artist..."
                className="w-full bg-white/[0.06] border border-white/[0.08] rounded-full px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 pl-12 transition-all duration-300"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        )}

        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-white/[0.06] pt-4 animate-fade-in">
            <SignedIn>
              <div className="space-y-1 mb-4">
                {navItems.map((item) => (
                  <Link
                    key={item.id}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                      isActive(item.path)
                        ? 'text-white bg-gradient-to-r from-purple-600/50 to-pink-600/50'
                        : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    <span className="text-sm">{item.label}</span>
                  </Link>
                ))}
              </div>

              <div className="space-y-2 border-t border-white/[0.06] pt-4">
                <Link
                  to="/upload"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full flex items-center justify-center space-x-2 p-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold"
                >
                  <span className="text-lg">+</span>
                  <span>Upload Artwork</span>
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/[0.06] rounded-lg"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  <span>My Profile</span>
                </Link>
                <Link
                  to="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/[0.06] rounded-lg"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                  <span>Dashboard</span>
                </Link>
                <div className="pt-2 border-t border-white/[0.06]">
                  <div className="px-4 py-2">
                    <UserButton
                      afterSignOutUrl="/"
                      appearance={{
                        elements: {
                          userButtonTrigger: "w-full justify-start text-gray-400 hover:text-white"
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
                  className="w-full flex items-center justify-center p-3 text-gray-400 hover:text-white hover:bg-white/[0.06] rounded-lg"
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
    </header>
  );
};

export default Header;
