import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Remplacer par les vraies valeurs depuis la console Firebase
const firebaseConfig = {
  apiKey: 'AIzaSyCN51wTRB0FEf7OH-C9TUwOW8aUsUizcUc',
  authDomain: 'repview-7c5c1.firebaseapp.com',
  projectId: 'repview-7c5c1',
  storageBucket: 'repview-7c5c1.firebasestorage.app',
  messagingSenderId: '375937108465',
  appId: '1:375937108465:web:1ecb7c8a8667042e5f9c50',
};

const isFirstInit = getApps().length === 0;
const app = isFirstInit ? initializeApp(firebaseConfig) : getApp();

// Premier démarrage : initializeAuth avec persistance AsyncStorage
// Hot reload : getAuth retourne l'instance déjà créée
export const auth = isFirstInit
  ? initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
  : getAuth(app);

export const db = getFirestore(app);

import { getFunctions } from 'firebase/functions';
export const functions = getFunctions(app);
