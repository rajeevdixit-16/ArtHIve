import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/clerk-react';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [pageLoading, setPageLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const inputRefs = useRef([]);

  // Send verification code - DEFINE FIRST before useEffect
  const sendVerificationCode = useCallback(async (emailAddress) => {
    if (!emailAddress) {
      console.warn('⚠️ No email provided');
      return;
    }
    
    try {
      const response = await fetch('/api/users/send-verification-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          email: emailAddress,
          clerkUserId: user?.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Failed to send verification code:', data.error);
        setError('Failed to send verification code. Please try again.');
      } else {
        console.log('✅ Verification code sent to:', emailAddress);
        setSuccess('✅ Verification code sent to your email');
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err) {
      console.error('Error sending verification code:', err);
      setError('Failed to send verification code. Please try again.');
    }
  }, [user?.id]);

  // NOW use it in useEffect
  useEffect(() => {
    if (!isLoaded) {
      console.log('⏳ Waiting for Clerk to load...');
      return;
    }

    let isMounted = true;

    const initializeVerification = async () => {
      if (user) {
        const userEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress;
        if (userEmail && isMounted) {
          setEmail(userEmail);
          console.log('✅ Email automatically set from Clerk:', userEmail);
          await sendVerificationCode(userEmail);
          setPageLoading(false);
        } else if (!userEmail && retryCount < 2 && isMounted) {
          console.log(`⏳ Waiting for email data (retry ${retryCount + 1})`);
          setTimeout(() => setRetryCount(retryCount + 1), 500);
        } else if (isMounted) {
          console.log('ℹ️ Showing manual email entry');
          setShowEmailInput(true);
          setPageLoading(false);
        }
      } else if (retryCount < 2 && isMounted) {
        console.log(`⏳ Waiting for Clerk user (retry ${retryCount + 1})`);
        setTimeout(() => setRetryCount(retryCount + 1), 800);
      } else if (isMounted) {
        console.log('ℹ️ Showing manual email entry (user not loaded)');
        setShowEmailInput(true);
        setPageLoading(false);
      }
    };

    initializeVerification();

    return () => {
      isMounted = false;
    };
  }, [isLoaded, user, sendVerificationCode, retryCount]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Handle individual digit input
  const handleInputChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle manual email submission
  const handleManualEmailSubmit = async (e) => {
    e.preventDefault();
    
    if (!manualEmail || !manualEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    
    await sendVerificationCode(manualEmail);
    setEmail(manualEmail);
    setShowEmailInput(false);
    setLoading(false);
  };

  // Verify email
  const handleVerify = async (e) => {
    e.preventDefault();
    const code = verificationCode.join('');

    if (code.length !== 6) {
      setError('Please enter all 6 digits');
      setSuccess('');
      return;
    }

    const emailToUse = email || user?.primaryEmailAddress?.emailAddress;
    
    if (!emailToUse) {
      setError('Email not found. Please refresh and try again.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/users/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: emailToUse,
          verificationCode: code
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setSuccess('✅ Email verified successfully!');
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to verify email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend verification code
  const handleResend = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/users/resend-verification-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          email,
          clerkUserId: user?.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend code');
      }

      setSuccess('✅ New verification code sent to your email');
      setVerificationCode(['', '', '', '', '', '']);
      setResendTimer(60);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* Loading State */}
        {pageLoading && (
          <div className="text-center animate-fade-in-up">
            <div className="inline-block">
              <div className="w-12 h-12 border-4 border-purple-500 border-t-pink-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white text-center">Loading verification page...</p>
            </div>
          </div>
        )}

        {!pageLoading && (
        <>
        
        {/* EMAIL INPUT FORM - If Clerk didn't load user */}
        {showEmailInput && (
          <div className="animate-fade-in-up">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/50">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-white text-2xl font-bold">Grand Gallery</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">Verify Your Email</h1>
            <div className="w-12 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4 mx-auto" />
            <p className="text-gray-300 text-sm">Enter your email to receive a verification code</p>
          </div>

          {/* Card */}
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-8 border border-white/[0.06]">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-red-400 text-sm text-center font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleManualEmailSubmit} className="space-y-4">
              <div>
                <label className="text-white text-sm font-semibold mb-2 block">Email Address</label>
                <input
                  type="email"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/10 transition-all duration-300 outline-none w-full"
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Verification Code'}
              </button>
            </form>
          </div>
          </div>
        )}

        {/* NORMAL VERIFICATION FORM */}
        {!showEmailInput && (
          <div className="animate-fade-in-up">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/50">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-white text-2xl font-bold">Grand Gallery</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">Verify Your Email</h1>
            <div className="w-12 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4 mx-auto" />
            <p className="text-gray-300 text-sm">
              We've sent a verification code to <br />
              <span className="text-purple-400 font-semibold">{email}</span>
            </p>
          </div>

          {/* Card */}
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-8 border border-white/[0.06]">
          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
              <p className="text-green-400 text-sm text-center font-medium">{success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-red-400 text-sm text-center font-medium">{error}</p>
            </div>
          )}

          {/* Verification Code Input */}
          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="text-white text-sm font-semibold mb-4 block">
                Enter 6-digit Code
              </label>
              <div className="flex gap-3 justify-center">
                {verificationCode.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-bold bg-white/[0.04] border-2 border-white/[0.12] text-white rounded-xl focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/10 transition-all duration-300 outline-none hover:border-white/[0.2]"
                    placeholder="0"
                    disabled={loading}
                  />
                ))}
              </div>
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading || verificationCode.some(d => !d)}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          {/* Resend Code */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm mb-3">
              Didn't receive the code?
            </p>
            <button
              onClick={handleResend}
              disabled={resendTimer > 0 || loading}
              className="text-purple-400 hover:text-purple-300 text-sm font-semibold transition-colors disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
            </button>
          </div>

          {/* Change Email */}
          <div className="mt-8 pt-6 border-t border-white/[0.06] text-center">
            <p className="text-gray-400 text-sm mb-3">Wrong email address?</p>
            <button
              onClick={() => {
                signOut();
                navigate('/signup');
              }}
              className="text-purple-400 hover:text-purple-300 text-sm font-semibold transition-colors"
            >
              Back to Sign Up
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06]">
          <p className="text-blue-300 text-xs text-center flex items-center justify-center">
            <svg className="w-4 h-4 mr-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            The verification code will expire in 15 minutes. Check your spam folder if you can't find the email.
          </p>
        </div>
          </>
        )}
        </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
