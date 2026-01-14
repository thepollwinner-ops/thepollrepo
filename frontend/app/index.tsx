import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function Index() {
  const { user, loading, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/(tabs)');
    }
  }, [user, loading]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="trophy" size={80} color="#6366f1" />
        <Text style={styles.title}>The Poll Winner</Text>
        <Text style={styles.subtitle}>Vote, Win & Earn Real Money!</Text>
        
        <View style={styles.features}>
          <View style={styles.feature}>
            <Ionicons name="cash" size={24} color="#10b981" />
            <Text style={styles.featureText}>Win Real Money</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="stats-chart" size={24} color="#3b82f6" />
            <Text style={styles.featureText}>Multiple Polls</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="wallet" size={24} color="#f59e0b" />
            <Text style={styles.featureText}>Cash Wallet</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.loginButton} onPress={login}>
          <Ionicons name="logo-google" size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.loginButtonText}>Continue with Google</Text>
        </TouchableOpacity>
        
        <Text style={styles.terms}>By continuing, you agree to our Terms & Conditions</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
    maxWidth: 400,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 24,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
  features: {
    marginTop: 48,
    marginBottom: 48,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#475569',
    marginLeft: 12,
  },
  loginButton: {
    flexDirection: 'row',
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 300,
  },
  buttonIcon: {
    marginRight: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  terms: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 24,
    textAlign: 'center',
  },
});