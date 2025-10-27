import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AddMedicationScreen({ navigation }) {
  const [medicationName, setMedicationName] = useState('');
  const [dosage, setDosage] = useState('');
  const [selectedForm, setSelectedForm] = useState('pill');
  const [selectedSchedule, setSelectedSchedule] = useState('fixed');
  const [times, setTimes] = useState(['08:00']);
  const [inventory, setInventory] = useState('');
  const [refillThreshold, setRefillThreshold] = useState('7');
  const [notes, setNotes] = useState('');
  
  const [showFormPicker, setShowFormPicker] = useState(false);
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const dosageForms = [
    { id: 'pill', name: 'Pill/Tablet', icon: 'medical' },
    { id: 'capsule', name: 'Capsule', icon: 'fitness' },
    { id: 'liquid', name: 'Liquid', icon: 'water' },
    { id: 'injection', name: 'Injection', icon: 'medical-outline' },
    { id: 'cream', name: 'Cream/Ointment', icon: 'color-palette' },
    { id: 'inhaler', name: 'Inhaler', icon: 'cloud' },
  ];

  const scheduleTypes = [
    { id: 'fixed', name: 'Fixed Times', description: 'Specific times daily' },
    { id: 'interval', name: 'Interval', description: 'Every X hours' },
    { id: 'prn', name: 'As Needed (PRN)', description: 'When required' },
    { id: 'meals', name: 'With Meals', description: 'Before/after meals' },
    { id: 'bedtime', name: 'At Bedtime', description: 'Before sleep' },
  ];

  const addTime = () => {
    setTimes([...times, '12:00']);
  };

  const removeTime = (index) => {
    if (times.length > 1) {
      setTimes(times.filter((_, i) => i !== index));
    }
  };

  const updateTime = (index, newTime) => {
    const updatedTimes = [...times];
    updatedTimes[index] = newTime;
    setTimes(updatedTimes);
  };

  const saveMedication = () => {
    if (!medicationName.trim()) {
      Alert.alert('Error', 'Please enter a medication name');
      return;
    }
    if (!dosage.trim()) {
      Alert.alert('Error', 'Please enter the dosage');
      return;
    }
    if (!inventory.trim()) {
      Alert.alert('Error', 'Please enter the initial inventory');
      return;
    }

    // Here you would save to Firebase/database
    Alert.alert(
      'Success',
      'Medication added successfully!',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  const getFormIcon = (formId) => {
    const form = dosageForms.find(f => f.id === formId);
    return form ? form.icon : 'medical';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Medication</Text>
        <TouchableOpacity style={styles.saveButton} onPress={saveMedication}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Medication Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter medication name"
              value={medicationName}
              onChangeText={setMedicationName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Dosage *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 500mg, 10ml, 1 tablet"
              value={dosage}
              onChangeText={setDosage}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Dosage Form</Text>
            <TouchableOpacity
              style={styles.picker}
              onPress={() => setShowFormPicker(true)}
            >
              <View style={styles.pickerContent}>
                <Ionicons name={getFormIcon(selectedForm)} size={20} color="#3fa58e" />
                <Text style={styles.pickerText}>
                  {dosageForms.find(f => f.id === selectedForm)?.name}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Schedule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Schedule Type</Text>
            <TouchableOpacity
              style={styles.picker}
              onPress={() => setShowSchedulePicker(true)}
            >
              <View style={styles.pickerContent}>
                <Text style={styles.pickerText}>
                  {scheduleTypes.find(s => s.id === selectedSchedule)?.name}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {selectedSchedule === 'fixed' && (
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Times</Text>
                <TouchableOpacity style={styles.addTimeButton} onPress={addTime}>
                  <Ionicons name="add" size={16} color="#3fa58e" />
                  <Text style={styles.addTimeText}>Add Time</Text>
                </TouchableOpacity>
              </View>
              
              {times.map((time, index) => (
                <View key={index} style={styles.timeRow}>
                  <TextInput
                    style={[styles.input, styles.timeInput]}
                    placeholder="HH:MM"
                    value={time}
                    onChangeText={(newTime) => updateTime(index, newTime)}
                  />
                  {times.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeTimeButton}
                      onPress={() => removeTime(index)}
                    >
                      <Ionicons name="close" size={20} color="#FF6B6B" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Inventory */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inventory Management</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Initial Quantity *</Text>
            <TextInput
              style={styles.input}
              placeholder="Number of pills/doses"
              value={inventory}
              onChangeText={setInventory}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Refill Reminder Threshold</Text>
            <TextInput
              style={styles.input}
              placeholder="Remind when X pills remain"
              value={refillThreshold}
              onChangeText={setRefillThreshold}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Special instructions, side effects to watch for, etc."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>

      {/* Dosage Form Picker Modal */}
      <Modal
        visible={showFormPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFormPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Dosage Form</Text>
              <TouchableOpacity onPress={() => setShowFormPicker(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {dosageForms.map((form) => (
              <TouchableOpacity
                key={form.id}
                style={[
                  styles.modalOption,
                  selectedForm === form.id && styles.selectedOption
                ]}
                onPress={() => {
                  setSelectedForm(form.id);
                  setShowFormPicker(false);
                }}
              >
                <Ionicons name={form.icon} size={24} color="#3fa58e" />
                <Text style={styles.modalOptionText}>{form.name}</Text>
                {selectedForm === form.id && (
                  <Ionicons name="checkmark" size={20} color="#3fa58e" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Schedule Type Picker Modal */}
      <Modal
        visible={showSchedulePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSchedulePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Schedule Type</Text>
              <TouchableOpacity onPress={() => setShowSchedulePicker(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {scheduleTypes.map((schedule) => (
              <TouchableOpacity
                key={schedule.id}
                style={[
                  styles.modalOption,
                  selectedSchedule === schedule.id && styles.selectedOption
                ]}
                onPress={() => {
                  setSelectedSchedule(schedule.id);
                  setShowSchedulePicker(false);
                }}
              >
                <View style={styles.scheduleOptionContent}>
                  <Text style={styles.modalOptionText}>{schedule.name}</Text>
                  <Text style={styles.scheduleDescription}>{schedule.description}</Text>
                </View>
                {selectedSchedule === schedule.id && (
                  <Ionicons name="checkmark" size={20} color="#3fa58e" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#3fa58e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  picker: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  addTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9f7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addTimeText: {
    color: '#3fa58e',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeInput: {
    flex: 1,
    marginRight: 12,
  },
  removeTimeButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedOption: {
    backgroundColor: '#f0f9f7',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  scheduleOptionContent: {
    flex: 1,
    marginLeft: 12,
  },
  scheduleDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});