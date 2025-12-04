import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import MedicationNotificationBanner from './components/MedicationNotificationBanner';
import { checkForDueReminders, recordIntake, recordMissedDose, scheduleSnoozeReminder } from './services/reminderService';

// Screens
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import MedicationsScreen from './screens/MedicationsScreen';
import AddMedicationScreen from './screens/AddMedicationScreen';
import CalendarScreen from './screens/CalendarScreen';
import ProfileScreen from './screens/ProfileScreen';
import OnboardingScreen from './screens/OnboardingScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const { colors } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Medications') {
            iconName = focused ? 'medical' : 'medical-outline';
          } else if (route.name === 'Calendar') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: 5,
          height: 60,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Medications" component={MedicationsScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [pendingReminder, setPendingReminder] = useState(null);
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        checkForPendingReminders(user.uid);
      }
    });
    return unsubscribe;
  }, []);

  const checkForPendingReminders = async (userId) => {
    try {
      const dueReminder = await checkForDueReminders(userId);
      if (dueReminder) {
        setPendingReminder(dueReminder);
        setShowReminder(true);
      }
    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  };

  const handleTaken = async (intakeData) => {
    if (pendingReminder && user) {
      const success = await recordIntake(pendingReminder.id, {
        ...intakeData,
        scheduledTime: pendingReminder.scheduledTime
      }, user.uid);
      if (success) {
        setShowReminder(false);
        setPendingReminder(null);
      }
    }
  };

  const handleSnooze = async (minutes) => {
    if (pendingReminder) {
      await scheduleSnoozeReminder(pendingReminder, minutes);
      setShowReminder(false);
      
      // Show reminder again after snooze period
      setTimeout(() => {
        checkForPendingReminders(user.uid);
      }, minutes * 60 * 1000);
    }
  };

  const handleSkip = async (reason) => {
    if (pendingReminder && user) {
      await recordMissedDose(pendingReminder.id, reason, user.uid, pendingReminder.scheduledTime);
      setShowReminder(false);
      setPendingReminder(null);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!user ? (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
            </>
          ) : (
            <>
              {isFirstTime && (
                <Stack.Screen name="Onboarding" component={OnboardingScreen} />
              )}
              <Stack.Screen name="MainTabs" component={MainTabs} />
              <Stack.Screen name="AddMedication" component={AddMedicationScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      
      {showReminder && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000 }}>
          <MedicationNotificationBanner
        visible={showReminder}
        medication={pendingReminder}
        onTaken={handleTaken}
        onSnooze={handleSnooze}
        onSkip={handleSkip}
            onDismiss={() => setShowReminder(false)}
          />
        </View>
      )}
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}