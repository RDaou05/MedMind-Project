import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs,
  orderBy,
  onSnapshot 
} from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDE08nQi6cYw3ilJElvUfZZlB8mTtICrcg",
  authDomain: "medmind-df71c.firebaseapp.com",
  projectId: "medmind-df71c",
  storageBucket: "medmind-df71c.firebasestorage.app",
  messagingSenderId: "289781003763",
  appId: "1:289781003763:web:9335c65697f797e9178e86",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);

// User functions
export const createUserProfile = async (uid, userData) => {
  await setDoc(doc(db, 'users', uid), {
    ...userData,
    createdAt: new Date(),
    updatedAt: new Date()
  });
};

export const getUserProfile = async (uid) => {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
};

export const updateUserProfile = async (uid, userData) => {
  await updateDoc(doc(db, 'users', uid), {
    ...userData,
    updatedAt: new Date()
  });
};

// Medication functions
export const addMedication = async (uid, medicationData) => {
  const docRef = await addDoc(collection(db, 'medications'), {
    ...medicationData,
    userId: uid,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return docRef.id;
};

export const getUserMedications = async (uid) => {
  const q = query(
    collection(db, 'medications'), 
    where('userId', '==', uid)
  );
  const querySnapshot = await getDocs(q);
  const medications = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  // Sort on client side to avoid index requirement
  return medications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

// Real-time snapshot listener for medications
export const subscribeToUserMedications = (uid, callback) => {
  const q = query(
    collection(db, 'medications'), 
    where('userId', '==', uid)
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const medications = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const sortedMedications = medications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    callback(sortedMedications);
  });
};

export const updateMedication = async (medicationId, medicationData) => {
  await updateDoc(doc(db, 'medications', medicationId), {
    ...medicationData,
    updatedAt: new Date()
  });
};

export const deleteMedication = async (medicationId) => {
  await deleteDoc(doc(db, 'medications', medicationId));
};

// Intake log functions
export const addIntakeLog = async (uid, intakeData) => {
  const docRef = await addDoc(collection(db, 'intakeLogs'), {
    ...intakeData,
    userId: uid,
    createdAt: new Date()
  });
  return docRef.id;
};

export const getUserIntakeLogs = async (uid, startDate, endDate) => {
  const q = query(
    collection(db, 'intakeLogs'),
    where('userId', '==', uid)
  );
  const querySnapshot = await getDocs(q);
  const logs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  // Filter and sort on client side
  return logs
    .filter(log => log.date >= startDate && log.date <= endDate)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
};

// Real-time snapshot listener for intake logs
export const subscribeToUserIntakeLogs = (uid, callback) => {
  const q = query(
    collection(db, 'intakeLogs'),
    where('userId', '==', uid)
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const logs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const sortedLogs = logs.sort((a, b) => new Date(b.date) - new Date(a.date));
    callback(sortedLogs);
  });
};

export const takeMedication = async (medicationId, servingSize = 1) => {
  try {
    const medicationRef = doc(db, 'medications', medicationId);
    const medicationDoc = await getDoc(medicationRef);
    
    if (medicationDoc.exists()) {
      const currentData = medicationDoc.data();
      const newServings = Math.max(0, (currentData.currentServings || 0) - servingSize);
      
      await updateDoc(medicationRef, {
        currentServings: newServings,
        updatedAt: new Date()
      });
      
      return newServings;
    }
  } catch (error) {
    console.error('Error updating medication servings:', error);
    throw error;
  }
};

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
};