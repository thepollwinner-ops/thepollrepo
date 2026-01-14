import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Poll {
  poll_id: string;
  title: string;
  description: string;
  options: Array<{ option_id: string; text: string; image_base64?: string }>;
  price_per_vote: number;
  status: string;
  result_option_id?: string;
}

export default function PollsScreen() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/polls`);
      setPolls(response.data);
    } catch (error) {
      console.error('Error fetching polls:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPolls();
  };

  const renderPoll = ({ item }: { item: Poll }) => (
    <TouchableOpacity
      style={styles.pollCard}
      onPress={() => router.push(`/poll/${item.poll_id}` as any)}
    >
      <View style={styles.pollHeader}>
        <Text style={styles.pollTitle}>{item.title}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {item.status === 'active' ? '🟢 Active' : '🔴 Closed'}
          </Text>
        </View>
      </View>
      <Text style={styles.pollDescription} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.pollFooter}>
        <View style={styles.priceTag}>
          <Ionicons name="cash" size={16} color="#10b981" />
          <Text style={styles.priceText}>₹{item.price_per_vote} per vote</Text>
        </View>
        <View style={styles.optionsTag}>
          <Ionicons name="options" size={16} color="#6366f1" />
          <Text style={styles.optionsText}>{item.options.length} options</Text>
        </View>
      </View>
      {item.result_option_id && (
        <View style={styles.resultBanner}>
          <Ionicons name="trophy" size={16} color="#f59e0b" />
          <Text style={styles.resultText}>Result Declared!</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {polls.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="document-text-outline" size={64} color="#cbd5e1" />
          <Text style={styles.emptyText}>No polls available</Text>
        </View>
      ) : (
        <FlashList
          data={polls}
          renderItem={renderPoll}
          estimatedItemSize={150}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366f1']} />
          }
        />
      )}
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
  listContent: {
    padding: 16,
  },
  pollCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pollHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  pollTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#475569',
  },
  pollDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  pollFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 4,
  },
  optionsTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionsText: {
    fontSize: 14,
    color: '#6366f1',
    marginLeft: 4,
  },
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  resultText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
    marginLeft: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 16,
  },
});