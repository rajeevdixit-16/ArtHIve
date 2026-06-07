import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-[#0f172a]">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-[#0f172a] to-pink-900/20 animate-gradient" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(147,51,234,0.08)_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(236,72,153,0.06)_0%,transparent_60%)]" />

      <div className="relative z-10 w-full max-w-sm animate-fade-in-up">
        {/* Glass card */}
        <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          {/* Brand logo */}
          <div className="text-center mb-6">
            <Link to="/" className="inline-flex items-center space-x-2 group">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-all duration-300">
                <span className="text-white font-bold text-lg">AH</span>
              </div>
              <span className="text-white text-2xl font-bold">ArtHive</span>
            </Link>
          </div>

          {/* Gradient accent line */}
          <div className="w-12 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-6 mx-auto" />

          {/* Gradient title */}
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent text-center mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-400 text-sm text-center mb-8">
            Sign in to continue
          </p>

          <SignIn
            routing="path"
            path="/login"
            redirectUrl=""
            signUpUrl="/signup"
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-transparent shadow-none p-0 m-0 w-full",
                header: "hidden",
                socialButtonsBlock: "flex flex-col space-y-2 mb-4",
                socialButtons: "w-full",
                socialButton:
                  "w-full bg-white/[0.04] text-white border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] transition-all duration-200 rounded-xl py-2.5 px-3 text-sm font-medium backdrop-blur-sm",
                dividerLine: "bg-white/[0.06] my-4",
                dividerText: "text-gray-500 text-xs px-2",
                form: "space-y-4",
                formField: "space-y-1.5",
                formFieldLabel: "text-gray-300 font-medium text-xs",
                formFieldInput:
                  "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/10 focus:bg-white/[0.06] transition-all duration-300 outline-none",
                formButtonPrimary:
                  "w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 mt-2 text-sm",
                footer: "hidden",
                formResendCodeLink: "text-purple-400 hover:text-purple-300 text-xs transition-colors",
                alert: "bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl p-3 text-xs mt-2",
                alertText: "text-red-300 text-xs",
                alertIcon: "text-red-400 w-3 h-3",
                forgotPasswordLink: "text-purple-400 hover:text-purple-300 text-xs block text-center mt-2 transition-colors",
                formFieldAction: "text-xs"
              },
              layout: {
                socialButtonsPlacement: "top"
              },
              variables: {
                colorPrimary: "#8B5CF6",
                colorText: "#FFFFFF",
                colorTextSecondary: "#9CA3AF",
                colorBackground: "transparent",
                colorInputBackground: "rgba(255, 255, 255, 0.04)",
                colorInputText: "#FFFFFF",
                fontSize: "14px"
              }
            }}
          />
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-400 text-sm">
            New to ArtHive?{' '}
            <Link
              to="/signup"
              className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
