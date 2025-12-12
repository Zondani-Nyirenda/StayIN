// app/index.tsx
import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../utils/constants';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/login'); // Correct
    } else if (user && inAuthGroup) {
      // Fix: Use actual route names, NOT relative paths!
      if (user.role === 'tenant') {
        router.replace('/(tenant)');
      } else if (user.role === 'landlord') {
        router.replace('../(landlord)');
      } else if (user.role === 'admin') {
        router.replace('../(admin)');
      } else {
        router.replace('/(tenant)'); // fallback
      }
    }
  }, [user, loading, segments, router]);

  // Show loader only while auth is initializing
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return null; // This screen should never render UI — it only redirects
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
});