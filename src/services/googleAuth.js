import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

class GoogleAuthService {
  
  // Sign in with Google using popup
  async signInWithPopup() {
    try {
      console.log('🚀 Initializing Google sign-in...');
      
      // Add scopes to provider
      googleProvider.addScope('email');
      googleProvider.addScope('profile');
      
      console.log('� Opening Google authentication popup...');
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      console.log('✅ Google authentication successful!');
      console.log('👤 User details:', {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      });
      
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          name: user.displayName
        }
      };
    } catch (error) {
      console.error('❌ Google sign-in error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Handle specific error cases
      if (error.code === 'auth/popup-closed-by-user') {
        return {
          success: false,
          error: 'Sign-in was cancelled. Please try again.'
        };
      } else if (error.code === 'auth/popup-blocked') {
        return {
          success: false,
          error: 'Popup was blocked by your browser. Please allow popups for this site.'
        };
      } else if (error.code === 'auth/operation-not-allowed') {
        return {
          success: false,
          error: 'Google sign-in is not configured properly. Please contact support.'
        };
      }
      
      return {
        success: false,
        error: error.message || 'Google sign-in failed. Please try again.'
      };
    }
  }

  // Sign out
  async signOut() {
    try {
      await auth.signOut();
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new GoogleAuthService();
