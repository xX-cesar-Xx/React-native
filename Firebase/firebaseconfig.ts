// firebaseconfig.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuración de Firebase
export const firebaseConfig = {
  apiKey: "AIzaSyDW-XaT4aXVKc9Ls78I8NrFo_kV42oN70w",
  authDomain: "react-native-12805.firebaseapp.com",
  projectId: "react-native-12805",
  storageBucket: "react-native-12805.appspot.com",
  messagingSenderId: "938122784685",
  appId: "1:938122784685:web:fdc210a51ed2f4303ebb24",
  measurementId: "G-Y1NGM3YNCL"
};

// Inicialización de Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Exportaciones
export { app, auth, db };