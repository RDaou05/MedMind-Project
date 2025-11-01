import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function OnboardingScreen({ navigation }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState({
    notifications: true,
    timezone: 'America/New_York',
    timeFormat: '12', // '12' or '24'
    units: 'mg', // 'mg' or 'ml'
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '07:00',
    },
  });

  const steps = [
    {
      title: 'Welcome to MedMind',
      subtitle: 'Your personal medication companion',
      content: 'WelcomeStep',
    },
    {
      title: 'Enable Notifications',
      subtitle: 'Never miss a dose with timely reminders',
      content: 'NotificationStep',
    },
    {
      title: 'Set Your Preferences',
      subtitle: 'Customize the app to fit your needs',
      content: 'PreferencesStep',
    },
    {
      title: 'You\'re All Set!',
      subtitle: 'Start managing your medications',
      content: 'CompletionStep',
    },
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      navigation.replace('MainTabs');
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const requestNotificationPermission = async () => {
    // In a real app, you would request notification permissions here
    Alert.alert('Notifications Enabled', 'You will receive medication reminders');
    setPreferences(prev => ({ ...prev, notifications: true }));
  };

  const WelcomeStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={['#3fa58e', '#2d7a6b']}
          style={styles.iconGradient}
        >
          <Ionicons name="medical" size={60} color="#fff" />
        </LinearGradient>
      </View>
      
      <Text style={styles.welcomeText}>
        MedMind helps you stay on track with your medications, 
        track adherence, and maintain your health routine.
      </Text>
      
      <View style={styles.featureList}>
        <View style={styles.featureItem}>
          <Ionicons name="notifications" size={24} color="#3fa58e" />
          <Text style={styles.featureText}>Smart Reminders</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="calendar" size={24} color="#3fa58e" />
          <Text style={styles.featureText}>Adherence Tracking</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="people" size={24} color="#3fa58e" />
          <Text style={styles.featureText}>Care Team Sharing</Text>
        </View>
      </View>
    </View>
  );

  const NotificationStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.iconContainer}>
        <View style={styles.notificationIcon}>
          <Ionicons name="notifications" size={60} color="#3fa58e" />
        </View>
      </View>
      
      <Text style={styles.stepDescription}>
        Enable notifications to receive timely reminders for your medications. 
        You can customize notification settings later.
      </Text>
      
      <TouchableOpacity
        style={styles.permissionButton}
        onPress={requestNotificationPermission}
      >
        <Ionicons name="notifications" size={20} color="#fff" />
        <Text style={styles.permissionButtonText}>Enable Notifications</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => setPreferences(prev => ({ ...prev, notifications: false }))}
      >
        <Text style={styles.skipButtonText}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );

  const PreferencesStep = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepDescription}>
        Customize these settings to personalize your experience.
      </Text>
      
      <View style={styles.preferenceSection}>
        <Text style={styles.preferenceSectionTitle}>Time Format</Text>
        <View style={styles.preferenceRow}>
          <TouchableOpacity
            style={[
              styles.preferenceOption,
              preferences.timeFormat === '12' && styles.selectedOption
            ]}
            onPress={() => setPreferences(prev => ({ ...prev, timeFormat: '12' }))}
          >
            <Text style={[
              styles.preferenceOptionText,
              preferences.timeFormat === '12' && styles.selectedOptionText
            ]}>
              12-hour (2:30 PM)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.preferenceOption,
              preferences.timeFormat === '24' && styles.selectedOption
            ]}
            onPress={() => setPreferences(prev => ({ ...prev, timeFormat: '24' }))}
          >
            <Text style={[
              styles.preferenceOptionText,
              preferences.timeFormat === '24' && styles.selectedOptionText
            ]}>
              24-hour (14:30)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.preferenceSection}>
        <Text style={styles.preferenceSectionTitle}>Default Units</Text>
        <View style={styles.preferenceRow}>
          <TouchableOpacity
            style={[
              styles.preferenceOption,
              preferences.units === 'mg' && styles.selectedOption
            ]}
            onPress={() => setPreferences(prev => ({ ...prev, units: 'mg' }))}
          >
            <Text style={[
              styles.preferenceOptionText,
              preferences.units === 'mg' && styles.selectedOptionText
            ]}>
              Milligrams (mg)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.preferenceOption,
              preferences.units === 'ml' && styles.selectedOption
            ]}
            onPress={() => setPreferences(prev => ({ ...prev, units: 'ml' }))}
          >
            <Text style={[
              styles.preferenceOptionText,
              preferences.units === 'ml' && styles.selectedOptionText
            ]}>
              Milliliters (ml)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.preferenceSection}>
        <View style={styles.switchRow}>
          <View style={styles.switchLeft}>
            <Text style={styles.switchTitle}>Quiet Hours</Text>
            <Text style={styles.switchSubtitle}>Disable notifications during sleep</Text>
          </View>
          <Switch
            value={preferences.quietHours.enabled}
            onValueChange={(value) =>
              setPreferences(prev => ({
                ...prev,
                quietHours: { ...prev.quietHours, enabled: value }
              }))
            }
            trackColor={{ false: '#e0e0e0', true: '#3fa58e' }}
            thumbColor="#fff"
          />
        </View>
      </View>
    </ScrollView>
  );

  const CompletionStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.iconContainer}>
        <View style={styles.completionIcon}>
          <Ionicons name="checkmark-circle" size={80} color="#3fa58e" />
        </View>
      </View>
      
      <Text style={styles.completionText}>
        Great! You're all set up and ready to start managing your medications with MedMind.
      </Text>
      
      <View style={styles.nextSteps}>
        <Text style={styles.nextStepsTitle}>Next steps:</Text>
        <View style={styles.nextStepItem}>
          <Ionicons name="add-circle" size={20} color="#3fa58e" />
          <Text style={styles.nextStepText}>Add your first medication</Text>
        </View>
        <View style={styles.nextStepItem}>
          <Ionicons name="time" size={20} color="#3fa58e" />
          <Text style={styles.nextStepText}>Set up reminder schedules</Text>
        </View>
        <View style={styles.nextStepItem}>
          <Ionicons name="calendar" size={20} color="#3fa58e" />
          <Text style={styles.nextStepText}>Track your adherence</Text>
        </View>
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (steps[currentStep].content) {
      case 'WelcomeStep':
        return <WelcomeStep />;
      case 'NotificationStep':
        return <NotificationStep />;
      case 'PreferencesStep':
        return <PreferencesStep />;
      case 'CompletionStep':
        return <CompletionStep />;
      default:
        return <WelcomeStep />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {steps.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index <= currentStep && styles.activeDot
            ]}
          />
        ))}
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.stepTitle}>{steps[currentStep].title}</Text>
        <Text style={styles.stepSubtitle}>{steps[currentStep].subtitle}</Text>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {renderStepContent()}
      </View>

      {/* Navigation */}
      <View style={styles.navigation}>
        {currentStep > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={prevStep}>
            <Ionicons name="arrow-back" size={20} color="#666" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
          <Text style={styles.nextButtonText}>
            {currentStep === steps.length - 1 ? 'Get Started' : 'Continue'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 20,
    paddingBottom: 10,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  activeDot: {
    backgroundColor: '#3fa58e',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 40,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f9f7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionIcon: {
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  featureList: {
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
    fontWeight: '500',
  },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3fa58e',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 24,
    marginBottom: 16,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  skipButton: {
    paddingVertical: 12,
  },
  skipButtonText: {
    color: '#666',
    fontSize: 16,
  },
  preferenceSection: {
    marginBottom: 32,
  },
  preferenceSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  preferenceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  preferenceOption: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  selectedOption: {
    borderColor: '#3fa58e',
    backgroundColor: '#f0f9f7',
  },
  preferenceOptionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#3fa58e',
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  switchLeft: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  switchSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  completionText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
  },
  nextSteps: {
    width: '100%',
  },
  nextStepsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  nextStepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  nextStepText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
    marginLeft: 8,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3fa58e',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 24,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});