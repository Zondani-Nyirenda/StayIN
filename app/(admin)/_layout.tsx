// ========================================
// FILE: app/(admin)/_layout.tsx
// Updated Admin Layout with All Screens
// ========================================
import { Stack } from 'expo-router';
import { COLORS } from '../../utils/constants';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="users" />
      <Stack.Screen name="properties" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="applications" />
      <Stack.Screen name="maintenance" />
    </Stack>
  );
}