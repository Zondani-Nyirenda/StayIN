// ========================================
// FILE: app/(tenant)/dashboard.tsx
// Tenant Dashboard - Clickable Colored Chips with Icons
// ========================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import TenantService from '../../services/tenantService';
import { COLORS } from '../../utils/constants';

export default function TenantDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    activeRentals: 0,
    pendingApplications: 0,
    openMaintenance: 0,
    upcomingPayments: 0,
  });

  // Track which chip is selected (for blue highlight)
  const [selectedChip, setSelectedChip] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    if (!user?.id) return;

    try {
      const [activeRentals, pendingApps, maintenanceRequests] = await Promise.all([
        TenantService.getActiveRentalCount(user.id),
        TenantService.getPendingApplicationsCount(user.id),
        TenantService.getMyMaintenanceRequests(user.id),
      ]);

      setStats({
        activeRentals,
        pendingApplications: pendingApps,
        openMaintenance: maintenanceRequests.filter(
          r => r.status === 'open' || r.status === 'in_progress'
        ).length,
        upcomingPayments: 1, // Replace with real calculation later
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  // Chip definitions with icon, label, count, color, and navigation
  const overviewChips = [
    {
      key: 'rentals',
      icon: 'home',
      label: 'Active Rentals',
      count: stats.activeRentals,
      color: '#4F46E5', // Indigo
      route: null, // No navigation yet
    },
    {
      key: 'applications',
      icon: 'document-text-outline',
      label: 'Pending Apps',
      count: stats.pendingApplications,
      color: '#F59E0B', // Amber
      route: '/(tenant)/applications',
    },
    {
      key: 'maintenance',
      icon: 'construct-outline',
      label: 'Open Issues',
      count: stats.openMaintenance,
      color: '#EF4444', // Red
      route: '/(tenant)/maintenance',
    },
    {
      key: 'payments',
      icon: 'card-outline',
      label: 'Due Soon',
      count: stats.upcomingPayments,
      color: '#10B981', // Green
      route: '/(tenant)/payments',
    },
  ];

  const quickActions = [
    { icon: 'home-outline', label: 'Browse Properties', route: '/(tenant)/properties' },
    { icon: 'document-text-outline', label: 'My Applications', route: '/(tenant)/applications' },
    { icon: 'card-outline', label: 'Payments', route: '/(tenant)/payments' },
    { icon: 'construct-outline', label: 'Maintenance', route: '/(tenant)/maintenance' },
  ];

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.fullName || 'Tenant'}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tenant)/profile')}>
          <Ionicons name="person-circle-outline" size={40} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Overview with Clickable Colored Chips */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.chipsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContent}
          >
            {overviewChips.map((chip) => (
              <TouchableOpacity
                key={chip.key}
                style={[
                  styles.compactChip,
                  selectedChip === chip.key && styles.compactChipActive,
                ]}
                onPress={() => {
                  setSelectedChip(chip.key);
                  if (chip.route) {
                    router.push(chip.route as any);
                  }
                }}
                activeOpacity={0.7}
              >
                <Ionicons name={chip.icon as any} size={16} color={chip.color} />
                <Text
                  style={[
                    styles.compactChipText,
                    selectedChip === chip.key && styles.compactChipTextActive,
                  ]}
                >
                  {chip.label}
                </Text>
                <Text
                  style={[
                    styles.compactChipCount,
                    selectedChip === chip.key && styles.compactChipCountActive,
                  ]}
                >
                  {chip.count}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionCard}
              onPress={() => router.push(action.route as any)}
            >
              <View style={styles.actionIcon}>
                <Ionicons name={action.icon as any} size={28} color={COLORS.primary} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Activity Placeholder */}
      <View style={styles.activitySection}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityPlaceholder}>
          <Text style={styles.placeholderText}>
            Your recent payments and applications will appear here
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    backgroundColor: COLORS.white,
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  greeting: { fontSize: 14, color: COLORS.gray[600] },
  userName: { fontSize: 24, fontWeight: '700', color: COLORS.gray[900], marginTop: 4 },

  statsSection: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.gray[900], marginBottom: 16 },

  chipsWrapper: { marginBottom: 8 },
  chipsContent: { gap: 8, paddingRight: 20, alignItems: 'center' },

  compactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    gap: 8,
  },
  compactChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  compactChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  compactChipTextActive: {
    color: COLORS.white,
  },
  compactChipCount: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.gray[500],
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    textAlign: 'center',
  },
  compactChipCountActive: {
    color: COLORS.white,
    backgroundColor: COLORS.white + '40',
  },

  actionsSection: { paddingHorizontal: 20, paddingBottom: 24 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: { fontSize: 13, fontWeight: '600', color: COLORS.gray[900], textAlign: 'center' },

  activitySection: { paddingHorizontal: 20, paddingBottom: 40 },
  activityPlaceholder: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  placeholderText: { fontSize: 14, color: COLORS.gray[500], textAlign: 'center' },
});