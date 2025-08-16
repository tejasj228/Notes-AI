import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCSArN0kdGSkzA9oj1enfLi5xw_hHx8iY4",
  authDomain: "notes-ai-22520.firebaseapp.com",
  projectId: "notes-ai-22520",
  storageBucket: "notes-ai-22520.firebasestorage.app",
  messagingSenderId: "68807698646",
  appId: "1:68807698646:web:bdff893682c443be294177"
};

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  throw error;
}

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Configure auth settings for localhost
auth.useDeviceLanguage();

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Configure Google Provider with minimal settings
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;
