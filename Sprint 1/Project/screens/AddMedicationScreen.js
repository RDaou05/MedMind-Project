import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Platform,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { auth, addMedication, updateMedication } from '../firebase';
import { searchMedicationsAPI } from '../services/medicationAPI';

export default function AddMedicationScreen({ navigation, route }) {
  const editMedication = route?.params?.editMedication;
  const isEditing = !!editMedication;
  
  const [medicationName, setMedicationName] = useState(editMedication?.name || '');
  const [dosage, setDosage] = useState(editMedication?.dosage || '');
  const [selectedForm, setSelectedForm] = useState(editMedication?.form || 'pill');
  const [selectedSchedule, setSelectedSchedule] = useState(editMedication?.scheduleType || 'fixed');
  const [times, setTimes] = useState(editMedication?.times || ['08:00']);
  const [dayPattern, setDayPattern] = useState(editMedication?.dayPattern || 'everyday');
  const [selectedDays, setSelectedDays] = useState(editMedication?.selectedDays || []);
  const [selectedCalendarDates, setSelectedCalendarDates] = useState(editMedication?.selectedCalendarDates || []);
  const [everyOtherStartDate, setEveryOtherStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [rangeStartDate, setRangeStartDate] = useState(null);
  const [servingSize, setServingSize] = useState(editMedication?.servingSize?.toString() || '1');
  const [servingsPerContainer, setServingsPerContainer] = useState(editMedication?.servingsPerContainer?.toString() || '');
  const [currentServings, setCurrentServings] = useState(editMedication?.currentServings?.toString() || '');
  const [servingThreshold, setServingThreshold] = useState(editMedication?.servingThreshold?.toString() || '7');
  const [notes, setNotes] = useState(editMedication?.notes || '');
  
  const [showFormPicker, setShowFormPicker] = useState(false);
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const [selectedTimeIndex, setSelectedTimeIndex] = useState(0);
  const [medicationSuggestions, setMedicationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

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

  const dayPatterns = [
    { id: 'everyday', name: 'Every Day' },
    { id: 'weekdays', name: 'Weekdays Only' },
    { id: 'weekends', name: 'Weekends Only' },
    { id: 'everyother', name: 'Every Other Day' },
    { id: 'specific', name: 'Specific Days of the Week' },
    { id: 'calendar', name: 'Specific Calendar Days' },
  ];

  const weekDays = [
    { id: 'monday', name: 'Mon', full: 'Monday' },
    { id: 'tuesday', name: 'Tue', full: 'Tuesday' },
    { id: 'wednesday', name: 'Wed', full: 'Wednesday' },
    { id: 'thursday', name: 'Thu', full: 'Thursday' },
    { id: 'friday', name: 'Fri', full: 'Friday' },
    { id: 'saturday', name: 'Sat', full: 'Saturday' },
    { id: 'sunday', name: 'Sun', full: 'Sunday' },
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

  const onTimeChange = (event, selectedTime) => {
    if (event.type === 'dismissed') {
      setShowTimePicker(false);
    } else if (selectedTime) {
      const timeString = selectedTime.toTimeString().slice(0, 5);
      updateTime(selectedTimeIndex, timeString);
    }
  };

  const confirmTime = () => {
    setShowTimePicker(false);
  };

  const openTimePicker = (index) => {
    setSelectedTimeIndex(index);
    setShowTimePicker(true);
  };

  const saveMedication = async () => {
    if (!medicationName.trim()) {
      Alert.alert('Error', 'Please enter a medication name');
      return;
    }
    if (!dosage.trim()) {
      Alert.alert('Error', 'Please enter the dosage');
      return;
    }
    if (!servingsPerContainer.trim()) {
      Alert.alert('Error', 'Please enter servings per container');
      return;
    }
    if (!currentServings.trim()) {
      Alert.alert('Error', 'Please enter the current amount of servings');
      return;
    }

    try {
      const user = auth.currentUser;
      if (user) {
        const medicationData = {
          name: medicationName.trim(),
          dosage: dosage.trim(),
          form: selectedForm,
          scheduleType: selectedSchedule,
          times: times,
          servingSize: parseFloat(servingSize),
          servingsPerContainer: parseInt(servingsPerContainer),
          currentServings: parseInt(currentServings),
          servingThreshold: parseInt(servingThreshold),
          notes: notes.trim(),
          color: '#3fa58e'
        };
        
        if (isEditing) {
          // Update existing medication
          await updateMedication(editMedication.id, medicationData);
        } else {
          await addMedication(user.uid, medicationData);
        }
        Alert.alert(
          'Success',
          `Medication ${isEditing ? 'updated' : 'added'} successfully!`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('Error saving medication:', error);
      Alert.alert('Error', 'Failed to save medication');
    }
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
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Medication' : 'Add Medication'}</Text>
        <TouchableOpacity style={styles.saveButton} onPress={showSummary ? saveMedication : () => setShowSummary(true)}>
          <Text style={styles.saveButtonText}>{showSummary ? 'Confirm' : 'Next'}</Text>
        </TouchableOpacity>
      </View>

      {showSummary ? (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Review Your Medication</Text>
            
            <View style={styles.summarySection}>
              <Text style={styles.summaryLabel}>Medication Name</Text>
              <Text style={styles.summaryValue}>{medicationName}</Text>
            </View>
            
            <View style={styles.summarySection}>
              <Text style={styles.summaryLabel}>Dosage</Text>
              <Text style={styles.summaryValue}>{dosage}</Text>
            </View>
            
            <View style={styles.summarySection}>
              <Text style={styles.summaryLabel}>Form</Text>
              <Text style={styles.summaryValue}>{dosageForms.find(f => f.id === selectedForm)?.name}</Text>
            </View>
            
            <View style={styles.summarySection}>
              <Text style={styles.summaryLabel}>Schedule</Text>
              <Text style={styles.summaryValue}>{scheduleTypes.find(s => s.id === selectedSchedule)?.name}</Text>
            </View>
            
            <View style={styles.summarySection}>
              <Text style={styles.summaryLabel}>Times</Text>
              <Text style={styles.summaryValue}>{times.join(', ')}</Text>
            </View>
            
            <View style={styles.summarySection}>
              <Text style={styles.summaryLabel}>Serving Size</Text>
              <Text style={styles.summaryValue}>{servingSize}</Text>
            </View>
            
            <View style={styles.summarySection}>
              <Text style={styles.summaryLabel}>Servings per Container</Text>
              <Text style={styles.summaryValue}>{servingsPerContainer} servings</Text>
            </View>
            
            <View style={styles.summarySection}>
              <Text style={styles.summaryLabel}>Current Servings</Text>
              <Text style={styles.summaryValue}>{currentServings} servings</Text>
            </View>
            
            <View style={styles.summarySection}>
              <Text style={styles.summaryLabel}>Serving Threshold</Text>
              <Text style={styles.summaryValue}>{servingThreshold} servings</Text>
            </View>
            
            {notes.trim() && (
              <View style={styles.summarySection}>
                <Text style={styles.summaryLabel}>Notes</Text>
                <Text style={styles.summaryValue}>{notes}</Text>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.editButton} 
              onPress={() => setShowSummary(false)}
            >
              <Text style={styles.editButtonText}>Edit Details</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Medication Name *</Text>
            <View style={styles.autocompleteContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter medication name"
                value={medicationName}
                onChangeText={async (text) => {
                  setMedicationName(text);
                  if (text.length > 1) {
                    const suggestions = await searchMedicationsAPI(text);
                    setMedicationSuggestions(suggestions);
                    setShowSuggestions(suggestions.length > 0);
                  } else {
                    setMedicationSuggestions([]);
                    setShowSuggestions(false);
                  }
                }}
                onFocus={async () => {
                  if (medicationName.length > 1) {
                    const suggestions = await searchMedicationsAPI(medicationName);
                    setMedicationSuggestions(suggestions);
                    setShowSuggestions(suggestions.length > 0);
                  }
                }}
                onBlur={() => {
                  // Delay hiding suggestions to allow selection
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
              />
              {showSuggestions && (
                <View style={styles.suggestionsContainer}>
                  {medicationSuggestions.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionItem}
                      onPress={() => {
                        setMedicationName(item.displayName);
                        setShowSuggestions(false);
                      }}
                    >
                      <Text style={styles.suggestionText}>{item.displayName}</Text>
                      {item.genericName !== item.brandName && (
                        <Text style={styles.suggestionSubtext}>{item.genericName}</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
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
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Day Pattern</Text>
                <TouchableOpacity
                  style={styles.picker}
                  onPress={() => setShowDayPicker(true)}
                >
                  <Text style={styles.pickerText}>
                    {dayPatterns.find(p => p.id === dayPattern)?.name}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              {dayPattern === 'specific' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Select Days of the Week</Text>
                  <View style={styles.daysContainer}>
                    {weekDays.map((day) => (
                      <TouchableOpacity
                        key={day.id}
                        style={[
                          styles.dayButton,
                          selectedDays.includes(day.id) && styles.selectedDay
                        ]}
                        onPress={() => {
                          if (selectedDays.includes(day.id)) {
                            setSelectedDays(selectedDays.filter(d => d !== day.id));
                          } else {
                            setSelectedDays([...selectedDays, day.id]);
                          }
                        }}
                      >
                        <Text style={[
                          styles.dayButtonText,
                          selectedDays.includes(day.id) && styles.selectedDayText
                        ]}>
                          {day.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {dayPattern === 'everyother' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Starting Date</Text>
                  <TouchableOpacity
                    style={styles.picker}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={styles.pickerText}>
                      {everyOtherStartDate.toLocaleDateString()}
                    </Text>
                    <Ionicons name="calendar" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              )}

              {dayPattern === 'calendar' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Selected Calendar Days</Text>
                  <TouchableOpacity
                    style={styles.picker}
                    onPress={() => setShowCalendarPicker(true)}
                  >
                    <Text style={styles.pickerText}>
                      {selectedCalendarDates.length > 0 
                        ? `${selectedCalendarDates.length} dates selected`
                        : 'Select dates'}
                    </Text>
                    <Ionicons name="calendar" size={20} color="#666" />
                  </TouchableOpacity>
                  {selectedCalendarDates.length > 0 && (
                    <View style={styles.selectedDatesContainer}>
                      {selectedCalendarDates.map((date, index) => (
                        <View key={index} style={styles.dateChip}>
                          <Text style={styles.dateChipText}>
                            {new Date(date).toLocaleDateString()}
                          </Text>
                          <TouchableOpacity
                            onPress={() => {
                              setSelectedCalendarDates(selectedCalendarDates.filter(d => d !== date));
                            }}
                          >
                            <Ionicons name="close" size={16} color="#666" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Times</Text>
                  <TouchableOpacity style={styles.addTimeButton} onPress={addTime}>
                    <Ionicons name="add" size={16} color="#3fa58e" />
                    <Text style={styles.addTimeText}>Add Time</Text>
                  </TouchableOpacity>
                </View>
                
                {times.map((time, index) => {
                  const [hour, minute] = time.split(':');
                  const displayTime = new Date();
                  displayTime.setHours(parseInt(hour), parseInt(minute));
                  const timeString = displayTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                  
                  return (
                    <View key={index} style={styles.timeRow}>
                      <TouchableOpacity
                        style={styles.timeButton}
                        onPress={() => openTimePicker(index)}
                      >
                        <Ionicons name="time" size={20} color="#3fa58e" />
                        <Text style={styles.timeButtonText}>{timeString}</Text>
                      </TouchableOpacity>
                      {times.length > 1 && (
                        <TouchableOpacity
                          style={styles.removeTimeButton}
                          onPress={() => removeTime(index)}
                        >
                          <Ionicons name="close" size={20} color="#FF6B6B" />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </View>

        {/* Inventory */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inventory Management</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Serving Size</Text>
            <TextInput
              style={styles.input}
              placeholder="Amount per dose (e.g., 1, 0.5, 2)"
              value={servingSize}
              onChangeText={setServingSize}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Servings per Container *</Text>
            <TextInput
              style={styles.input}
              placeholder="Total servings in full container"
              value={servingsPerContainer}
              onChangeText={setServingsPerContainer}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Current Amount of Servings *</Text>
            <TextInput
              style={styles.input}
              placeholder="Number of servings available"
              value={currentServings}
              onChangeText={setCurrentServings}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Serving Threshold</Text>
            <TextInput
              style={styles.input}
              placeholder="Remind when X servings remain"
              value={servingThreshold}
              onChangeText={setServingThreshold}
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
      )}

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

      {/* Day Pattern Picker Modal */}
      <Modal
        visible={showDayPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDayPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Day Pattern</Text>
              <TouchableOpacity onPress={() => setShowDayPicker(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {dayPatterns.map((pattern) => (
              <TouchableOpacity
                key={pattern.id}
                style={[
                  styles.modalOption,
                  dayPattern === pattern.id && styles.selectedOption
                ]}
                onPress={() => {
                  setDayPattern(pattern.id);
                  setShowDayPicker(false);
                }}
              >
                <Text style={styles.modalOptionText}>{pattern.name}</Text>
                {dayPattern === pattern.id && (
                  <Ionicons name="checkmark" size={20} color="#3fa58e" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.timePickerOverlay}>
          <View style={styles.timePickerModal}>
            <View style={styles.timePickerHeader}>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={styles.timePickerCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.timePickerTitle}>Select Starting Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={styles.timePickerDone}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={everyOtherStartDate}
              mode="date"
              display="spinner"
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  setEveryOtherStartDate(selectedDate);
                }
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Calendar Picker Modal */}
      <Modal
        visible={showCalendarPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCalendarPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Calendar Days</Text>
              <TouchableOpacity onPress={() => setShowCalendarPicker(false)}>
                <Text style={styles.timePickerDone}>Done</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.calendarHeader}>
              <TouchableOpacity 
                style={styles.navButton}
                onPress={() => {
                  const newMonth = new Date(currentMonth);
                  newMonth.setMonth(newMonth.getMonth() - 1);
                  setCurrentMonth(newMonth);
                }}
              >
                <Ionicons name="chevron-back" size={20} color="#3fa58e" />
              </TouchableOpacity>
              <Text style={styles.monthText}>
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity 
                style={styles.navButton}
                onPress={() => {
                  const newMonth = new Date(currentMonth);
                  newMonth.setMonth(newMonth.getMonth() + 1);
                  setCurrentMonth(newMonth);
                }}
              >
                <Ionicons name="chevron-forward" size={20} color="#3fa58e" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.weekDaysHeader}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <View key={index} style={styles.weekDayContainer}>
                  <Text style={styles.weekDayText}>{day}</Text>
                </View>
              ))}
            </View>
            
            <View style={styles.calendarContainer}>
              {(() => {
                const year = currentMonth.getFullYear();
                const month = currentMonth.getMonth();
                const firstDay = new Date(year, month, 1);
                const startDate = new Date(firstDay);
                startDate.setDate(startDate.getDate() - firstDay.getDay());
                
                const weeks = [];
                for (let week = 0; week < 6; week++) {
                  const weekDays = [];
                  for (let day = 0; day < 7; day++) {
                    const date = new Date(startDate);
                    date.setDate(startDate.getDate() + (week * 7) + day);
                    const dateString = date.toISOString().split('T')[0];
                    const isCurrentMonth = date.getMonth() === month;
                    const isSelected = selectedCalendarDates.includes(dateString);
                    const isToday = date.toDateString() === new Date().toDateString();
                    
                    weekDays.push(
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.dayCell,
                          isSelected && styles.selectedDayCell,
                          isToday && !isSelected && styles.todayCell
                        ]}
                        onPress={() => {
                          if (!rangeStartDate) {
                            // First click - start range
                            setRangeStartDate(dateString);
                            if (!isSelected) {
                              setSelectedCalendarDates(prev => [...prev, dateString]);
                            }
                          } else if (rangeStartDate === dateString) {
                            // Same date clicked twice - toggle individual day
                            if (isSelected) {
                              setSelectedCalendarDates(prev => prev.filter(d => d !== dateString));
                            } else {
                              setSelectedCalendarDates(prev => [...prev, dateString]);
                            }
                            setRangeStartDate(null);
                          } else {
                            // Second click - complete range
                            const startDate = new Date(rangeStartDate);
                            const endDate = new Date(dateString);
                            const start = startDate < endDate ? startDate : endDate;
                            const end = startDate < endDate ? endDate : startDate;
                            
                            // Get all dates in range
                            const rangeDates = [];
                            const current = new Date(start);
                            while (current <= end) {
                              rangeDates.push(current.toISOString().split('T')[0]);
                              current.setDate(current.getDate() + 1);
                            }
                            
                            // Check if all dates in range are already selected
                            const allSelected = rangeDates.every(d => selectedCalendarDates.includes(d));
                            
                            if (allSelected) {
                              // Deselect the range
                              setSelectedCalendarDates(prev => prev.filter(d => !rangeDates.includes(d)));
                            } else {
                              // Select the range (remove existing range dates first, then add all)
                              setSelectedCalendarDates(prev => {
                                const filtered = prev.filter(d => !rangeDates.includes(d));
                                return [...filtered, ...rangeDates];
                              });
                            }
                            
                            setRangeStartDate(null);
                          }
                        }}
                      >
                        <Text style={[
                          styles.dayText,
                          !isCurrentMonth && styles.otherMonthText,
                          isSelected && styles.selectedDayText,
                          isToday && !isSelected && styles.todayText
                        ]}>
                          {date.getDate()}
                        </Text>
                      </TouchableOpacity>
                    );
                  }
                  weeks.push(
                    <View key={week} style={styles.weekRow}>
                      {weekDays}
                    </View>
                  );
                }
                return weeks;
              })()}
            </View>
          </View>
        </View>
      </Modal>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.timePickerOverlay}>
          <View style={styles.timePickerModal}>
            <View style={styles.timePickerHeader}>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <Text style={styles.timePickerCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.timePickerTitle}>Select Time</Text>
              <TouchableOpacity onPress={confirmTime}>
                <Text style={styles.timePickerDone}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={(() => {
                const [hour, minute] = times[selectedTimeIndex].split(':');
                const date = new Date();
                date.setHours(parseInt(hour), parseInt(minute));
                return date;
              })()}
              mode="time"
              is24Hour={false}
              display="spinner"
              onChange={onTimeChange}
              style={styles.timePicker}
              textColor="blue"
            />
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
  timeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginRight: 12,
  },
  timeButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
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
  autocompleteContainer: {
    position: 'relative',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  suggestionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  suggestionSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  timePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePickerModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '80%',
    maxWidth: 300,
    paddingBottom: 20,
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  timePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  timePickerCancel: {
    fontSize: 16,
    color: '#666',
  },
  timePickerDone: {
    fontSize: 16,
    color: '#3fa58e',
    fontWeight: '600',
  },
  timePickerContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePicker: {
    width: '100%',
    height: 200,
    color: 'blue',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  selectedDay: {
    backgroundColor: '#3fa58e',
    borderColor: '#3fa58e',
  },
  dayButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  selectedDayText: {
    color: '#fff',
  },
  selectedDatesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9f7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  dateChipText: {
    fontSize: 12,
    color: '#3fa58e',
    fontWeight: '500',
  },
  calendarModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    maxHeight: '80%',
  },
  calendarContainer: {
    padding: 20,
  },
  calendarDoneButton: {
    backgroundColor: '#3fa58e',
    marginHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  calendarDoneText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  calendarInstructions: {
    padding: 20,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  navButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  monthText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  weekDaysHeader: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
  },
  weekDayContainer: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  calendarContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayCell: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
    borderRadius: 8,
  },
  selectedDayCell: {
    backgroundColor: '#3fa58e',
  },
  todayCell: {
    backgroundColor: '#e8f5f3',
    borderWidth: 1,
    borderColor: '#3fa58e',
  },
  dayText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: '700',
  },
  todayText: {
    color: '#3fa58e',
    fontWeight: '700',
  },
  otherMonthText: {
    color: '#ccc',
  },
  summaryContainer: {
    padding: 20,
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  summarySection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  editButton: {
    backgroundColor: '#f0f9f7',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#3fa58e',
  },
  editButtonText: {
    color: '#3fa58e',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});