import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/auth/AuthProvider';
import AuthPage from './components/auth/AuthPage';
import NotesApp from './NotesApp';
import './index.css';

// Main App Component
const AppContent = () => {
  const { user, loading, login, logout, isAuthenticated } = useAuth();
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleAuthSuccess = (userData, authToken) => {
    console.log('🎉 Auth success - User:', userData);
    console.log('🔑 Auth success - Token:', authToken ? 'Present' : 'Missing');
    
    setIsTransitioning(true);
    
    // Use the provided token or get from localStorage as fallback
    const token = authToken || localStorage.getItem('authToken');
    
    if (!token) {
      console.error('❌ No auth token found!');
      return;
    }
    
    login(userData, token);
    setTimeout(() => {
      setIsTransitioning(false);
    }, 600);
  };

  const handleLogout = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      logout();
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
        {isAuthenticated ? (
          <>
            <Route path="/" element={<Navigate to="/notes" replace />} />
            <Route path="/notes" element={<NotesApp user={user} onLogout={handleLogout} />} />
            <Route path="/trash" element={<NotesApp user={user} onLogout={handleLogout} />} />
            <Route path="/folder/:folderId" element={<NotesApp user={user} onLogout={handleLogout} />} />
            <Route path="/ai-chat/:noteId" element={<NotesApp user={user} onLogout={handleLogout} />} />
            <Route path="/auth" element={<Navigate to="/notes" replace />} />
            <Route path="*" element={<Navigate to="/notes" replace />} />
          </>
        ) : (
          <>
            <Route path="/auth" element={<AuthPage onAuthSuccess={handleAuthSuccess} />} />
            <Route path="*" element={<Navigate to="/auth" replace />} />
          </>
        )}
      </Routes>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;