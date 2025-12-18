// FILE: app/(tenant)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TenantLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray[400],

        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 0.5,
          borderTopColor: COLORS.gray[200],

          height: 60 + insets.bottom, // 👈 PUSH UP ABOVE SYSTEM BAR
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          paddingTop: 6,

          elevation: 10,
        },

        tabBarItemStyle: {
          justifyContent: 'center',
        },

        tabBarLabelStyle: {
          fontSize: 11,
          marginTop: 2,
        },

        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />

      

      {/* HIDDEN FROM TAB BAR - Still accessible via navigation */}
      <Tabs.Screen
        name="applications"
        options={{
          href: null, // 👈 HIDES FROM TAB BAR
          title: 'Applications',
        }}
      />

      {/* HIDDEN: Payments screen */}
      <Tabs.Screen
        name="payments"
        options={{
          href: null, // 👈 HIDES FROM TAB BAR
          title: 'Payments',
        }}
      />

      {/* HIDDEN: Individual property detail */}
      <Tabs.Screen
        name="property-details"
        options={{
          href: null, // 👈 HIDES FROM TAB BAR
          title: 'Property Details',
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}