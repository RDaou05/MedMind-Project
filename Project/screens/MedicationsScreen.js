import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { auth, subscribeToUserMedications, deleteMedication, updateMedication } from '../firebase';

export default function MedicationsScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    // Subscribe to real-time medication updates
    const unsubscribe = subscribeToUserMedications(user.uid, (medications) => {
      setMedications(medications);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const filteredMedications = medications.filter(med =>
    med.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteMedication = (id) => {
    Alert.alert(
      'Delete Medication',
      'Are you sure you want to delete this medication?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMedication(id);
              setMedications(prev => prev.filter(med => med.id !== id));
              Alert.alert('Success', 'Medication deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete medication');
            }
          },
        },
      ]
    );
  };

  const handleRefill = async (medication) => {
    try {
      await updateMedication(medication.id, {
        currentServings: medication.servingsPerContainer || 0
      });
      Alert.alert('Success', 'Medication refilled successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to refill medication');
    }
  };

  const getMedicationIcon = (type) => {
    switch (type) {
      case 'pill':
        return 'medical';
      case 'capsule':
        return 'fitness';
      case 'liquid':
        return 'water';
      case 'injection':
        return 'medical-outline';
      default:
        return 'medical';
    }
  };

  const needsRefill = (currentServings, threshold) => currentServings <= threshold;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Medications</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddMedication')}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search medications..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Medications List */}
      <ScrollView style={styles.medicationsList} showsVerticalScrollIndicator={false}>
        {filteredMedications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="medical-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateTitle}>No medications found</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'Try a different search term' : 'Add your first medication to get started'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => navigation.navigate('AddMedication')}
              >
                <Text style={styles.emptyStateButtonText}>Add Medication</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredMedications.map((medication) => (
            <View key={medication.id} style={[
              styles.medicationCard,
              needsRefill(medication.currentServings, medication.servingThreshold) && styles.lowInventoryCard
            ]}>
              {/* Refill Alert */}
              {needsRefill(medication.currentServings, medication.servingThreshold) && (
                <View style={styles.refillAlert}>
                  <Ionicons name="warning" size={16} color="#FF6B6B" />
                  <Text style={styles.refillAlertText}>Refill needed</Text>
                </View>
              )}

              <View style={styles.medicationHeader}>
                <View style={styles.medicationIconContainer}>
                  <View style={[styles.medicationIcon, { backgroundColor: medication.color + '20' }]}>
                    <Ionicons
                      name={getMedicationIcon(medication.type)}
                      size={24}
                      color={medication.color}
                    />
                  </View>
                </View>

                <View style={styles.medicationInfo}>
                  <Text style={styles.medicationName}>{medication.name}</Text>
                  <Text style={styles.medicationDosage}>{medication.dosage}</Text>
                  <Text style={styles.medicationFrequency}>{medication.frequency}</Text>
                </View>

                <View style={styles.medicationActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      navigation.navigate('AddMedication', { editMedication: medication });
                    }}
                  >
                    <Ionicons name="create-outline" size={20} color="#666" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteMedication(medication.id)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Schedule Times */}
              <View style={styles.scheduleContainer}>
                <Text style={styles.scheduleLabel}>Schedule:</Text>
                <View style={styles.timesContainer}>
                  {medication.times.map((time, index) => (
                    <View key={index} style={styles.timeChip}>
                      <Text style={styles.timeText}>{time}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Inventory */}
              <View style={styles.inventoryContainer}>
                <View style={styles.inventoryInfo}>
                  <Text style={styles.inventoryLabel}>Servings:</Text>
                  <Text style={[
                    styles.inventoryCount,
                    needsRefill(medication.currentServings, medication.servingThreshold) && styles.lowInventory
                  ]}>
                    {medication.currentServings || 0} servings remaining
                  </Text>
                  <Text style={styles.servingSize}>
                    {medication.servingSize || 1} per dose
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.refillButton}
                  onPress={() => handleRefill(medication)}
                >
                  <Text style={styles.refillButtonText}>Mark Refilled</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
  addButton: {
    backgroundColor: '#3fa58e',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3fa58e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
  },
  medicationsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  medicationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lowInventoryCard: {
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  refillAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  refillAlertText: {
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  medicationIconContainer: {
    marginRight: 16,
  },
  medicationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  medicationDosage: {
    fontSize: 16,
    color: '#666',
    marginTop: 2,
  },
  medicationFrequency: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  medicationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  scheduleContainer: {
    marginBottom: 16,
  },
  scheduleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  timesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChip: {
    backgroundColor: '#3fa58e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  inventoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inventoryInfo: {
    flex: 1,
  },
  inventoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  inventoryCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  lowInventory: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  servingSize: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  refillButton: {
    backgroundColor: '#f0f9f7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3fa58e',
  },
  refillButtonText: {
    color: '#3fa58e',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
  },
  emptyStateButton: {
    backgroundColor: '#3fa58e',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 24,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});