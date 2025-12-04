import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const requestNotificationPermissions = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
};

export const scheduleMedicationReminder = async (medication) => {
  try {
    // Cancel existing notifications for this medication
    await cancelMedicationReminders(medication.id);
    
    // Schedule notifications for each time
    const notificationIds = [];
    
    for (const time of medication.times) {
      const [hours, minutes] = time.split(':');
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Medication Reminder',
          body: `Time to take ${medication.name} (${medication.dosage})`,
          data: { medicationId: medication.id },
        },
        trigger: {
          hour: parseInt(hours),
          minute: parseInt(minutes),
          repeats: true,
        },
      });
      
      notificationIds.push(notificationId);
    }
    
    return notificationIds;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return [];
  }
};

export const cancelMedicationReminders = async (medicationId) => {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    for (const notification of scheduledNotifications) {
      if (notification.content.data?.medicationId === medicationId) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  } catch (error) {
    console.error('Error canceling notifications:', error);
  }
};

export const scheduleAllMedicationReminders = async (medications) => {
  try {
    // Cancel all existing medication notifications
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    // Schedule new notifications for all medications
    for (const medication of medications) {
      await scheduleMedicationReminder(medication);
    }
  } catch (error) {
    console.error('Error scheduling all notifications:', error);
  }
};