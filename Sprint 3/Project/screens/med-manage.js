import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { logoutUser, getCurrentUser } from '../services/authService';

export default function MedManage({ navigation }) {
    const user = getCurrentUser();

    const handleLogout = async () => {
        try {
            await logoutUser();
            navigation.navigate('login');
        } catch (error) {
            Alert.alert('Error', 'Failed to logout');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>MedMind</Text>
                <Text style={styles.welcome}>Welcome, {user?.email}</Text>
            </View>
            
            <View style={styles.content}>
                <Text style={styles.placeholder}>Medicine management features coming soon...</Text>
            </View>
            
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingTop: 60,
        paddingHorizontal: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#3fa58e',
        marginBottom: 8,
    },
    welcome: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholder: {
        fontSize: 18,
        color: '#9CA3AF',
        textAlign: 'center',
    },
    logoutButton: {
        backgroundColor: '#EF4444',
        paddingVertical: 16,
        borderRadius: 24,
        marginBottom: 40,
    },
    logoutText: {
        color: '#FFFFFF',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '600',
    },
});