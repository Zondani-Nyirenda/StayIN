// app/_layout.tsx
import { Stack, Redirect } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { ActivityIndicator, View, Text } from 'react-native';
import { useFonts } from 'expo-font';
import databaseService from '../services/database';

// Prevent splash screen from hiding too early
SplashScreen.preventAutoHideAsync();

function InitialRouter() {
  const { user, loading: authLoading, loadUser } = useAuth();
  const [dbReady, setDbReady] = useState(false);
  const [userChecked, setUserChecked] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    // Add more fonts if needed
  });

  // Initialize database
  useEffect(() => {
    async function initDb() {
      try {
        await databaseService.init();
        setDbReady(true);
      } catch (error) {
        console.error('Database initialization failed:', error);
      }
    }
    initDb();
  }, []);

  // Load user once when DB and fonts are ready
  useEffect(() => {
    if (dbReady && fontsLoaded && !fontError && !userChecked) {
      loadUser().finally(() => setUserChecked(true));
    }
  }, [dbReady, fontsLoaded, fontError, userChecked, loadUser]);

  const appReady = dbReady && fontsLoaded && !authLoading && !fontError && userChecked;

  // Hide splash screen when fully ready
  useEffect(() => {
    if (appReady) {
      SplashScreen.hideAsync();
    }
  }, [appReady]);

  // Show loading screen while initializing
  if (!appReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#0066ff" />
        <Text style={{ marginTop: 20, fontSize: 16, color: '#333' }}>Loading StayIN...</Text>
      </View>
    );
  }

  // Redirect logic
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  switch (user.role) {
    case 'admin':
      return <Redirect href="/(admin)/dashboard" />;
    case 'landlord':
      return <Redirect href="/(landlord)/dashboard" />;
    case 'tenant':
    default:
      return <Redirect href="/(tenant)/dashboard" />;
  }
}

// Root Layout – wraps entire app
export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialRouter />
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}