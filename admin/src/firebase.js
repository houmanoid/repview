import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: 'AIzaSyCN51wTRB0FEf7OH-C9TUwOW8aUsUizcUc',
  authDomain: 'repview-7c5c1.firebaseapp.com',
  projectId: 'repview-7c5c1',
  storageBucket: 'repview-7c5c1.firebasestorage.app',
  messagingSenderId: '375937108465',
  appId: '1:375937108465:web:1ecb7c8a8667042e5f9c50',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
