import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import NotesApp from './NotesApp';
import './index.css';

// Component to handle auth page routing
const AuthPage = ({ user, onLogin, onSignup, onGoogleAuth }) => {
  const navigate = useNavigate();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Smooth transition function
  const transitionToView = (newPath, delay = 600) => {
    setIsTransitioning(true);
    setTimeout(() => {
      navigate(newPath);
      setCurrentPath(newPath);
      setIsTransitioning(false);
    }, delay);
  };

  // Auth handlers with navigation
  const handleLogin = (loginData) => {
    const userData = {
      email: loginData.email,
      name: loginData.email.split('@')[0],
      loginMethod: 'email'
    };
    
    onLogin(userData);
    transitionToView('/notes');
  };

  const handleSignup = (signupData) => {
    const userData = {
      email: signupData.email,
      name: signupData.name,
      loginMethod: 'email'
    };
    
    onSignup(userData);
    transitionToView('/notes');
  };

  const handleGoogleAuth = () => {
    const userData = {
      email: 'user@gmail.com',
      name: 'Google User',
      loginMethod: 'google'
    };
    
    onGoogleAuth(userData);
    transitionToView('/notes');
  };

  const handleSwitchToSignup = () => {
    transitionToView('/signup', 300);
  };

  const handleSwitchToLogin = () => {
    transitionToView('/login', 300);
  };

  // If user is authenticated, redirect to notes
  if (user) {
    return <Navigate to="/notes" replace />;
  }

  return (
    <div className="app">
      {/* Transition Overlay */}
      {isTransitioning && (
        <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center animate-pulse" style={{ zIndex: 9999 }}>
          <div className="w-12 h-12 rounded-full animate-spin" style={{ border: '3px solid rgba(255, 255, 255, 0.3)', borderTop: '3px solid white' }}></div>
        </div>
      )}
      
      <Routes>
        <Route path="/login" element={
          <Login 
            onLogin={handleLogin}
            onSwitchToSignup={handleSwitchToSignup}
            onGoogleLogin={handleGoogleAuth}
          />
        } />
        <Route path="/signup" element={
          <Signup 
            onSignup={handleSignup}
            onSwitchToLogin={handleSwitchToLogin}
            onGoogleSignup={handleGoogleAuth}
          />
        } />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
};

// Component to handle app routing (when authenticated)
const AppRouter = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleLogout = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      onLogout();
      navigate('/login');
      setIsTransitioning(false);
    }, 400);
  };

  return (
    <div className="app">
      {/* Transition Overlay */}
      {isTransitioning && (
        <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center animate-pulse" style={{ zIndex: 9999 }}>
          <div className="w-12 h-12 rounded-full animate-spin" style={{ border: '3px solid rgba(255, 255, 255, 0.3)', borderTop: '3px solid white' }}></div>
        </div>
      )}
      
      <Routes>
        <Route path="/" element={<Navigate to="/notes" replace />} />
        <Route path="/notes" element={<NotesApp user={user} onLogout={handleLogout} />} />
        <Route path="/trash" element={<NotesApp user={user} onLogout={handleLogout} />} />
        <Route path="/folder/:folderId" element={<NotesApp user={user} onLogout={handleLogout} />} />
        <Route path="/ai-chat/:noteId" element={<NotesApp user={user} onLogout={handleLogout} />} />
        <Route path="*" element={<Navigate to="/notes" replace />} />
      </Routes>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState(null);

  // Check for saved user session on app load
  useEffect(() => {
    const savedUser = localStorage.getItem('notesAppUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Handle successful login
  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('notesAppUser', JSON.stringify(userData));
  };

  // Handle successful signup
  const handleSignup = (userData) => {
    setUser(userData);
    localStorage.setItem('notesAppUser', JSON.stringify(userData));
  };

  // Handle Google authentication
  const handleGoogleAuth = (userData) => {
    setUser(userData);
    localStorage.setItem('notesAppUser', JSON.stringify(userData));
  };

  // Handle logout
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('notesAppUser');
  };

  return (
    <Router>
      {user ? (
        <AppRouter user={user} onLogout={handleLogout} />
      ) : (
        <AuthPage 
          user={user}
          onLogin={handleLogin}
          onSignup={handleSignup}
          onGoogleAuth={handleGoogleAuth}
        />
      )}
    </Router>
  );
};

export default App;