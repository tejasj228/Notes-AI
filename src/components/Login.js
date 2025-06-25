import React, { useState } from 'react';
import { StickyNote, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import './Auth.css';

const Login = ({ onLogin, onSwitchToSignup, onGoogleLogin }) => {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      onLogin(loginData);
    }, 800);
  };

  const handleGoogleAuth = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onGoogleLogin();
    }, 1200);
  };

  return (
    <div className="auth-container">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}

      {/* Background Elements */}
      <div className="floating-shapes">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`shape shape-${i + 1}`}></div>
        ))}
        {/* Floating particles */}
        {[...Array(15)].map((_, i) => (
          <div 
            key={i}
            className="particle" 
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${4 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <StickyNote size={36} />
            NOTES AI
          </div>
          <p className="auth-subtitle">Welcome back! Sign in to your account</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="email"
              className="auth-input"
              placeholder="Enter your email"
              value={loginData.email}
              onChange={(e) => setLoginData({...loginData, email: e.target.value})}
              required
              disabled={isLoading}
            />
            <Mail className="input-icon" size={20} />
          </div>

          <div className="input-group">
            <input
              type={showPassword ? "text" : "password"}
              className="auth-input"
              placeholder="Enter your password"
              value={loginData.password}
              onChange={(e) => setLoginData({...loginData, password: e.target.value})}
              required
              disabled={isLoading}
            />
            <Lock className="input-icon" size={20} />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>

          <button 
            type="button" 
            className="auth-button google-btn" 
            onClick={handleGoogleAuth}
            disabled={isLoading}
          >
            <svg className="google-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {isLoading ? 'Authenticating...' : 'Continue with Google'}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <div className="auth-switch">
          Don't have an account?{' '}
          <button onClick={onSwitchToSignup} disabled={isLoading}>
            Sign up here
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;