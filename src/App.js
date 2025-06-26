import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Signup from './components/Signup';
import NotesApp from './components/NotesApp';
import './index.css';
const App = () => {
  const [currentView, setCurrentView] = useState('login'); // 'login', 'signup', 'notes'
  const [user, setUser] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Check for saved user session on app load
  useEffect(() => {
    const savedUser = localStorage.getItem('notesAppUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setCurrentView('notes');
    }
  }, []);

  // Smooth transition function
  const transitionToView = (newView, delay = 600) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentView(newView);
      setIsTransitioning(false);
    }, delay);
  };

  // Handle successful login
  const handleLogin = (loginData) => {
    const userData = {
      email: loginData.email,
      name: loginData.email.split('@')[0], // Extract name from email
      loginMethod: 'email'
    };
    
    setUser(userData);
    localStorage.setItem('notesAppUser', JSON.stringify(userData));
    transitionToView('notes');
  };

  // Handle successful signup
  const handleSignup = (signupData) => {
    const userData = {
      email: signupData.email,
      name: signupData.name,
      loginMethod: 'email'
    };
    
    setUser(userData);
    localStorage.setItem('notesAppUser', JSON.stringify(userData));
    transitionToView('notes');
  };

  // Handle Google authentication
  const handleGoogleAuth = () => {
    const userData = {
      email: 'user@gmail.com', // This would come from Google API
      name: 'Google User',
      loginMethod: 'google'
    };
    
    setUser(userData);
    localStorage.setItem('notesAppUser', JSON.stringify(userData));
    transitionToView('notes');
  };

  // Handle logout
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('notesAppUser');
    transitionToView('login', 400);
  };

  // Handle switching between login and signup
  const handleSwitchToSignup = () => {
    transitionToView('signup', 300);
  };

  const handleSwitchToLogin = () => {
    transitionToView('login', 300);
  };

  // Render current view
  const renderCurrentView = () => {
    switch (currentView) {
      case 'login':
        return (
          <Login 
            onLogin={handleLogin}
            onSwitchToSignup={handleSwitchToSignup}
            onGoogleLogin={handleGoogleAuth}
          />
        );
      case 'signup':
        return (
          <Signup 
            onSignup={handleSignup}
            onSwitchToLogin={handleSwitchToLogin}
            onGoogleSignup={handleGoogleAuth}
          />
        );
      case 'notes':
        return (
          <NotesApp 
            user={user}
            onLogout={handleLogout}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="app">
      {/* Transition Overlay */}
      {isTransitioning && (
        <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center animate-pulse" style={{ zIndex: 9999 }}>
          <div className="w-12 h-12 rounded-full animate-spin" style={{ border: '3px solid rgba(255, 255, 255, 0.3)', borderTop: '3px solid white' }}></div>
        </div>
      )}
      
      {renderCurrentView()}
    </div>
  );
};

export default App;