// ========================================
// FILE: app/(auth)/_layout.tsx
// ========================================
import { Stack } from 'expo-router';
import { COLORS } from '../../utils/constants';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.white },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="role-selection" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}