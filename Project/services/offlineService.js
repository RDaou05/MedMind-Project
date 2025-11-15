import AsyncStorage from '@react-native-async-storage/async-storage';
import { addMedication, updateMedication } from '../firebase';

const OFFLINE_MEDICATIONS_KEY = 'offline_medications';

export const saveOfflineMedication = async (medicationData, isEdit = false, medicationId = null) => {
  try {
    const offlineData = {
      id: medicationId || Date.now().toString(),
      data: medicationData,
      isEdit,
      timestamp: Date.now()
    };
    
    const existingOffline = await AsyncStorage.getItem(OFFLINE_MEDICATIONS_KEY);
    const offlineMedications = existingOffline ? JSON.parse(existingOffline) : [];
    
    offlineMedications.push(offlineData);
    await AsyncStorage.setItem(OFFLINE_MEDICATIONS_KEY, JSON.stringify(offlineMedications));
    
    return offlineData.id;
  } catch (error) {
    console.error('Error saving offline medication:', error);
    throw error;
  }
};

export const syncOfflineMedications = async (userId) => {
  try {
    const offlineData = await AsyncStorage.getItem(OFFLINE_MEDICATIONS_KEY);
    if (!offlineData) return;
    
    const offlineMedications = JSON.parse(offlineData);
    
    for (const medication of offlineMedications) {
      try {
        if (medication.isEdit) {
          await updateMedication(medication.id, medication.data);
        } else {
          await addMedication(userId, medication.data);
        }
      } catch (error) {
        console.error('Error syncing medication:', error);
      }
    }
    
    // Clear offline data after successful sync
    await AsyncStorage.removeItem(OFFLINE_MEDICATIONS_KEY);
    console.log('Offline medications synced successfully');
  } catch (error) {
    console.error('Error syncing offline medications:', error);
  }
};