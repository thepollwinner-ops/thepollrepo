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
  const params = useLocalSearchParams<{ poll_id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [voteCount, setVoteCount] = useState('1');
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const pollId = Array.isArray(params.poll_id) ? params.poll_id[0] : params.poll_id;
    console.log('Poll ID from params:', pollId);
    if (pollId) {
      fetchPoll(pollId);
    } else {
      setLoading(false);
      Alert.alert('Error', 'Poll ID not found');
    }
  }, [params.poll_id]);

  const fetchPoll = async (pollId: string) => {
    try {
      console.log('Fetching poll with ID:', pollId);
      console.log('Backend URL:', BACKEND_URL);
      const response = await axios.get(`${BACKEND_URL}/api/polls/${pollId}`);
      console.log('Poll data received:', response.data);
      setPoll(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching poll:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load poll');
    }
  };

  const handleLetsVote = async () => {
    if (!selectedOption) {
      Alert.alert('Error', 'Please select an option first');
      return;
    }

    const count = parseInt(voteCount);
    if (isNaN(count) || count <= 0) {
      Alert.alert('Error', 'Please enter valid vote count');
      return;
    }

    if (!poll) return;

    setShowVoteModal(true);
  };

  const confirmVote = async () => {
    const count = parseInt(voteCount);
    const pollId = Array.isArray(params.poll_id) ? params.poll_id[0] : params.poll_id;
    
    console.log('Starting vote process...', { pollId, count, selectedOption });
    
    if (!selectedOption) {
      Alert.alert('Error', 'Please select an option');
      return;
    }

    try {
      setProcessing(true);
      
      console.log('Initiating purchase...');
      // Step 1: Purchase votes (initiate payment)
      const purchaseResponse = await axios.post(
        `${BACKEND_URL}/api/polls/${pollId}/purchase`,
        { poll_id: pollId, vote_count: count },
        { withCredentials: true }
      );

      console.log('Purchase response:', purchaseResponse.data);

      // Step 2: Cast vote immediately (simulating successful payment for testing)
      console.log('Casting vote...');
      const voteResponse = await axios.post(
        `${BACKEND_URL}/api/polls/${pollId}/vote`,
        { option_id: selectedOption, vote_count: count },
        { withCredentials: true }
      );

      console.log('Vote response:', voteResponse.data);

      setShowVoteModal(false);
      setProcessing(false);
      
      Alert.alert('Success! 🎉', 'Your vote has been cast successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Vote process error:', error);
      console.error('Error details:', error.response?.data);
      setProcessing(false);
      
      const errorMessage = error.response?.data?.detail || error.message || 'Process failed';
      Alert.alert('Error', errorMessage);
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
              style={[styles.letsVoteButton, (!selectedOption || processing) && styles.buttonDisabled]}
              onPress={handleLetsVote}
              disabled={!selectedOption || processing}
            >
              {processing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Let's Vote</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showVoteModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowVoteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Your Vote</Text>
              <TouchableOpacity onPress={() => setShowVoteModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.voteDetails}>
              <Text style={styles.detailText}>📊 Poll: {poll.title}</Text>
              <Text style={styles.detailText}>
                ✅ Your Choice: {poll.options.find(o => o.option_id === selectedOption)?.text}
              </Text>
              <Text style={styles.detailText}>🗳️ Votes: {voteCount}</Text>
              <Text style={styles.detailText}>
                💰 Amount: ₹{(parseInt(voteCount) || 0) * poll.price_per_vote}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.confirmButton, processing && styles.buttonDisabled]}
              onPress={confirmVote}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Confirm & Pay</Text>
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
  letsVoteButton: {
    flexDirection: 'row',
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voteButton: {
    flexDirection: 'row',
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voteDetails: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
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
