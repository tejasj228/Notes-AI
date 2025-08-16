// Simple test to check if Firebase is working
import { auth } from '../config/firebase';

export const testFirebase = () => {
  console.log('🔍 Testing Firebase Auth...');
  console.log('Auth instance:', auth);
  console.log('Auth app:', auth.app);
  console.log('Auth config:', auth.config);
  
  return auth !== null && auth !== undefined;
};

export default testFirebase;
