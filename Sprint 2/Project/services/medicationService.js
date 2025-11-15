import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';

export const addMedication = async (userId, medication) => {
  return await addDoc(collection(db, 'users', userId, 'medications'), medication);
};

export const getMedications = async (userId) => {
  const q = query(collection(db, 'users', userId, 'medications'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateMedication = async (userId, medicationId, updates) => {
  const docRef = doc(db, 'users', userId, 'medications', medicationId);
  return await updateDoc(docRef, updates);
};

export const deleteMedication = async (userId, medicationId) => {
  const docRef = doc(db, 'users', userId, 'medications', medicationId);
  return await deleteDoc(docRef);
};