import { useEffect, useState } from 'react';
import { Stack, Redirect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { useFonts } from 'expo-font';
import databaseService from '../services/database';

SplashScreen.preventAutoHideAsync();

function Bootstrap() {
  const { user, loading: authLoading } = useAuth();
  const [dbReady, setDbReady] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    async function init() {
      await databaseService.init();
      setDbReady(true);
    }
    init();
  }, []);

  const ready = fontsLoaded && dbReady && !authLoading && !fontError;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) return <Redirect href="/(auth)/login" />;

  if (user.role === 'admin') return <Redirect href="/(admin)/dashboard" />;
  if (user.role === 'landlord') return <Redirect href="/(landlord)/dashboard" />;
  return <Redirect href="/(tenant)/dashboard" />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
      <Bootstrap />
    </AuthProvider>
  );
}
