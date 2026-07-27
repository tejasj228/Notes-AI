'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { authAPI } from '@/api/auth';
import googleAuthService from '@/services/googleAuth';
import { auth, googleProvider } from '@/config/firebase';

// Defined at module scope so it isn't recreated on every render (which would
// remount the input and drop focus after one keystroke).
const IconField = ({ icon: Icon, ...props }) => (
  <div className="relative">
    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-ink" size={18} strokeWidth={2.5} />
    <input {...props} className="brutal-input w-full pl-10 pr-3 py-3 text-sm" />
  </div>
);

const AuthPage = ({ onAuthSuccess, onBackHome }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const processGoogleUser = async (googleUser) => {
    try {
      setLoading(true);
      setError('');
      const backendResponse = await authAPI.googleLogin(googleUser);
      if (backendResponse.success) {
        localStorage.setItem('authToken', backendResponse.data.token);
        localStorage.setItem('user', JSON.stringify(backendResponse.data.user));
        onAuthSuccess(backendResponse.data.user, backendResponse.data.token);
      } else {
        setError(backendResponse.message || 'Authentication failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = isLogin
        ? await authAPI.login({ email: formData.email, password: formData.password })
        : await authAPI.signup({ name: formData.name, email: formData.email, password: formData.password });

      if (response.success) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        onAuthSuccess(response.data.user, response.data.token);
      } else {
        setError(response.message || 'Authentication failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({ email: '', password: '', name: '' });
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      if (!auth || !googleProvider) throw new Error('Firebase not initialized');
      const googleResult = await googleAuthService.signInWithPopup();
      if (!googleResult.success) {
        setError(googleResult.error || 'Google sign-in failed');
        return;
      }
      await processGoogleUser(googleResult.user);
    } catch (err) {
      setError(`Authentication failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4">
      {/* Decorative floating stickers */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-[8%] w-16 h-16 bg-note-yellow border-3 border-ink shadow-brutal rotate-12 hidden md:block" />
        <div className="absolute bottom-16 left-[14%] w-12 h-12 bg-note-teal border-3 border-ink shadow-brutal -rotate-6 hidden md:block" />
        <div className="absolute top-24 right-[10%] w-20 h-20 bg-note-red border-3 border-ink shadow-brutal -rotate-12 hidden md:block" />
        <div className="absolute bottom-24 right-[16%] w-14 h-14 bg-note-green border-3 border-ink shadow-brutal rotate-6 hidden md:block" />
      </div>

      <div className="relative w-full max-w-md">
        <button
          onClick={onBackHome}
          className="brutal-eyebrow mb-4 inline-flex items-center gap-1 text-ink hover:text-brand transition-colors"
        >
          ← Back home
        </button>

        <div className="bg-card border-3 border-ink shadow-brutal-xl p-6 md:p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="inline-block bg-brand text-white border-3 border-ink shadow-brutal-sm px-3 py-1 font-display font-extrabold text-lg leading-none mb-4">
              NOTES·AI
            </div>
            <h1 className="font-display font-extrabold text-3xl leading-tight">
              {isLogin ? 'Welcome back.' : 'Make an account.'}
            </h1>
            <p className="text-sm text-ink/70 mt-1">
              {isLogin ? 'Sign in to your notes.' : 'Start capturing ideas in colour.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <IconField
                icon={User}
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Full name"
                required={!isLogin}
              />
            )}
            <IconField
              icon={Mail}
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Email address"
              required
            />
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-ink" size={18} strokeWidth={2.5} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="brutal-input w-full pl-10 pr-11 py-3 text-sm"
                placeholder="Password"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink"
              >
                {showPassword ? <EyeOff size={18} strokeWidth={2.5} /> : <Eye size={18} strokeWidth={2.5} />}
              </button>
            </div>

            {!isLogin && <p className="brutal-eyebrow text-ink/55">Min 6 characters</p>}

            {error && (
              <div className="border-3 border-ink bg-note-red p-3 text-sm font-semibold text-ink">{error}</div>
            )}

            <button type="submit" disabled={loading} className="brutal-btn w-full bg-brand text-white py-3 text-sm">
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isLogin ? 'Signing in…' : 'Creating…'}
                </>
              ) : (
                <>
                  {isLogin ? 'Sign in' : 'Create account'}
                  <ArrowRight size={16} strokeWidth={2.75} />
                </>
              )}
            </button>

            <div className="flex items-center gap-3 py-1">
              <div className="h-[3px] bg-ink flex-1" />
              <span className="brutal-eyebrow text-ink/60">or</span>
              <div className="h-[3px] bg-ink flex-1" />
            </div>

            <button type="button" onClick={handleGoogleSignIn} className="brutal-btn w-full bg-card text-ink py-3 text-sm">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-ink/75">
            {isLogin ? "No account yet?" : 'Already have one?'}
            <button type="button" onClick={toggleAuthMode} className="ml-2 font-bold text-brand underline">
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
