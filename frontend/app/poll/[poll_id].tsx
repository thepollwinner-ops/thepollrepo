import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Option {
  option_id: string;
  text: string;
  image_base64?: string;
}

interface Poll {
  poll_id: string;
  title: string;
  description: string;
  options: Option[];
  price_per_vote: number;
  status: string;
  result_option_id?: string;
}

export default function PollDetailScreen() {
  const { poll_id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [voteCount, setVoteCount] = useState('1');
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (poll_id) {
      fetchPoll();
    }
  }, [poll_id]);

  const fetchPoll = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/polls/${poll_id}`);
      setPoll(response.data);
    } catch (error) {
      console.error('Error fetching poll:', error);
      Alert.alert('Error', 'Failed to load poll');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseVotes = async () => {
    const count = parseInt(voteCount);
    if (isNaN(count) || count <= 0) {
      Alert.alert('Error', 'Please enter valid vote count');
      return;
    }

    if (!poll) return;

    try {
      setPurchasing(true);
      const response = await axios.post(
        `${BACKEND_URL}/api/polls/${poll_id}/purchase`,
        { poll_id, vote_count: count },
        { withCredentials: true }
      );

      const { payment_session_id } = response.data;
      
      // For test mode, simulate immediate success
      Alert.alert(
        'Payment Required',
        `Amount: ₹${count * poll.price_per_vote}\n\nIn test mode, payment would open Cashfree gateway. For now, votes are pending payment confirmation.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowPurchaseModal(false);
              Alert.alert('Success', 'Votes purchased! You can now cast your votes.');
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Purchase failed');
    } finally {
      setPurchasing(false);
    }
  };

  const handleVote = async () => {
    if (!selectedOption) {
      Alert.alert('Error', 'Please select an option');
      return;
    }

    const count = parseInt(voteCount);
    if (isNaN(count) || count <= 0) {
      Alert.alert('Error', 'Please enter valid vote count');
      return;
    }

    try {
      setVoting(true);
      await axios.post(
        `${BACKEND_URL}/api/polls/${poll_id}/vote`,
        { option_id: selectedOption, vote_count: count },
        { withCredentials: true }
      );

      Alert.alert('Success', 'Vote cast successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Voting failed');
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!poll) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Poll not found</Text>
      </View>
    );
  }

  const winningOption = poll.options.find(opt => opt.option_id === poll.result_option_id);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Poll Details</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.pollInfo}>
          <Text style={styles.title}>{poll.title}</Text>
          <Text style={styles.description}>{poll.description}</Text>
          
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="cash" size={16} color="#10b981" />
              <Text style={styles.metaText}>₹{poll.price_per_vote} per vote</Text>
            </View>
            <View style={[styles.metaItem, styles.statusBadge]}>
              <Text style={styles.statusText}>
                {poll.status === 'active' ? '🟢 Active' : '🔴 Closed'}
              </Text>
            </View>
          </View>
        </View>

        {winningOption && (
          <View style={styles.resultBanner}>
            <Ionicons name="trophy" size={24} color="#f59e0b" />
            <Text style={styles.resultText}>Winner: {winningOption.text}</Text>
          </View>
        )}

        <View style={styles.optionsSection}>
          <Text style={styles.sectionTitle}>Select Your Choice</Text>
          {poll.options.map((option) => (
            <TouchableOpacity
              key={option.option_id}
              style={[
                styles.optionCard,
                selectedOption === option.option_id && styles.optionCardSelected,
                poll.result_option_id === option.option_id && styles.optionCardWinner,
              ]}
              onPress={() => poll.status === 'active' && setSelectedOption(option.option_id)}
              disabled={poll.status !== 'active'}
            >
              <View style={styles.optionContent}>
                <Text style={styles.optionText}>{option.text}</Text>
                {selectedOption === option.option_id && (
                  <Ionicons name="checkmark-circle" size={24} color="#6366f1" />
                )}
                {poll.result_option_id === option.option_id && (
                  <Ionicons name="trophy" size={24} color="#f59e0b" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {poll.status === 'active' && (
          <View style={styles.actionSection}>
            <Text style={styles.inputLabel}>Number of Votes</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter number of votes"
              keyboardType="number-pad"
              value={voteCount}
              onChangeText={setVoteCount}
            />
            <Text style={styles.amountText}>
              Amount: ₹{(parseInt(voteCount) || 0) * poll.price_per_vote}
            </Text>

            <TouchableOpacity
              style={styles.purchaseButton}
              onPress={() => setShowPurchaseModal(true)}
            >
              <Ionicons name="cart" size={20} color="#fff" />
              <Text style={styles.buttonText}>Purchase Votes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.voteButton, voting && styles.buttonDisabled]}
              onPress={handleVote}
              disabled={voting || !selectedOption}
            >
              {voting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Cast Vote</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showPurchaseModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPurchaseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Purchase Votes</Text>
              <TouchableOpacity onPress={() => setShowPurchaseModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.purchaseDetails}>
              <Text style={styles.detailText}>Poll: {poll.title}</Text>
              <Text style={styles.detailText}>Votes: {voteCount}</Text>
              <Text style={styles.detailText}>
                Amount: ₹{(parseInt(voteCount) || 0) * poll.price_per_vote}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.confirmButton, purchasing && styles.buttonDisabled]}
              onPress={handlePurchaseVotes}
              disabled={purchasing}
            >
              {purchasing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Proceed to Payment</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  pollInfo: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 4,
  },
  statusBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#475569',
  },
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  resultText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginLeft: 12,
  },
  optionsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  optionCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  optionCardSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  optionCardWinner: {
    borderColor: '#f59e0b',
    backgroundColor: '#fffbeb',
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  actionSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 16,
  },
  purchaseButton: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  voteButton: {
    flexDirection: 'row',
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  purchaseDetails: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  detailText: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 8,
  },
  confirmButton: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
});
