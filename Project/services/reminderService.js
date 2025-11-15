import { getUserMedications, addIntakeLog, takeMedication } from '../firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SNOOZE_COUNT_KEY = 'snooze_counts';
const MAX_SNOOZES = 3;
const GRACE_PERIOD_HOURS = 2;

export const checkForDueReminders = async (userId) => {
  try {
    const medications = await getUserMedications(userId);
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const dueReminders = [];
    
    for (const med of medications) {
      if (!med.times || med.times.length === 0) continue;
      
      const shouldTakeToday = shouldTakeMedicationToday(med, now);
      if (!shouldTakeToday) continue;
      
      for (const time of med.times) {
        const [hour, minute] = time.split(':').map(Number);
        const scheduledTime = hour * 60 + minute;
        const timeDiff = currentTime - scheduledTime;
        
        // Check if medication is due (within grace period)
        if (timeDiff >= 0 && timeDiff <= (GRACE_PERIOD_HOURS * 60)) {
          const alreadyTaken = await checkIfAlreadyTaken(med.id, now, time);
          const snoozeCount = await getSnoozeCount(med.id, time);
          
          if (!alreadyTaken && snoozeCount < MAX_SNOOZES) {
            dueReminders.push({
              ...med,
              scheduledTime: time,
              dueMinutes: timeDiff,
              snoozeCount
            });
          }
        }
      }
    }
    
    // Return the most overdue reminder
    return dueReminders.sort((a, b) => b.dueMinutes - a.dueMinutes)[0] || null;
  } catch (error) {
    console.error('Error checking for due reminders:', error);
    return null;
  }
};

const shouldTakeMedicationToday = (medication, date) => {
  const dayPattern = medication.dayPattern || 'everyday';
  const dayOfWeek = date.getDay();
  
  switch (dayPattern) {
    case 'everyday':
      return true;
    case 'weekdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'weekends':
      return dayOfWeek === 0 || dayOfWeek === 6;
    case 'everyother':
      const startDate = new Date(medication.everyOtherStartDate || date);
      const daysDiff = Math.floor((date - startDate) / (1000 * 60 * 60 * 24));
      return daysDiff % 2 === 0;
    case 'specific':
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const todayName = dayNames[dayOfWeek];
      return medication.selectedDays?.includes(todayName) || false;
    case 'calendar':
      const todayString = date.toISOString().split('T')[0];
      return medication.selectedCalendarDates?.includes(todayString) || false;
    default:
      return true;
  }
};

const checkIfAlreadyTaken = async (medicationId, date, scheduledTime) => {
  // Check AsyncStorage for today's intake records
  try {
    const today = date.toISOString().split('T')[0];
    const key = `intake_${medicationId}_${today}_${scheduledTime}`;
    const taken = await AsyncStorage.getItem(key);
    return taken === 'true';
  } catch (error) {
    console.error('Error checking intake status:', error);
    return false;
  }
};

const getSnoozeCount = async (medicationId, scheduledTime) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const key = `snooze_${medicationId}_${today}_${scheduledTime}`;
    const count = await AsyncStorage.getItem(key);
    return parseInt(count) || 0;
  } catch (error) {
    return 0;
  }
};

const incrementSnoozeCount = async (medicationId, scheduledTime) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const key = `snooze_${medicationId}_${today}_${scheduledTime}`;
    const currentCount = await getSnoozeCount(medicationId, scheduledTime);
    await AsyncStorage.setItem(key, (currentCount + 1).toString());
  } catch (error) {
    console.error('Error incrementing snooze count:', error);
  }
};

export const recordIntake = async (medicationId, intakeData, userId) => {
  try {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    // Mark as taken in AsyncStorage
    const key = `intake_${medicationId}_${todayString}_${intakeData.scheduledTime || ''}`;
    await AsyncStorage.setItem(key, 'true');
    
    // Record in Firebase
    const logData = {
      medicationId,
      date: today,
      status: 'taken',
      actualTime: intakeData.actualTime,
      doseAmount: intakeData.doseAmount,
      notes: intakeData.notes
    };
    
    await addIntakeLog(userId, logData);
    await takeMedication(medicationId, intakeData.doseAmount || 1);
    
    return true;
  } catch (error) {
    console.error('Error recording intake:', error);
    return false;
  }
};

export const recordMissedDose = async (medicationId, reason, userId, scheduledTime) => {
  try {
    const today = new Date();
    
    // Record missed dose in Firebase
    const logData = {
      medicationId,
      date: today,
      status: 'missed',
      reason: reason || 'No reason provided',
      scheduledTime
    };
    
    await addIntakeLog(userId, logData);
    return true;
  } catch (error) {
    console.error('Error recording missed dose:', error);
    return false;
  }
};

export const scheduleSnoozeReminder = async (medication, minutes) => {
  try {
    await incrementSnoozeCount(medication.id, medication.scheduledTime);
    
    // In a real app, this would schedule a local notification
    console.log(`Scheduling snooze reminder for ${medication.name} in ${minutes} minutes`);
    
    return setTimeout(() => {
      console.log(`Snooze reminder triggered for ${medication.name}`);
    }, minutes * 60 * 1000);
  } catch (error) {
    console.error('Error scheduling snooze:', error);
  }
};

export const markAsMissedAfterGracePeriod = async (medicationId, userId, scheduledTime) => {
  try {
    const alreadyTaken = await checkIfAlreadyTaken(medicationId, new Date(), scheduledTime);
    if (!alreadyTaken) {
      await recordMissedDose(medicationId, 'Grace period expired', userId, scheduledTime);
    }
  } catch (error) {
    console.error('Error marking as missed:', error);
  }
};