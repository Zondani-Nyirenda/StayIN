// ========================================
// FILE: app/(tenant)/dashboard.tsx
// Tenant Dashboard - With Recent Activity Display & Profile Image
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
  SafeAreaView,
  Platform,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import TenantService from '../../services/tenantService';
import { COLORS } from '../../utils/constants';
import { LinearGradient } from 'expo-linear-gradient';

// StayIN Brand Colors
const STAYIN = {
  primaryBlue: '#1E40AF',
  green: '#00AA00',
  orange: '#FFAA00',
  dark: '#000000',
  white: '#FFFFFF',
};

type RecentActivity = {
  id: string;
  type: 'payment' | 'application';
  title: string;
  subtitle: string;
  amount?: number;
  status: string;
  date: string;
  icon: string;
  iconColor: string;
  iconBg: string;
};

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
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [selectedChip, setSelectedChip] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    if (!user?.id) return;

    try {
      const [activeRentals, pendingApps, maintenanceRequests, payments, applications] = await Promise.all([
        TenantService.getActiveRentalCount(user.id),
        TenantService.getPendingApplicationsCount(user.id),
        TenantService.getMyMaintenanceRequests(user.id),
        TenantService.getPaymentHistory(user.id),
        TenantService.getMyApplications(user.id),
      ]);

      setStats({
        activeRentals,
        pendingApplications: pendingApps,
        openMaintenance: maintenanceRequests.filter(
          r => r.status === 'open' || r.status === 'in_progress'
        ).length,
        upcomingPayments: 1,
      });

      // Combine and format recent activity
      const activity: RecentActivity[] = [];

      // Add recent payments (last 5)
      payments.slice(0, 5).forEach((payment) => {
        activity.push({
          id: `payment-${payment.id}`,
          type: 'payment',
          title: payment.property_title,
          subtitle: `${payment.payment_type.replace('_', ' ').toUpperCase()} • ${payment.status}`,
          amount: payment.amount,
          status: payment.status,
          date: payment.created_at,
          icon: 'card',
          iconColor: payment.status === 'completed' ? STAYIN.green : STAYIN.orange,
          iconBg: payment.status === 'completed' ? STAYIN.green + '20' : STAYIN.orange + '20',
        });
      });

      // Add recent applications (last 5)
      applications.slice(0, 5).forEach((app) => {
        activity.push({
          id: `app-${app.id}`,
          type: 'application',
          title: app.property_title,
          subtitle: `Application • ${app.status}`,
          status: app.status,
          date: app.created_at,
          icon: 'document-text',
          iconColor: 
            app.status === 'approved' ? STAYIN.green :
            app.status === 'rejected' ? '#EF4444' : STAYIN.orange,
          iconBg: 
            app.status === 'approved' ? STAYIN.green + '20' :
            app.status === 'rejected' ? '#EF444420' : STAYIN.orange + '20',
        });
      });

      // Sort by date (most recent first)
      activity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setRecentActivity(activity.slice(0, 8)); // Keep top 8 items
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const overviewChips = [
    {
      key: 'rentals',
      icon: 'home',
      label: 'Active Rentals',
      count: stats.activeRentals,
      color: STAYIN.primaryBlue,
      tint: STAYIN.primaryBlue + '20',
      route: null,
    },
    {
      key: 'applications',
      icon: 'document-text-outline',
      label: 'Pending Apps',
      count: stats.pendingApplications,
      color: STAYIN.orange,
      tint: STAYIN.orange + '20',
      route: '/(tenant)/applications',
    },
    {
      key: 'maintenance',
      icon: 'construct-outline',
      label: 'Open Issues',
      count: stats.openMaintenance,
      color: STAYIN.green,
      tint: STAYIN.green + '20',
      route: '/(tenant)/maintenance',
    },
    {
      key: 'payments',
      icon: 'card-outline',
      label: 'Due Soon',
      count: stats.upcomingPayments,
      color: '#6366F1',
      tint: '#6366F120',
      route: '/(tenant)/payments',
    },
  ];

  const quickActions = [
    { 
      icon: 'home-outline', 
      label: 'Browse Properties', 
      route: '/(tenant)/properties',
      color: '#10B981',
      bgColor: '#10B98120'
    },
    { 
      icon: 'document-text-outline', 
      label: 'My Applications', 
      route: '/(tenant)/applications',
      color: '#F59E0B',
      bgColor: '#F59E0B20'
    },
    { 
      icon: 'card-outline', 
      label: 'Payments', 
      route: '/(tenant)/payments',
      color: '#3B82F6',
      bgColor: '#3B82F620'
    },
    { 
      icon: 'construct-outline', 
      label: 'Maintenance', 
      route: '/(tenant)/maintenance',
      color: '#8B5CF6',
      bgColor: '#8B5CF620'
    },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={STAYIN.primaryBlue} />
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar style="light" backgroundColor="transparent" translucent />

      <SafeAreaView style={styles.safeArea}>
        {/* Branded Header */}
        <LinearGradient
          colors={[STAYIN.primaryBlue, '#0F172A']}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.userName}>{user?.fullName || 'Tenant'}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tenant)/profile')}>
              {user?.profileImage ? (
                <Image 
                  source={{ uri: user.profileImage }} 
                  style={styles.profileImage}
                />
              ) : (
                <Ionicons name="person-circle-outline" size={44} color={STAYIN.white} />
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Overview Chips */}
          {/* <View style={styles.statsSection}>
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
                      { backgroundColor: chip.tint },
                    ]}
                    onPress={() => {
                      setSelectedChip(chip.key);
                      if (chip.route) {
                        router.push(chip.route as any);
                      }
                    }}
                    activeOpacity={0.8}
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
          </View> */}

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
                  <View style={[styles.actionIcon, { backgroundColor: action.bgColor }]}>
                    <Ionicons name={action.icon as any} size={28} color={action.color} />
                  </View>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.activitySection}>
            <View style={styles.activityHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <TouchableOpacity onPress={() => router.push('/(tenant)/payments')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            {recentActivity.length === 0 ? (
              <View style={styles.activityPlaceholder}>
                <Ionicons name="time-outline" size={48} color={COLORS.gray[400]} />
                <Text style={styles.placeholderText}>
                  Your recent payments and applications will appear here
                </Text>
              </View>
            ) : (
              <View style={styles.activityList}>
                {recentActivity.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.activityItem}
                    onPress={() => {
                      if (item.type === 'payment') {
                        router.push('/(tenant)/payments');
                      } else {
                        router.push('/(tenant)/applications');
                      }
                    }}
                  >
                    <View style={[styles.activityIconContainer, { backgroundColor: item.iconBg }]}>
                      <Ionicons name={item.icon as any} size={24} color={item.iconColor} />
                    </View>
                    
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.activitySubtitle}>{item.subtitle}</Text>
                    </View>
                    
                    <View style={styles.activityRight}>
                      {item.amount !== undefined && (
                        <Text style={styles.activityAmount}>
                          K{item.amount.toLocaleString()}
                        </Text>
                      )}
                      <Text style={styles.activityDate}>{formatDate(item.date)}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },

  headerGradient: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 15,
    color: STAYIN.white,
    opacity: 0.9,
  },
  userName: {
    fontSize: 26,
    fontWeight: '800',
    color: STAYIN.white,
    marginTop: 4,
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: STAYIN.white,
  },

  scrollContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  statsSection: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.gray[900], marginBottom: 16 },

  chipsWrapper: { marginBottom: 8 },
  chipsContent: { gap: 8, paddingRight: 20, alignItems: 'center' },

  compactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 8,
  },
  compactChipActive: {
    backgroundColor: STAYIN.primaryBlue,
    borderColor: STAYIN.primaryBlue,
  },
  compactChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  compactChipTextActive: {
    color: STAYIN.white,
  },
  compactChipCount: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.gray[600],
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    textAlign: 'center',
  },
  compactChipCountActive: {
    color: STAYIN.white,
    backgroundColor: STAYIN.white + '40',
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
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: { fontSize: 13, fontWeight: '600', color: COLORS.gray[900], textAlign: 'center' },

  activitySection: { paddingHorizontal: 20, paddingBottom: 40 },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: STAYIN.primaryBlue,
  },
  activityPlaceholder: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    gap: 12,
  },
  placeholderText: { 
    fontSize: 14, 
    color: COLORS.gray[500], 
    textAlign: 'center',
  },

  activityList: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  activityIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
    gap: 4,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  activitySubtitle: {
    fontSize: 13,
    color: COLORS.gray[500],
    textTransform: 'capitalize',
  },
  activityRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: STAYIN.green,
  },
  activityDate: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
});