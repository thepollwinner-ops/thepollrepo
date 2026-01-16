import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface VotedOption {
  option_id: string;
  option_text: string;
  vote_count: number;
  amount: number;
}

interface MyPoll {
  poll_id: string;
  title: string;
  description: string;
  status: string;
  price_per_vote: number;
  total_votes: number;
  total_spent: number;
  voted_options: VotedOption[];
  result_status: string;
  winning_amount: number;
  winning_option_id?: string;
}

export default function PollHistoryScreen() {
  const router = useRouter();
  const [myPolls, setMyPolls] = useState<MyPoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMyPolls();
  }, []);

  const fetchMyPolls = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/my-polls`, {
        withCredentials: true,
      });
      setMyPolls(response.data);
    } catch (error) {
      console.error('Error fetching my polls:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyPolls();
  };

  const getResultBadge = (poll: MyPoll) => {
    if (poll.status !== 'closed') {
      return (
        <View style={[styles.resultBadge, styles.pendingBadge]}>
          <Ionicons name="time" size={14} color="#f59e0b" />
          <Text style={styles.pendingText}>In Progress</Text>
        </View>
      );
    }

    if (poll.result_status === 'won') {
      return (
        <View style={[styles.resultBadge, styles.wonBadge]}>
          <Ionicons name="trophy" size={14} color="#10b981" />
          <Text style={styles.wonText}>Won ₹{poll.winning_amount.toFixed(2)}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.resultBadge, styles.lostBadge]}>
        <Ionicons name="close-circle" size={14} color="#ef4444" />
        <Text style={styles.lostText}>Lost</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Polls</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {myPolls.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="bar-chart-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyText}>You haven't participated in any polls yet</Text>
          </View>
        ) : (
          myPolls.map((poll) => (
            <TouchableOpacity
              key={poll.poll_id}
              style={styles.pollCard}
              onPress={() => router.push(`/poll/${poll.poll_id}` as any)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.pollTitle} numberOfLines={2}>{poll.title}</Text>
                {getResultBadge(poll)}
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{poll.total_votes}</Text>
                  <Text style={styles.statLabel}>Votes</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>₹{poll.total_spent.toFixed(2)}</Text>
                  <Text style={styles.statLabel}>Spent</Text>
                </View>
                <View style={styles.statItem}>
                  <View style={[styles.statusDot, { backgroundColor: poll.status === 'active' ? '#10b981' : '#94a3b8' }]} />
                  <Text style={styles.statLabel}>{poll.status === 'active' ? 'Active' : 'Closed'}</Text>
                </View>
              </View>

              <View style={styles.votedSection}>
                <Text style={styles.votedLabel}>Your Votes:</Text>
                {poll.voted_options.map((vo, idx) => (
                  <View key={idx} style={styles.votedOption}>
                    <Text style={styles.votedOptionText}>{vo.option_text}</Text>
                    <Text style={styles.votedOptionVotes}>{vo.vote_count} vote(s)</Text>
                  </View>
                ))}
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.viewDetails}>View Details</Text>
                <Ionicons name="chevron-forward" size={16} color="#6366f1" />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 16,
    textAlign: 'center',
  },
  pollCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  pollTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
    marginRight: 8,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pendingBadge: {
    backgroundColor: '#fef3c7',
  },
  wonBadge: {
    backgroundColor: '#d1fae5',
  },
  lostBadge: {
    backgroundColor: '#fee2e2',
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
    marginLeft: 4,
  },
  wonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 4,
  },
  lostText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  votedSection: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  votedLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  votedOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  votedOptionText: {
    fontSize: 14,
    color: '#1e293b',
  },
  votedOptionVotes: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  viewDetails: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
});
