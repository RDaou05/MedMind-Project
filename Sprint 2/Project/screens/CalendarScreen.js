import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { auth, subscribeToUserMedications, subscribeToUserIntakeLogs, addIntakeLog, takeMedication, db } from '../firebase';
import { deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState('calendar');
  const [medications, setMedications] = useState([]);
  const [intakeLogs, setIntakeLogs] = useState([]);
  const [adherenceData, setAdherenceData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    // Subscribe to real-time medication updates
    const unsubscribeMeds = subscribeToUserMedications(user.uid, (medications) => {
      setMedications(medications);
      
      // Generate adherence data when medications change
      const adherence = {};
      if (medications.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        adherence[today] = { marked: true, dotColor: '#3fa58e', adherence: 100 };
      }
      setAdherenceData(adherence);
      setLoading(false);
    });

    // Subscribe to real-time intake log updates
    const unsubscribeLogs = subscribeToUserIntakeLogs(user.uid, (logs) => {
      console.log('Calendar: Intake logs updated:', logs.length, 'logs received');
      setIntakeLogs(logs);
    });

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeMeds();
      unsubscribeLogs();
    };
  }, []);

  const getMedicationsForDate = (date) => {
    // Return user's actual medications for the selected date with real status
    return medications.filter(med => {
      // Only show medications that were created on or before the selected date
      const medicationCreatedDate = med.createdAt instanceof Date ? 
        med.createdAt.toISOString().split('T')[0] : 
        med.createdAt.toDate ? med.createdAt.toDate().toISOString().split('T')[0] : 
        med.createdAt.seconds ? new Date(med.createdAt.seconds * 1000).toISOString().split('T')[0] : 
        new Date().toISOString().split('T')[0];
      
      return date >= medicationCreatedDate;
    }).map(med => {
      // Find intake log for this medication on this date using date string comparison
      const selectedDateString = date; // date is already in YYYY-MM-DD format
      const intakeLog = intakeLogs.find(log => {
        if (!log.date || log.medicationId !== med.id) return false;
        
        let logDateString;
        if (log.date instanceof Date) {
          logDateString = log.date.toISOString().split('T')[0];
        } else if (typeof log.date === 'string') {
          logDateString = log.date.split('T')[0];
        } else if (log.date.toDate && typeof log.date.toDate === 'function') {
          // Firebase Timestamp
          logDateString = log.date.toDate().toISOString().split('T')[0];
        } else if (log.date.seconds) {
          // Firebase Timestamp object
          logDateString = new Date(log.date.seconds * 1000).toISOString().split('T')[0];
        } else {
          return false;
        }
        
        const match = logDateString === selectedDateString;
        if (match) {
          console.log('Found matching log for', med.name, 'on', selectedDateString, ':', log.status);
        }
        return match;
      });
      
      let status = 'scheduled';
      let actualTime = null;
      
      if (intakeLog) {
        status = intakeLog.status || 'taken';
        actualTime = intakeLog.actualTime;
      } else {
        // For past dates, mark as missed if no log exists AND medication was created before that date
        const today = new Date().toISOString().split('T')[0];
        const medicationCreatedDate = med.createdAt instanceof Date ? 
          med.createdAt.toISOString().split('T')[0] : 
          med.createdAt.toDate ? med.createdAt.toDate().toISOString().split('T')[0] : 
          med.createdAt.seconds ? new Date(med.createdAt.seconds * 1000).toISOString().split('T')[0] : 
          today;
        
        if (selectedDateString < today && selectedDateString >= medicationCreatedDate) {
          status = 'missed';
        }
      }
      
      return {
        id: med.id,
        name: med.name,
        dosage: med.dosage,
        scheduledTime: med.times?.[0] || '08:00',
        actualTime: actualTime,
        status: status,
        notes: intakeLog?.notes || null,
      };
    });
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
  const untakeMedication = async (medicationId, dateString, wasTaken = false) => {
    try {
      const user = auth.currentUser;
      if (user) {
        // Find and delete the intake log for this medication on this date
        const matchingLog = intakeLogs.find(log => {
          if (!log.date || log.medicationId !== medicationId) return false;
          
          let logDateString;
          if (log.date instanceof Date) {
            logDateString = log.date.toISOString().split('T')[0];
          } else if (typeof log.date === 'string') {
            logDateString = log.date.split('T')[0];
          } else if (log.date.toDate && typeof log.date.toDate === 'function') {
            logDateString = log.date.toDate().toISOString().split('T')[0];
          } else if (log.date.seconds) {
            logDateString = new Date(log.date.seconds * 1000).toISOString().split('T')[0];
          } else {
            return false;
          }
          
          return logDateString === dateString;
        });
        
        if (matchingLog) {
          await deleteDoc(doc(db, 'intakeLogs', matchingLog.id));
          
          // Only add serving back if medication was actually taken (not missed)
          if (wasTaken) {
            const medicationRef = doc(db, 'medications', medicationId);
            const medicationDoc = await getDoc(medicationRef);
            
            if (medicationDoc.exists()) {
              const currentData = medicationDoc.data();
              const newServings = (currentData.currentServings || 0) + 1;
              
              await updateDoc(medicationRef, {
                currentServings: newServings,
                updatedAt: new Date()
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error untaking medication:', error);
    }
  };

  const markMedicationStatus = async (medicationId, status, dateString) => {
    console.log('markMedicationStatus called:', { medicationId, status, dateString });
    try {
      const user = auth.currentUser;
      if (user) {
        // Create date in local timezone to avoid UTC conversion issues
        const [year, month, day] = dateString.split('-');
        const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
        
        const intakeData = {
          medicationId: medicationId,
          date: localDate,
          status: status,
          actualTime: status === 'taken' ? new Date().toTimeString().slice(0, 5) : null,
          notes: null
        };
        
        console.log('Saving calendar intake data:', intakeData);
        await addIntakeLog(user.uid, intakeData);
        await takeMedication(medicationId, 1);
        console.log('Calendar intake log saved successfully');
      } else {
        console.log('No user found for calendar action');
      }
    } catch (error) {
      console.error('Error marking medication status:', error);
    }
  };

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
                {(() => {
                  const [year, month, day] = selectedDate.split('-');
                  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                  return date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  });
                })()}
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
                  
                  <View style={styles.medicationActions}>
                    {medication.status === 'scheduled' && (
                      <>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.takenButton]}
                          onPress={() => markMedicationStatus(medication.id, 'taken', selectedDate)}
                        >
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.missedButton]}
                          onPress={() => markMedicationStatus(medication.id, 'missed', selectedDate)}
                        >
                          <Ionicons name="close" size={16} color="#fff" />
                        </TouchableOpacity>
                      </>
                    )}
                    
                    {(medication.status === 'taken' || medication.status === 'missed') && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.untakeButton]}
                        onPress={() => untakeMedication(medication.id, selectedDate, medication.status === 'taken')}
                      >
                        <Ionicons name="refresh" size={16} color="#fff" />
                      </TouchableOpacity>
                    )}
                    
                    <View style={[
                      styles.statusBadge,
                      medication.status === 'taken' && styles.takenBadge,
                      medication.status === 'missed' && styles.missedBadge
                    ]}>
                      <Ionicons 
                        name={getStatusIcon(medication.status)} 
                        size={16} 
                        color={getStatusColor(medication.status)} 
                        style={styles.statusIcon}
                      />
                      <Text style={[styles.statusText, { color: getStatusColor(medication.status) }]}>
                        {medication.status.charAt(0).toUpperCase() + medication.status.slice(1)}
                      </Text>
                    </View>
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
  medicationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  takenButton: {
    backgroundColor: '#3fa58e',
  },
  missedButton: {
    backgroundColor: '#FF6B6B',
  },
  untakeButton: {
    backgroundColor: '#FFB800',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  takenBadge: {
    backgroundColor: '#f0f9f7',
  },
  missedBadge: {
    backgroundColor: '#fff5f5',
  },
  statusIcon: {
    marginRight: 4,
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