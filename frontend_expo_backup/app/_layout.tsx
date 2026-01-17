import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="poll/[poll_id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="payment" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="poll-history" options={{ presentation: 'card' }} />
        <Stack.Screen name="withdrawal-history" options={{ presentation: 'card' }} />
      </Stack>
    </AuthProvider>
  );
}