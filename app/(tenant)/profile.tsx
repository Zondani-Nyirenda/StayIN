import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

// Professional Neutral Palette
const NEUTRAL = {
  white: '#FFFFFF',
  surface: '#F8F9FA',
  border: '#EEEEEE',
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  textHint: '#999999',
  danger: '#DC3545',
  dark: '#212529',
};

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.replace('../(auth)/login');
  };

  const menuItems = [
    { icon: 'person-outline', title: 'Edit Profile' },
    { icon: 'settings-outline', title: 'Settings' },
    { icon: 'help-circle-outline', title: 'Help & Support' },
    { icon: 'information-circle-outline', title: 'About' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.header}>Account</Text>

        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.fullName?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.fullName || 'User Name'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'user@email.com'}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>TENANT</Text>
            </View>
          </View>
        </View>

        {/* Section Label */}
        <Text style={styles.sectionLabel}>PREFERENCES</Text>

        {/* Menu Items */}
        <View style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={[
                styles.menuItem, 
                index === menuItems.length - 1 && { borderBottomWidth: 0 }
              ]}
            >
              <View style={styles.menuLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name={item.icon as any} size={20} color={NEUTRAL.textPrimary} />
                </View>
                <Text style={styles.menuTitle}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={NEUTRAL.textHint} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={NEUTRAL.danger} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
        
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NEUTRAL.surface,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    fontSize: 32,
    fontWeight: '800',
    color: NEUTRAL.textPrimary,
    marginBottom: 32,
    letterSpacing: -0.5,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NEUTRAL.white,
    padding: 20,
    borderRadius: 20,
    marginBottom: 32,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: NEUTRAL.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: NEUTRAL.white,
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: NEUTRAL.textPrimary,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: NEUTRAL.textSecondary,
    marginBottom: 8,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: NEUTRAL.border,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '800',
    color: NEUTRAL.textHint,
    letterSpacing: 1,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: NEUTRAL.textHint,
    marginBottom: 12,
    marginLeft: 4,
    letterSpacing: 1,
  },
  menuCard: {
    backgroundColor: NEUTRAL.white,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: NEUTRAL.border,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: NEUTRAL.border,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    alignItems: 'center',
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: NEUTRAL.textPrimary,
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: NEUTRAL.white,
    borderWidth: 1,
    borderColor: NEUTRAL.border,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: NEUTRAL.danger,
    marginLeft: 8,
  },
  versionText: {
    textAlign: 'center',
    color: NEUTRAL.textHint,
    fontSize: 12,
    marginTop: 24,
  }
});