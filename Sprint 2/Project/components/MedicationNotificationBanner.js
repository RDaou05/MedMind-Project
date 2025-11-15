import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MedicationNotificationBanner({
  visible,
  medication,
  onTaken,
  onSnooze,
  onSkip,
  onDismiss
}) {
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [showSnoozeModal, setShowSnoozeModal] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [actualTime, setActualTime] = useState('');
  const [doseAmount, setDoseAmount] = useState('');
  const [skipReason, setSkipReason] = useState('');

  if (!visible || !medication) return null;

  const handleTaken = () => {
    const now = new Date();
    setActualTime(now.toTimeString().slice(0, 5));
    setDoseAmount(medication.servingSize?.toString() || '1');
    setShowIntakeModal(true);
  };

  const confirmIntake = () => {
    onTaken({
      actualTime,
      doseAmount: parseFloat(doseAmount),
      notes: null
    });
    setShowIntakeModal(false);
  };

  const handleSnooze = (minutes) => {
    onSnooze(minutes);
    setShowSnoozeModal(false);
  };

  const handleSkip = () => {
    onSkip(skipReason);
    setShowSkipModal(false);
  };

  const skipReasons = [
    'Forgot to take',
    'Side effects',
    'Ran out of medication',
    'Feeling better',
    'Other'
  ];

  return (
    <>
      <View style={styles.banner}>
        <View style={styles.content}>
          <View style={styles.medicationInfo}>
            <Ionicons name="medical" size={20} color="#3fa58e" />
            <View style={styles.textContainer}>
              <Text style={styles.medicationName}>{medication.name}</Text>
              <Text style={styles.medicationDetails}>
                {medication.servingSize || 1} {medication.servingUnits || 'tablet'} • {medication.scheduledTime}
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleTaken}>
              <Text style={styles.actionText}>Taken</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.snoozeButton]}
              onPress={() => setShowSnoozeModal(true)}
            >
              <Text style={styles.actionText}>Snooze</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.skipButton]}
              onPress={() => setShowSkipModal(true)}
            >
              <Text style={styles.actionText}>Skip</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <Ionicons name="close" size={16} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Intake Confirmation Modal */}
      <Modal visible={showIntakeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Intake</Text>

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
                placeholder="Amount taken"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowIntakeModal(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmIntake}
              >
                <Text style={styles.confirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Snooze Modal */}
      <Modal visible={showSnoozeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Snooze Reminder</Text>

            <View style={styles.snoozeOptions}>
              <TouchableOpacity
                style={styles.snoozeOption}
                onPress={() => handleSnooze(10/60)}
              >
                <Text style={styles.snoozeText}>10 seconds</Text>
              </TouchableOpacity>
              {[5, 10, 30].map(minutes => (
                <TouchableOpacity
                  key={minutes}
                  style={styles.snoozeOption}
                  onPress={() => handleSnooze(minutes)}
                >
                  <Text style={styles.snoozeText}>{minutes} minutes</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowSnoozeModal(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Skip Modal */}
      <Modal visible={showSkipModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Skip Medication</Text>

            <Text style={styles.label}>Reason (Optional)</Text>
            <View style={styles.reasonOptions}>
              {skipReasons.map(reason => (
                <TouchableOpacity
                  key={reason}
                  style={[
                    styles.reasonOption,
                    skipReason === reason && styles.selectedReason
                  ]}
                  onPress={() => setSkipReason(reason)}
                >
                  <Text style={[
                    styles.reasonText,
                    skipReason === reason && styles.selectedReasonText
                  ]}>
                    {reason}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowSkipModal(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.skipConfirmButton]}
                onPress={handleSkip}
              >
                <Text style={styles.skipConfirmText}>Skip</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginTop: 70,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 17,
  },
  medicationInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  medicationDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#3fa58e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  snoozeButton: {
    backgroundColor: '#f39c12',
  },
  skipButton: {
    backgroundColor: '#e74c3c',
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  dismissButton: {
    marginLeft: 12,
    padding: 4,
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
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
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
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  confirmButton: {
    backgroundColor: '#3fa58e',
  },
  skipConfirmButton: {
    backgroundColor: '#e74c3c',
  },
  cancelText: {
    color: '#666',
    fontWeight: '600',
  },
  confirmText: {
    color: '#fff',
    fontWeight: '600',
  },
  skipConfirmText: {
    color: '#fff',
    fontWeight: '600',
  },
  snoozeOptions: {
    marginBottom: 20,
  },
  snoozeOption: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  snoozeText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  reasonOptions: {
    marginBottom: 20,
  },
  reasonOption: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedReason: {
    backgroundColor: '#3fa58e',
  },
  reasonText: {
    fontSize: 14,
    color: '#333',
  },
  selectedReasonText: {
    color: '#fff',
  },
});