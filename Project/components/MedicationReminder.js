import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MedicationReminder({ 
  visible, 
  medication, 
  onTaken, 
  onSnooze, 
  onSkip, 
  onClose 
}) {
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [showSnoozeModal, setShowSnoozeModal] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [actualTime, setActualTime] = useState(new Date().toTimeString().slice(0, 5));
  const [doseAmount, setDoseAmount] = useState(medication?.dosage || '');
  const [skipReason, setSkipReason] = useState('');

  const snoozeOptions = [
    { label: '5 minutes', value: 5 },
    { label: '10 minutes', value: 10 },
    { label: '30 minutes', value: 30 },
  ];

  const skipReasons = [
    'Already taken',
    'Feeling unwell',
    'Forgot to bring medication',
    'Side effects',
    'Other'
  ];

  const handleTaken = () => {
    setShowIntakeModal(true);
  };

  const confirmIntake = () => {
    onTaken({
      actualTime,
      doseAmount,
      timestamp: new Date().toISOString()
    });
    setShowIntakeModal(false);
    onClose();
  };

  const handleSnooze = (minutes) => {
    onSnooze(minutes);
    setShowSnoozeModal(false);
    onClose();
  };

  const handleSkip = () => {
    onSkip(skipReason);
    setShowSkipModal(false);
    onClose();
  };

  if (!visible || !medication) return null;

  return (
    <>
      {/* Main Reminder Popup */}
      <View style={styles.reminderContainer}>
        <View style={styles.reminderContent}>
          <View style={styles.medicationInfo}>
            <View style={styles.iconContainer}>
              <Ionicons name="medical" size={24} color="#3fa58e" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.medicationName}>{medication.name}</Text>
              <Text style={styles.medicationDose}>{medication.dosage}</Text>
              <Text style={styles.scheduledTime}>
                Scheduled: {medication.scheduledTime}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.takenButton]} 
              onPress={handleTaken}
            >
              <Text style={styles.takenButtonText}>Taken</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.snoozeButton]} 
              onPress={() => setShowSnoozeModal(true)}
            >
              <Text style={styles.snoozeButtonText}>Snooze</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.skipButton]} 
              onPress={() => setShowSkipModal(true)}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Intake Confirmation Modal */}
      <Modal
        visible={showIntakeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowIntakeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Intake</Text>
              <TouchableOpacity onPress={() => setShowIntakeModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Actual Time</Text>
              <TextInput
                style={styles.input}
                value={actualTime}
                onChangeText={setActualTime}
                placeholder="HH:MM"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Dose Amount</Text>
              <TextInput
                style={styles.input}
                value={doseAmount}
                onChangeText={setDoseAmount}
                placeholder="e.g., 1 tablet, 5ml"
              />
            </View>
            
            <TouchableOpacity style={styles.confirmButton} onPress={confirmIntake}>
              <Text style={styles.confirmButtonText}>Confirm Intake</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Snooze Modal */}
      <Modal
        visible={showSnoozeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSnoozeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Snooze Duration</Text>
              <TouchableOpacity onPress={() => setShowSnoozeModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {snoozeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.optionButton}
                onPress={() => handleSnooze(option.value)}
              >
                <Text style={styles.optionText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Skip Modal */}
      <Modal
        visible={showSkipModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSkipModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Skip Reason (Optional)</Text>
              <TouchableOpacity onPress={() => setShowSkipModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {skipReasons.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={styles.optionButton}
                onPress={() => {
                  setSkipReason(reason);
                  handleSkip();
                }}
              >
                <Text style={styles.optionText}>{reason}</Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => handleSkip()}
            >
              <Text style={styles.optionText}>No reason</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  reminderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  reminderContent: {
    padding: 16,
  },
  medicationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f9f7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  medicationDose: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  scheduledTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  takenButton: {
    backgroundColor: '#3fa58e',
  },
  snoozeButton: {
    backgroundColor: '#ffa726',
  },
  skipButton: {
    backgroundColor: '#ef5350',
  },
  takenButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  snoozeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  skipButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: '#3fa58e',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  optionButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
});