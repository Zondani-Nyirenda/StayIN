// ========================================
// FILE: app/(tenant)/_layout.tsx
// 4 Tabs only: Home • Properties • Maintenance • More
// ========================================
import React, { useState } from 'react';
import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { COLORS } from '../../utils/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TenantLayout() {
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);

  const moreItems = [
    { name: 'applications', label: 'My Applications', icon: 'document-text-outline' },
    { name: 'payments',     label: 'Payments',         icon: 'card-outline' },
    { name: 'agreements',   label: 'Agreements',       icon: 'file-tray-full-outline' },
    { name: 'profile',      label: 'Profile',          icon: 'person-outline' },
  ];

  // Custom "More" tab button
  const MoreTabButton = ({ focused }: { focused: boolean }) => (
    <TouchableOpacity
      style={styles.moreTab}
      onPress={() => setModalVisible(true)}
    >
      <Ionicons
        name={focused ? 'apps' : 'apps-outline'}
        size={28}
        color={focused ? COLORS.primary : COLORS.gray[500]}
      />
      <Text
        style={[
          styles.tabLabel,
          { color: focused ? COLORS.primary : COLORS.gray[500] },
        ]}
      >
        More
      </Text>
    </TouchableOpacity>
  );

  return (
    <>
      <Tabs
        initialRouteName="dashboard"
        screenOptions={{
          headerShown: false,
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
        }}
      >
        {/* 1. Home */}
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={28}
                color={color}
              />
            ),
          }}
        />

        {/* 2. Properties */}
        <Tabs.Screen
          name="properties"
          options={{
            title: 'Properties',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'search' : 'search-outline'}
                size={28}
                color={color}
              />
            ),
          }}
        />

        {/* 3. Maintenance */}
        <Tabs.Screen
          name="maintenance"
          options={{
            title: 'Maintenance',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'construct' : 'construct-outline'}
                size={28}
                color={color}
              />
            ),
          }}
        />

        {/* 4. More – custom button */}
        <Tabs.Screen
          name="more"
          options={{
            title: 'More',
            tabBarButton: (props) => <MoreTabButton focused={props.accessibilityState?.selected || false} />,
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setModalVisible(true);
            },
          }}
        />

        {/* Hidden screens – accessible only via navigation or More menu */}
        <Tabs.Screen name="applications" options={{ href: null }} />
        <Tabs.Screen name="payments" options={{ href: null }} />
        <Tabs.Screen name="agreements" options={{ href: null }} />
        <Tabs.Screen name="profile" options={{ href: null }} />
        <Tabs.Screen name="property-detail" options={{ href: null }} />
      </Tabs>

      {/* More Menu Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>More</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color={COLORS.gray[700]} />
              </TouchableOpacity>
            </View>

            <View style={styles.menuList}>
              {moreItems.map((item) => (
                <TouchableOpacity
                  key={item.name}
                  style={styles.menuItem}
                  onPress={() => {
                    setModalVisible(false);
                    // Fixed navigation path - use relative path within the same tab group
                    router.push(`../(tenant)/${item.name}`);
                  }}
                >
                  <Ionicons name={item.icon as any} size={24} color={COLORS.primary} />
                  <Text style={styles.menuItemText}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  moreTab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  menuList: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 20,
  },
  menuItemText: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
    color: COLORS.gray[900],
  },
});