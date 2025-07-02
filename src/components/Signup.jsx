import React, { useState } from 'react';
import { StickyNote, Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import './Auth.css';

const Signup = ({ onSignup, onSwitchToLogin, onGoogleSignup }) => {
  const [signupData, setSignupData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '' 
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (signupData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    if (!signupData.email.includes('@') || !signupData.email.includes('.')) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (signupData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (signupData.password !== signupData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      onSignup(signupData);
    }, 800);
  };

  const handleGoogleAuth = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onGoogleSignup();
    }, 1200);
  };

  const handleInputChange = (field, value) => {
    setSignupData({...signupData, [field]: value});
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({...errors, [field]: ''});
    }
  };

  return (
    <div className="auth-container">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}

      {/* Enhanced Background Effects */}
      <div className="floating-particles">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="particle"></div>
        ))}
      </div>

      <div className="floating-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
      </div>

      <div className="geometric-lines">
        <div className="animated-line line-horizontal"></div>
        <div className="animated-line line-vertical"></div>
      </div>

      <div className="auth-card">
        <div className="auth-header signup-header">
          <div className="auth-logo">
            <StickyNote size={32} strokeWidth={2.5} />
            <span>NOTES AI</span>
          </div>
          <p className="auth-subtitle">Create your account and start organizing</p>
        </div>

        <form className="auth-form signup-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              className={`auth-input ${errors.name ? 'error' : ''}`}
              placeholder="Full name"
              value={signupData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
              disabled={isLoading}
              autoComplete="name"
            />
            <User className="input-icon" size={20} strokeWidth={2} />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>

          <div className="input-group">
            <input
              type="email"
              className={`auth-input ${errors.email ? 'error' : ''}`}
              placeholder="Email address"
              value={signupData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              disabled={isLoading}
              autoComplete="email"
            />
            <Mail className="input-icon" size={20} strokeWidth={2} />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="input-group">
            <input
              type={showPassword ? "text" : "password"}
              className={`auth-input ${errors.password ? 'error' : ''}`}
              placeholder="Create password"
              value={signupData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              required
              disabled={isLoading}
              autoComplete="new-password"
            />
            <Lock className="input-icon" size={20} strokeWidth={2} />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          <div className="input-group">
            <input
              type="password"
              className={`auth-input ${errors.confirmPassword ? 'error' : ''}`}
              placeholder="Confirm password"
              value={signupData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              required
              disabled={isLoading}
              autoComplete="new-password"
            />
            <Lock className="input-icon" size={20} strokeWidth={2} />
            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
          </div>

          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>

          <div className="auth-divider signup-divider">
            <span>or</span>
          </div>

          <button 
            type="button" 
            className="auth-button google-btn" 
            onClick={handleGoogleAuth}
            disabled={isLoading}
          >
            <svg className="google-icon" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {isLoading ? 'Authenticating...' : 'Continue with Google'}
          </button>
        </form>

        <div className="auth-switch">
          Already have an account?{' '}
          <button 
            type="button"
            onClick={onSwitchToLogin} 
            disabled={isLoading}
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
};

export default Signup;