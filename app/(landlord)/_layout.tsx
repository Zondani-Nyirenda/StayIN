// app/(landlord)/_layout.tsx
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

export default function LandlordLayout() {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user || user.role !== 'landlord') {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="properties" />
      <Stack.Screen name="add-property" />
      <Stack.Screen name="tenants" />
      <Stack.Screen name="applications" />
      <Stack.Screen name="maintenance" />
      <Stack.Screen name="financials" />
    </Stack>
  );
}