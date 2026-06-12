import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDHlYnYy-HvJMUMXzeku_fg5okYChzxxL8',
  authDomain: 'netflix-clone-48237.firebaseapp.com',
  projectId: 'netflix-clone-48237',
  storageBucket: 'netflix-clone-48237.firebasestorage.app',
  messagingSenderId: '624040102850',
  appId: '1:624040102850:web:bc29a13cfe0dd6d3dee45b',
  measurementId: 'G-R7TE0G6KXK',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export default app;
