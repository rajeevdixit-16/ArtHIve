import React from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';

const Landing = () => {
  const { isSignedIn, user } = useUser();

  const features = [
    { icon: '🎨', title: 'Discover Art', description: 'Explore thousands of artworks from talented artists worldwide' },
    { icon: '🖼️', title: 'Create Collections', description: 'Organize your favorite artworks into personalized collections' },
    { icon: '👥', title: 'Connect with Artists', description: 'Follow your favorite artists and discover new talents' },
    { icon: '💫', title: 'Share Your Work', description: 'Showcase your creativity and build your artistic portfolio' },
  ];

  const stats = [
    { value: '10K+', label: 'Artworks' },
    { value: '5K+', label: 'Artists' },
    { value: '50K+', label: 'Collectors' },
  ];

  if (isSignedIn) {
    return (
      <div className="page-content min-h-screen">
        <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-950 via-[#1e1b4b] to-gray-900">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-float" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-1.5s' }} />
          </div>
          <div className="container mx-auto px-6 py-20 text-center relative z-10">
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-sm font-medium mb-6">
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                Welcome back
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 animate-fade-in-up delay-100 leading-tight">
              Welcome back,{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {user?.firstName || 'Artist'}
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto animate-fade-in-up delay-200 leading-relaxed">
              Your creative journey continues. Discover new masterpieces, connect with fellow artists, and showcase your work to the world.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-300">
              <Link to="/discover" className="btn-gradient text-lg px-10 py-3.5">
                Explore Artworks
              </Link>
              <Link to="/profile" className="btn-outline text-lg px-10 py-3.5">
                Your Profile
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto mt-16 animate-fade-in-up delay-400">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-gray-400 text-sm mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 bg-gradient-to-b from-gray-950 to-[#0f0a1a]">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16 animate-fade-in-up">
              <div className="w-12 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-4" />
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Your Creative Hub</h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">Everything you need to explore, create, and share art</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="card-glass hover:-translate-y-1 transition-transform duration-300 animate-fade-in-up text-center"
                  style={{ animationDelay: `${(index + 1) * 100}ms` }}
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center text-2xl mb-4 mx-auto">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-content min-h-screen">
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-950 via-[#1e1b4b] to-gray-900">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-pink-900/20 animate-gradient" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-[100px] animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-[120px] animate-float" style={{ animationDelay: '-1.5s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[150px]" />
        </div>

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-4 h-4 bg-purple-400/30 rounded-full animate-float" />
          <div className="absolute top-40 right-20 w-6 h-6 bg-pink-400/20 rounded-full animate-float" style={{ animationDelay: '-0.8s' }} />
          <div className="absolute bottom-40 left-20 w-3 h-3 bg-purple-300/40 rounded-full animate-float" style={{ animationDelay: '-1.2s' }} />
          <div className="absolute bottom-20 right-10 w-5 h-5 bg-pink-300/30 rounded-full animate-float" style={{ animationDelay: '-2s' }} />
          <div className="absolute top-1/3 left-1/3 w-2 h-16 bg-purple-400/10 rounded-full rotate-45 animate-float" style={{ animationDelay: '-0.5s' }} />
          <div className="absolute top-2/3 right-1/3 w-16 h-2 bg-pink-400/10 rounded-full -rotate-12 animate-float" style={{ animationDelay: '-1.8s' }} />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="animate-fade-in-up">
              <Link to="/" className="inline-flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <span className="text-white font-bold text-xl">AH</span>
                </div>
                <span className="text-white text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  ArtHive
                </span>
              </Link>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 animate-fade-in-up delay-100 leading-tight">
              Where Art Finds Its{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Digital Home
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto animate-fade-in-up delay-200 leading-relaxed">
              Join thousands of artists and art enthusiasts in our growing community.
              Discover amazing artwork, create collections, and share your creativity with the world.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-300">
              <Link to="/signup" className="btn-gradient text-lg px-10 py-3.5 inline-flex items-center gap-2">
                Get Started Free
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link to="/login" className="btn-outline text-lg px-10 py-3.5">
                Sign In
              </Link>
            </div>

            <div className="flex items-center justify-center gap-6 mt-16 animate-fade-in-up delay-400">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-gray-800 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                    A
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-gray-800 bg-gray-800 flex items-center justify-center text-gray-400 text-xs font-medium">
                  +2K
                </div>
              </div>
              <div className="text-left">
                <div className="text-white font-semibold">2,000+ Artists</div>
                <div className="text-gray-400 text-sm">Already on ArtHive</div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-fade-in-up delay-500">
          <div className="flex flex-col items-center gap-2">
            <span className="text-gray-500 text-sm">Scroll to explore</span>
            <div className="w-5 h-8 border-2 border-gray-600 rounded-full flex justify-center p-1">
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-b from-gray-950 to-[#0f0a1a]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="w-12 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-4" />
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Why Choose ArtHive?</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">Everything you need to explore, create, and share art</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="card-glass hover:-translate-y-1 transition-transform duration-300 animate-fade-in-up text-center"
                style={{ animationDelay: `${(index + 1) * 100}ms` }}
              >
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center text-2xl mb-4 mx-auto">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-b from-[#0f0a1a] to-gray-950 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-purple-600/5 rounded-full blur-[150px]" />
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-12 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-4" />
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Ready to Start Your{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Artistic Journey
              </span>
              ?
            </h2>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Join our community today and unlock a world of creativity, inspiration, and connection.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup" className="btn-gradient text-lg px-10 py-3.5 inline-flex items-center gap-2">
                Create Free Account
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link to="/login" className="btn-outline text-lg px-10 py-3.5">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-8 border-t border-white/[0.06] bg-gray-950">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">AH</span>
              </div>
              <span className="text-white font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">ArtHive</span>
            </Link>
            <p className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} ArtHive. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
