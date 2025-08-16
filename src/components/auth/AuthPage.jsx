import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';
import { authAPI } from '../../api/auth';
import googleAuthService from '../../services/googleAuth';
import { auth, googleProvider } from '../../config/firebase';

const AuthPage = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Floating elements animation variants
  const floatingElements = [
    { id: 1, size: 60, delay: 0, color: 'rgba(139, 92, 246, 0.1)' },
    { id: 2, size: 80, delay: 2, color: 'rgba(168, 85, 247, 0.08)' },
    { id: 3, size: 40, delay: 4, color: 'rgba(147, 51, 234, 0.12)' },
    { id: 4, size: 100, delay: 1, color: 'rgba(126, 34, 206, 0.06)' },
    { id: 5, size: 50, delay: 3, color: 'rgba(139, 92, 246, 0.15)' }
  ];

  // Handle Google sign-in (no redirect checking needed)
  useEffect(() => {
    console.log('🔍 AuthPage mounted');
    console.log('📍 Current URL:', window.location.href);
  }, []);

  // Process Google user data (shared between popup and redirect)
  const processGoogleUser = async (googleUser) => {
    try {
      setLoading(true);
      setError('');

      console.log('🔄 Processing Google user:', googleUser);
      
      // Send to your backend
      const backendResponse = await authAPI.googleLogin(googleUser);
      
      console.log('📡 Backend response:', backendResponse);
      
      if (backendResponse.success) {
        console.log('✅ Backend authentication successful');
        
        // Store token and user data
        localStorage.setItem('authToken', backendResponse.data.token);
        localStorage.setItem('user', JSON.stringify(backendResponse.data.user));
        
        console.log('💾 Stored token and user data');
        console.log('👤 User data stored:', backendResponse.data.user);
        console.log('🆔 User ID:', backendResponse.data.user.id);
        console.log('📧 User email:', backendResponse.data.user.email);
        console.log('🔑 Token stored:', backendResponse.data.token ? 'Yes' : 'No');
        
        // Call the success callback with both user data and token
        console.log('🎉 Calling onAuthSuccess...');
        onAuthSuccess(backendResponse.data.user, backendResponse.data.token);
      } else {
        console.error('❌ Backend authentication failed:', backendResponse.message);
        setError(backendResponse.message || 'Authentication failed');
      }
      
    } catch (error) {
      console.error('💥 Error processing Google user:', error);
      setError(error.response?.data?.message || error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let response;
      if (isLogin) {
        response = await authAPI.login({
          email: formData.email,
          password: formData.password
        });
      } else {
        response = await authAPI.signup({
          name: formData.name,
          email: formData.email,
          password: formData.password
        });
      }

      if (response.success) {
        // Store token and user data
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Call success callback with both user data and token
        onAuthSuccess(response.data.user, response.data.token);
      } else {
        setError(response.message || 'Authentication failed');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
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
      
      console.log('🔐 Testing Firebase connection...');
      console.log('📍 Firebase Auth:', auth);
      console.log('📍 Google Provider:', googleProvider);
      
      // Test Firebase connection first
      if (!auth || !googleProvider) {
        throw new Error('Firebase not properly initialized');
      }
      
      console.log('🔐 Starting Google sign-in...');
      const googleResult = await googleAuthService.signInWithPopup();
      
      if (!googleResult.success) {
        console.error('❌ Google sign-in failed:', googleResult.error);
        setError(googleResult.error || 'Google sign-in failed');
        return;
      }
      
      console.log('✅ Google sign-in successful, processing user...');
      await processGoogleUser(googleResult.user);
      
    } catch (error) {
      console.error('💥 Google authentication error:', error);
      setError(`Authentication failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center relative overflow-hidden">
      {/* Animated Background Elements */}
      {floatingElements.map((element) => (
        <motion.div
          key={element.id}
          className="absolute rounded-full opacity-20"
          style={{
            width: element.size,
            height: element.size,
            background: element.color,
          }}
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 8 + element.delay,
            repeat: Infinity,
            ease: "easeInOut",
            delay: element.delay,
          }}
          initial={{
            x: Math.random() * 1000,
            y: Math.random() * 800,
          }}
        />
      ))}

      {/* Gradient Orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      <div className="absolute top-40 right-20 w-72 h-72 bg-pink-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-indigo-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Glass Card */}
        <div className="bg-gray-800/40 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-700/50">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-4"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </motion.div>
            
            <h1 className="text-3xl font-bold text-white mb-2">
              {isLogin ? 'Welcome Back' : 'Join Notes AI'}
            </h1>
            <p className="text-gray-400">
              {isLogin 
                ? 'Sign in to your Notes-AI account' 
                : 'Create your account to get started'
              }
            </p>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                      placeholder="Full Name"
                      required={!isLogin}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="relative"
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                placeholder="Email Address"
                required
              />
            </motion.div>

            {/* Password Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="relative"
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-10 pr-12 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                placeholder="Password"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </motion.div>

            {/* Password requirement hint for signup */}
            {!isLogin && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-gray-500"
              >
                Password must be at least 6 characters long
              </motion.p>
            )}

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-300 text-sm"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-purple-600/50 disabled:to-purple-700/50 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  {isLogin ? 'Signing In...' : 'Creating Account...'}
                </div>
              ) : (
                <div className="flex items-center">
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </motion.button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600/50"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-800/40 text-gray-400">or</span>
              </div>
            </div>

            {/* Google Sign In Button */}
            <motion.button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full bg-white/10 hover:bg-white/20 border border-gray-600/50 text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </div>
            </motion.button>
          </form>

          {/* Toggle Auth Mode */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-6"
          >
            <p className="text-gray-400">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                type="button"
                onClick={toggleAuthMode}
                className="text-purple-400 hover:text-purple-300 font-medium ml-2 transition-colors"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-8"
        >
          <p className="text-gray-500 text-sm">
            Powered by AI • Secure • Fast
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
