import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Index() {
  useEffect(() => {
    // Auto-redirect to web app on web platform
    if (Platform.OS === 'web') {
      window.location.href = '/api/vote';
    }
  }, []);

  const openWebApp = () => {
    if (Platform.OS === 'web') {
      window.location.href = '/api/vote';
    } else {
      Linking.openURL('/api/vote');
    }
  };

  const openAdminPanel = () => {
    if (Platform.OS === 'web') {
      window.location.href = '/api/admin-panel';
    } else {
      Linking.openURL('/api/admin-panel');
    }
  };

  // Show loading while redirecting on web
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="trophy" size={64} color="#6366f1" />
          <Text style={styles.loadingText}>Redirecting to The Poll Winner...</Text>
        </View>
      </View>
    );
  }

  // For mobile, show options
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="trophy" size={80} color="#fff" />
        </View>
        <Text style={styles.title}>The Poll Winner</Text>
        <Text style={styles.subtitle}>Vote, Win & Earn Real Money!</Text>
        
        <TouchableOpacity style={styles.button} onPress={openWebApp}>
          <Ionicons name="globe-outline" size={24} color="#fff" />
          <Text style={styles.buttonText}>Open Web App</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={openAdminPanel}>
          <Ionicons name="settings-outline" size={24} color="#6366f1" />
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>Admin Panel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#64748b',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#64748b',
    marginBottom: 40,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
    maxWidth: 300,
    justifyContent: 'center',
    gap: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  secondaryButtonText: {
    color: '#6366f1',
  },
});
