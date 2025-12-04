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
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showStats, setShowStats] = useState(false);
  const [monthlyStats, setMonthlyStats] = useState({});
  const [filterMedication, setFilterMedication] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

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
      calculateMonthlyStats(logs, medications);
    });

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeMeds();
      unsubscribeLogs();
    };
  }, []);

  const calculateMonthlyStats = (logs, meds) => {
    const stats = {
      totalDoses: 0,
      takenDoses: 0,
      missedDoses: 0,
      adherenceRate: 0,
      currentStreak: 0,
      longestStreak: 0,
      weeklyAverage: 0,
      mostTakenMed: null,
      leastTakenMed: null
    };

    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    const monthLogs = logs.filter(log => {
      const logDate = log.date instanceof Date ? log.date : 
        log.date.toDate ? log.date.toDate() : 
        new Date(log.date.seconds * 1000);
      return logDate >= monthStart && logDate <= monthEnd;
    });

    stats.totalDoses = monthLogs.length;
    stats.takenDoses = monthLogs.filter(log => log.status === 'taken').length;
    stats.missedDoses = monthLogs.filter(log => log.status === 'missed').length;
    stats.adherenceRate = stats.totalDoses > 0 ? Math.round((stats.takenDoses / stats.totalDoses) * 100) : 0;

    // Calculate streaks
    const sortedLogs = logs.sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : a.date.toDate ? a.date.toDate() : new Date(a.date.seconds * 1000);
      const dateB = b.date instanceof Date ? b.date : b.date.toDate ? b.date.toDate() : new Date(b.date.seconds * 1000);
      return dateB - dateA;
    });

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    for (const log of sortedLogs) {
      if (log.status === 'taken') {
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        if (currentStreak === 0) currentStreak = tempStreak;
        tempStreak = 0;
      }
    }
    
    stats.currentStreak = currentStreak || tempStreak;
    stats.longestStreak = longestStreak;

    // Medication stats
    const medStats = {};
    monthLogs.forEach(log => {
      if (!medStats[log.medicationId]) {
        medStats[log.medicationId] = { taken: 0, total: 0, name: '' };
      }
      medStats[log.medicationId].total++;
      if (log.status === 'taken') medStats[log.medicationId].taken++;
    });

    meds.forEach(med => {
      if (medStats[med.id]) {
        medStats[med.id].name = med.name;
      }
    });

    const medEntries = Object.entries(medStats);
    if (medEntries.length > 0) {
      const sortedByTaken = medEntries.sort((a, b) => b[1].taken - a[1].taken);
      stats.mostTakenMed = sortedByTaken[0][1];
      stats.leastTakenMed = sortedByTaken[sortedByTaken.length - 1][1];
    }

    setMonthlyStats(stats);
  };

  const getMedicationsForDate = (date) => {
    // Return user's actual medications for the selected date with real status
    let filteredMeds = medications;
    if (filterMedication) {
      filteredMeds = medications.filter(med => med.id === filterMedication);
    }
    
    return filteredMeds.filter(med => {
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
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.statsButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="filter" size={20} color="#3fa58e" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statsButton}
            onPress={() => setShowStats(!showStats)}
          >
            <Ionicons name="stats-chart" size={20} color="#3fa58e" />
          </TouchableOpacity>
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
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'week' && styles.activeToggle]}
              onPress={() => setViewMode('week')}
            >
              <Ionicons 
                name="grid" 
                size={20} 
                color={viewMode === 'week' ? '#fff' : '#666'} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Filter Panel */}
      {showFilters && (
        <View style={styles.filterPanel}>
          <Text style={styles.filterTitle}>Filter by Medication</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <TouchableOpacity
              style={[styles.filterChip, !filterMedication && styles.activeFilter]}
              onPress={() => setFilterMedication(null)}
            >
              <Text style={[styles.filterText, !filterMedication && styles.activeFilterText]}>All</Text>
            </TouchableOpacity>
            {medications.map(med => (
              <TouchableOpacity
                key={med.id}
                style={[styles.filterChip, filterMedication === med.id && styles.activeFilter]}
                onPress={() => setFilterMedication(filterMedication === med.id ? null : med.id)}
              >
                <Text style={[styles.filterText, filterMedication === med.id && styles.activeFilterText]}>{med.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Statistics Panel */}
      {showStats && (
        <View style={styles.statsPanel}>
          <Text style={styles.statsPanelTitle}>Monthly Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{monthlyStats.adherenceRate || 0}%</Text>
              <Text style={styles.statLabel}>Adherence Rate</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{monthlyStats.currentStreak || 0}</Text>
              <Text style={styles.statLabel}>Current Streak</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{monthlyStats.longestStreak || 0}</Text>
              <Text style={styles.statLabel}>Longest Streak</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{monthlyStats.takenDoses || 0}/{monthlyStats.totalDoses || 0}</Text>
              <Text style={styles.statLabel}>Doses Taken</Text>
            </View>
          </View>
          {monthlyStats.mostTakenMed && (
            <View style={styles.medStatsContainer}>
              <View style={styles.medStat}>
                <Text style={styles.medStatLabel}>Most Consistent:</Text>
                <Text style={styles.medStatValue}>{monthlyStats.mostTakenMed.name}</Text>
              </View>
              {monthlyStats.leastTakenMed && monthlyStats.leastTakenMed.name !== monthlyStats.mostTakenMed.name && (
                <View style={styles.medStat}>
                  <Text style={styles.medStatLabel}>Needs Attention:</Text>
                  <Text style={styles.medStatValue}>{monthlyStats.leastTakenMed.name}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

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
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Calendar */}
          <Calendar
            style={styles.calendar}
            current={currentMonth.toISOString().split('T')[0]}
            onDayPress={(day) => setSelectedDate(day.dateString)}
            onMonthChange={(month) => setCurrentMonth(new Date(month.dateString))}
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
              <View style={styles.headerRight}>
                <View style={styles.quickStatItem}>
                  <Text style={styles.quickStatValue}>{selectedDateMedications.filter(m => m.status === 'taken').length}/{selectedDateMedications.length}</Text>
                  <Text style={styles.quickStatLabel}>Today</Text>
                </View>
                {selectedDateMedications.some(m => m.status === 'scheduled') && (
                  <TouchableOpacity
                    style={styles.markAllButton}
                    onPress={() => {
                      selectedDateMedications
                        .filter(m => m.status === 'scheduled')
                        .forEach(m => markMedicationStatus(m.id, 'taken', selectedDate));
                    }}
                  >
                    <Text style={styles.markAllText}>Mark All</Text>
                  </TouchableOpacity>
                )}
              </View>
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
        </ScrollView>
      ) : viewMode === 'week' ? (
        /* Week View */
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.weekView}>
            <Text style={styles.weekTitle}>This Week</Text>
            {(() => {
              const today = new Date();
              const startOfWeek = new Date(today);
              startOfWeek.setDate(today.getDate() - today.getDay());
              
              const weekDays = [];
              for (let i = 0; i < 7; i++) {
                const date = new Date(startOfWeek);
                date.setDate(startOfWeek.getDate() + i);
                const dateString = date.toISOString().split('T')[0];
                const dayMeds = getMedicationsForDate(dateString);
                const takenCount = dayMeds.filter(m => m.status === 'taken').length;
                const totalCount = dayMeds.length;
                
                weekDays.push(
                  <TouchableOpacity
                    key={i}
                    style={[styles.weekDay, selectedDate === dateString && styles.selectedWeekDay]}
                    onPress={() => {
                      setSelectedDate(dateString);
                      setViewMode('calendar');
                    }}
                  >
                    <Text style={styles.weekDayName}>{date.toLocaleDateString('en-US', { weekday: 'short' })}</Text>
                    <Text style={styles.weekDayDate}>{date.getDate()}</Text>
                    <View style={styles.weekDayProgress}>
                      <Text style={styles.weekDayCount}>{takenCount}/{totalCount}</Text>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: totalCount > 0 ? `${(takenCount/totalCount)*100}%` : '0%' }]} />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }
              return weekDays;
            })()}
          </View>
        </ScrollView>
      ) : (
        /* List View */
        <>
          <View style={styles.listActions}>
            <TouchableOpacity
              style={styles.exportButton}
              onPress={() => {
                const data = Object.entries(adherenceData)
                  .map(([date, info]) => `${date}: ${info.adherence}% adherence`)
                  .join('\n');
                console.log('Export data:', data);
              }}
            >
              <Ionicons name="download" size={16} color="#3fa58e" />
              <Text style={styles.exportText}>Export</Text>
            </TouchableOpacity>
          </View>
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
        </>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statsButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f9f7',
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
  scrollContainer: {
    flex: 1,
  },
  selectedDateContainer: {
    marginTop: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 300,
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
  statsPanel: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsPanelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3fa58e',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  medStatsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  medStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  medStatLabel: {
    fontSize: 14,
    color: '#666',
  },
  medStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markAllButton: {
    backgroundColor: '#3fa58e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  markAllText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  quickStatItem: {
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3fa58e',
  },
  quickStatLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  filterPanel: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  activeFilter: {
    backgroundColor: '#3fa58e',
  },
  filterText: {
    fontSize: 12,
    color: '#666',
  },
  activeFilterText: {
    color: '#fff',
  },
  weekView: {
    padding: 20,
  },
  weekTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  weekDay: {
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
  selectedWeekDay: {
    borderWidth: 2,
    borderColor: '#3fa58e',
  },
  weekDayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  weekDayDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  weekDayProgress: {
    marginTop: 8,
  },
  weekDayCount: {
    fontSize: 12,
    color: '#3fa58e',
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3fa58e',
    borderRadius: 2,
  },
  listActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9f7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  exportText: {
    fontSize: 12,
    color: '#3fa58e',
    fontWeight: '600',
  },
});