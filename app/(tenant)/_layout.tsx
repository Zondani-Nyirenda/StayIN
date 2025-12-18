// ========================================
// FILE: app/(tenant)/_layout.tsx
// Tenant Tab Layout - Only 4 Tabs: Home, Properties, Maintenance, Profile
// ========================================
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TenantLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray[500],
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.gray[200],
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom || 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerShown: false,
      }}
    >
   


    

    

      {/* HIDDEN SCREENS - Accessible via navigation only */}
      <Tabs.Screen name="applications" options={{ href: null }} />
      <Tabs.Screen name="payments" options={{ href: null }} />
      <Tabs.Screen name="property-detail" options={{ href: null }} />
    </Tabs>
  );
}