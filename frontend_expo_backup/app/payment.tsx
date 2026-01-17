import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  BackHandler,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function PaymentScreen() {
  const params = useLocalSearchParams<{
    order_id: string;
    payment_session_id: string;
    amount: string;
    poll_id: string;
    option_id: string;
    vote_count: string;
    return_url: string;
  }>();
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed'>('pending');

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!paymentComplete) {
        Alert.alert(
          'Cancel Payment?',
          'Are you sure you want to cancel this payment?',
          [
            { text: 'No', style: 'cancel' },
            { text: 'Yes', onPress: () => router.back() },
          ]
        );
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [paymentComplete]);

  // Generate the Cashfree checkout HTML
  const getCheckoutHTML = () => {
    const environment = 'sandbox'; // or 'production'
    const paymentSessionId = params.payment_session_id;
    const orderId = params.order_id;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8fafc;
            min-height: 100vh;
          }
          .loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
          }
          .spinner {
            width: 50px;
            height: 50px;
            border: 4px solid #e2e8f0;
            border-top: 4px solid #6366f1;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .loading-text {
            margin-top: 20px;
            color: #64748b;
            font-size: 16px;
          }
          .error {
            color: #ef4444;
            text-align: center;
            padding: 20px;
          }
        </style>
        <script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
      </head>
      <body>
        <div class="loading" id="loading">
          <div class="spinner"></div>
          <p class="loading-text">Loading payment options...</p>
        </div>
        
        <script>
          const cashfree = Cashfree({
            mode: "${environment === 'production' ? 'production' : 'sandbox'}"
          });

          const checkoutOptions = {
            paymentSessionId: "${paymentSessionId}",
            redirectTarget: "_self"
          };

          // Start checkout
          cashfree.checkout(checkoutOptions).then(function(result) {
            if (result.error) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'PAYMENT_ERROR',
                error: result.error.message
              }));
            }
            if (result.redirect) {
              // Payment redirect happened
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'PAYMENT_REDIRECT',
                data: result
              }));
            }
            if (result.paymentDetails) {
              // Payment completed
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'PAYMENT_SUCCESS',
                data: result.paymentDetails
              }));
            }
          }).catch(function(error) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'PAYMENT_ERROR',
              error: error.message || 'Payment failed'
            }));
          });
        </script>
      </body>
      </html>
    `;
  };

  // Handle messages from WebView
  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('WebView message:', data);

      if (data.type === 'PAYMENT_SUCCESS') {
        setPaymentComplete(true);
        setPaymentStatus('success');
        
        // Cast the vote
        try {
          await axios.post(
            `${BACKEND_URL}/api/polls/${params.poll_id}/vote`,
            {
              option_id: params.option_id,
              vote_count: parseInt(params.vote_count || '1'),
            },
            { withCredentials: true }
          );

          Alert.alert('Success! 🎉', 'Payment successful and your vote has been cast!', [
            { text: 'OK', onPress: () => router.replace('/(tabs)') },
          ]);
        } catch (error: any) {
          Alert.alert('Payment Successful', 'Payment was successful but there was an issue casting your vote. Please contact support.', [
            { text: 'OK', onPress: () => router.replace('/(tabs)') },
          ]);
        }
      } else if (data.type === 'PAYMENT_ERROR') {
        setPaymentComplete(true);
        setPaymentStatus('failed');
        Alert.alert('Payment Failed', data.error || 'Payment could not be completed', [
          { text: 'Try Again', onPress: () => router.back() },
          { text: 'Cancel', onPress: () => router.replace('/(tabs)') },
        ]);
      } else if (data.type === 'PAYMENT_REDIRECT') {
        // Handle redirect case
        console.log('Payment redirect:', data);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  // Handle navigation state change to detect return URL
  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    console.log('Navigation:', navState.url);
    
    // Check if we hit the return URL (payment callback)
    if (navState.url.includes('/api/payment/callback')) {
      setPaymentComplete(true);
      
      // Parse the URL to check status
      const url = new URL(navState.url);
      const pollId = url.searchParams.get('poll_id');
      
      // Show success and cast vote
      handlePaymentCallback();
    }
  };

  const handlePaymentCallback = async () => {
    try {
      // Cast the vote after payment
      await axios.post(
        `${BACKEND_URL}/api/polls/${params.poll_id}/vote`,
        {
          option_id: params.option_id,
          vote_count: parseInt(params.vote_count || '1'),
        },
        { withCredentials: true }
      );

      setPaymentStatus('success');
      Alert.alert('Success! 🎉', 'Payment successful and your vote has been cast!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') },
      ]);
    } catch (error: any) {
      // Payment might be successful but vote failed
      setPaymentStatus('success');
      Alert.alert(
        'Payment Complete',
        'If your payment was successful, tap "Cast Vote" to submit your vote.',
        [
          {
            text: 'Cast Vote',
            onPress: async () => {
              try {
                await axios.post(
                  `${BACKEND_URL}/api/polls/${params.poll_id}/vote`,
                  {
                    option_id: params.option_id,
                    vote_count: parseInt(params.vote_count || '1'),
                  },
                  { withCredentials: true }
                );
                Alert.alert('Success!', 'Your vote has been cast!', [
                  { text: 'OK', onPress: () => router.replace('/(tabs)') },
                ]);
              } catch (e: any) {
                Alert.alert('Error', e.response?.data?.detail || 'Failed to cast vote');
              }
            },
          },
          { text: 'Go Home', onPress: () => router.replace('/(tabs)') },
        ]
      );
    }
  };

  // If no payment session, show error
  if (!params.payment_session_id) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment</Text>
        </View>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle" size={64} color="#ef4444" />
          <Text style={styles.errorText}>Payment session not found</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            if (!paymentComplete) {
              Alert.alert(
                'Cancel Payment?',
                'Are you sure you want to cancel this payment?',
                [
                  { text: 'No', style: 'cancel' },
                  { text: 'Yes', onPress: () => router.back() },
                ]
              );
            } else {
              router.back();
            }
          }} 
          style={styles.backButton}
        >
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complete Payment</Text>
        <View style={styles.amountBadge}>
          <Text style={styles.amountText}>₹{params.amount}</Text>
        </View>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading payment...</Text>
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ html: getCheckoutHTML() }}
        style={styles.webview}
        onLoadEnd={() => setLoading(false)}
        onMessage={handleMessage}
        onNavigationStateChange={handleNavigationStateChange}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        mixedContentMode="always"
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        originWhitelist={['*']}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error:', nativeEvent);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  amountBadge: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  amountText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  webview: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#64748b',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 16,
    color: '#64748b',
    fontSize: 16,
  },
});
