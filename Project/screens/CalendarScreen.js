import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'

  // Mock data for medication adherence
  const adherenceData = {
    '2024-01-15': { marked: true, dotColor: '#3fa58e', adherence: 100 },
    '2024-01-16': { marked: true, dotColor: '#FFB800', adherence: 75 },
    '2024-01-17': { marked: true, dotColor: '#FF6B6B', adherence: 50 },
    '2024-01-18': { marked: true, dotColor: '#3fa58e', adherence: 100 },
    '2024-01-19': { marked: true, dotColor: '#3fa58e', adherence: 100 },
    '2024-01-20': { marked: true, dotColor: '#FFB800', adherence: 67 },
    '2024-01-21': { marked: true, dotColor: '#FF6B6B', adherence: 33 },
  };

  // Mock medication data for selected date
  const getMedicationsForDate = (date) => {
    return [
      {
        id: 1,
        name: 'Aspirin',
        dosage: '81mg',
        scheduledTime: '08:00',
        actualTime: '08:15',
        status: 'taken',
        notes: 'Taken with breakfast',
      },
      {
        id: 2,
        name: 'Vitamin D',
        dosage: '1000 IU',
        scheduledTime: '12:00',
        actualTime: null,
        status: 'missed',
        notes: null,
      },
      {
        id: 3,
        name: 'Metformin',
        dosage: '500mg',
        scheduledTime: '18:00',
        actualTime: '18:00',
        status: 'taken',
        notes: 'Taken with dinner',
      },
    ];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'taken':
        return '#3fa58e';
      case 'missed':
        return '#FF6B6B';
      case 'skipped':
        return '#FFB800';
      default:
        return '#ccc';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'taken':
        return 'checkmark-circle';
      case 'missed':
        return 'close-circle';
      case 'skipped':
        return 'remove-circle';
      default:
        return 'time';
    }
  };

  const selectedDateMedications = getMedicationsForDate(selectedDate);
  const adherenceForDate = adherenceData[selectedDate];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Medication Calendar</Text>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'calendar' && styles.activeToggle]}
            onPress={() => setViewMode('calendar')}
          >
            <Ionicons 
              name="calendar" 
              size={20} 
              color={viewMode === 'calendar' ? '#fff' : '#666'} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'list' && styles.activeToggle]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons 
              name="list" 
              size={20} 
              color={viewMode === 'list' ? '#fff' : '#666'} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#3fa58e' }]} />
          <Text style={styles.legendText}>100% Adherence</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FFB800' }]} />
          <Text style={styles.legendText}>Partial</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF6B6B' }]} />
          <Text style={styles.legendText}>Missed</Text>
        </View>
      </View>

      {viewMode === 'calendar' ? (
        <>
          {/* Calendar */}
          <Calendar
            style={styles.calendar}
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={{
              ...adherenceData,
              [selectedDate]: {
                ...adherenceData[selectedDate],
                selected: true,
                selectedColor: '#3fa58e',
              },
            }}
            theme={{
              backgroundColor: '#ffffff',
              calendarBackground: '#ffffff',
              textSectionTitleColor: '#b6c1cd',
              selectedDayBackgroundColor: '#3fa58e',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#3fa58e',
              dayTextColor: '#2d4150',
              textDisabledColor: '#d9e1e8',
              dotColor: '#00adf5',
              selectedDotColor: '#ffffff',
              arrowColor: '#3fa58e',
              disabledArrowColor: '#d9e1e8',
              monthTextColor: '#2d4150',
              indicatorColor: '#3fa58e',
              textDayFontFamily: 'System',
              textMonthFontFamily: 'System',
              textDayHeaderFontFamily: 'System',
              textDayFontWeight: '300',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '300',
              textDayFontSize: 16,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 13,
            }}
          />

          {/* Selected Date Details */}
          <View style={styles.selectedDateContainer}>
            <View style={styles.selectedDateHeader}>
              <Text style={styles.selectedDateTitle}>
                {new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
              {adherenceForDate && (
                <View style={styles.adherenceChip}>
                  <Text style={styles.adherenceText}>
                    {adherenceForDate.adherence}% Adherence
                  </Text>
                </View>
              )}
            </View>

            <ScrollView style={styles.medicationsList} showsVerticalScrollIndicator={false}>
              {selectedDateMedications.map((medication) => (
                <View key={medication.id} style={styles.medicationItem}>
                  <View style={styles.medicationStatus}>
                    <Ionicons
                      name={getStatusIcon(medication.status)}
                      size={24}
                      color={getStatusColor(medication.status)}
                    />
                  </View>
                  
                  <View style={styles.medicationDetails}>
                    <Text style={styles.medicationName}>{medication.name}</Text>
                    <Text style={styles.medicationDosage}>{medication.dosage}</Text>
                    
                    <View style={styles.timeContainer}>
                      <Text style={styles.scheduledTime}>
                        Scheduled: {medication.scheduledTime}
                      </Text>
                      {medication.actualTime && (
                        <Text style={styles.actualTime}>
                          Taken: {medication.actualTime}
                        </Text>
                      )}
                    </View>
                    
                    {medication.notes && (
                      <Text style={styles.medicationNotes}>{medication.notes}</Text>
                    )}
                  </View>
                  
                  <View style={styles.statusBadge}>
                    <Text style={[styles.statusText, { color: getStatusColor(medication.status) }]}>
                      {medication.status.charAt(0).toUpperCase() + medication.status.slice(1)}
                    </Text>
                  </View>
                </View>
              ))}
              
              {selectedDateMedications.length === 0 && (
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={48} color="#ccc" />
                  <Text style={styles.emptyStateText}>No medications scheduled for this date</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </>
      ) : (
        /* List View */
        <ScrollView style={styles.listView} showsVerticalScrollIndicator={false}>
          {Object.entries(adherenceData)
            .sort(([a], [b]) => new Date(b) - new Date(a))
            .map(([date, data]) => (
              <TouchableOpacity
                key={date}
                style={styles.listItem}
                onPress={() => {
                  setSelectedDate(date);
                  setViewMode('calendar');
                }}
              >
                <View style={styles.listItemLeft}>
                  <View style={[styles.adherenceDot, { backgroundColor: data.dotColor }]} />
                  <View>
                    <Text style={styles.listItemDate}>
                      {new Date(date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                    <Text style={styles.listItemAdherence}>
                      {data.adherence}% Adherence
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            ))}
        </ScrollView>
      )}
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
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    padding: 2,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  activeToggle: {
    backgroundColor: '#3fa58e',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  calendar: {
    marginHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedDateContainer: {
    flex: 1,
    marginTop: 20,
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  adherenceChip: {
    backgroundColor: '#f0f9f7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  adherenceText: {
    color: '#3fa58e',
    fontSize: 12,
    fontWeight: '600',
  },
  medicationsList: {
    flex: 1,
    padding: 20,
  },
  medicationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  medicationStatus: {
    marginRight: 16,
  },
  medicationDetails: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  medicationDosage: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  timeContainer: {
    marginTop: 4,
  },
  scheduledTime: {
    fontSize: 12,
    color: '#999',
  },
  actualTime: {
    fontSize: 12,
    color: '#3fa58e',
    marginTop: 2,
  },
  medicationNotes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  statusBadge: {
    marginLeft: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
  listView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adherenceDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  listItemDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  listItemAdherence: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});