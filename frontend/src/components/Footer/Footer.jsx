import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="relative bg-gray-950 border-t border-white/[0.06]">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/[0.02] to-transparent pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 py-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="space-y-3">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/30 transition-shadow">
                <span className="text-white font-bold text-xs">AH</span>
              </div>
              <span className="text-white font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">ArtHive</span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              A creative platform where artists share their work, connect with collectors, and get discovered.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-white text-sm font-semibold">Explore</h4>
            <div className="space-y-2">
              <Link to="/discover" className="block text-gray-500 hover:text-gray-300 text-sm transition-colors">Discover Art</Link>
              <Link to="/collections" className="block text-gray-500 hover:text-gray-300 text-sm transition-colors">Collections</Link>
              <Link to="/dashboard" className="block text-gray-500 hover:text-gray-300 text-sm transition-colors">Dashboard</Link>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-white text-sm font-semibold">Community</h4>
            <div className="space-y-2">
              <Link to="/upload" className="block text-gray-500 hover:text-gray-300 text-sm transition-colors">Upload Artwork</Link>
              <Link to="/saved" className="block text-gray-500 hover:text-gray-300 text-sm transition-colors">Saved Items</Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.06] pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-xs">&copy; {new Date().getFullYear()} ArtHive. All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600 text-xs">Built with passion for artists</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
