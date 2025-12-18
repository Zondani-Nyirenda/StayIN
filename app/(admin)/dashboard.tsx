// ========================================
// FILE: app/(admin)/dashboard.tsx
// Enhanced Admin Dashboard with Real Data
// ========================================
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';
import AdminService, { DashboardStats } from '../../services/adminService';

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      const dashboardStats = await AdminService.getDashboardStats();
      setStats(dashboardStats);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{user?.fullName || 'Admin'}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="shield-checkmark" size={14} color={COLORS.white} />
            <Text style={styles.roleText}>Administrator</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <TouchableOpacity 
          style={[styles.statCard, { backgroundColor: COLORS.primary }]}
          onPress={() => router.push('/(admin)/users')}
        >
          <Ionicons name="people-outline" size={32} color={COLORS.white} />
          <Text style={styles.statNumber}>{stats?.totalUsers || 0}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.statCard, { backgroundColor: COLORS.secondary }]}
          onPress={() => router.push('/(admin)/properties')}
        >
          <Ionicons name="home-outline" size={32} color={COLORS.white} />
          <Text style={styles.statNumber}>{stats?.totalProperties || 0}</Text>
          <Text style={styles.statLabel}>Properties</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.statCard, { backgroundColor: COLORS.accent }]}
          onPress={() => router.push('/(admin)/reports')}
        >
          <Ionicons name="cash-outline" size={32} color={COLORS.white} />
          <Text style={styles.statNumber}>K{stats?.totalRevenue.toLocaleString() || '0'}</Text>
          <Text style={styles.statLabel}>Total Revenue</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.statCard, { backgroundColor: '#9333ea' }]}
          onPress={() => router.push('/(admin)/applications')}
        >
          <Ionicons name="document-text-outline" size={32} color={COLORS.white} />
          <Text style={styles.statNumber}>{stats?.pendingApplications || 0}</Text>
          <Text style={styles.statLabel}>Pending Apps</Text>
        </TouchableOpacity>
      </View>

      {/* Additional Stats */}
      <View style={styles.additionalStats}>
        <View style={styles.miniStatCard}>
          <View style={styles.miniStatHeader}>
            <Ionicons name="trending-up" size={20} color={COLORS.success} />
            <Text style={styles.miniStatLabel}>Monthly Revenue</Text>
          </View>
          <Text style={styles.miniStatValue}>K{stats?.monthlyRevenue.toLocaleString() || '0'}</Text>
        </View>

        <View style={styles.miniStatCard}>
          <View style={styles.miniStatHeader}>
            <Ionicons name="pie-chart" size={20} color={COLORS.info} />
            <Text style={styles.miniStatLabel}>Occupancy Rate</Text>
          </View>
          <Text style={styles.miniStatValue}>{stats?.occupancyRate || 0}%</Text>
        </View>

        <View style={styles.miniStatCard}>
          <View style={styles.miniStatHeader}>
            <Ionicons name="construct" size={20} color={COLORS.warning} />
            <Text style={styles.miniStatLabel}>Active Maintenance</Text>
          </View>
          <Text style={styles.miniStatValue}>{stats?.activeMaintenanceRequests || 0}</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => router.push('/(admin)/users')}
        >
          <View style={[styles.actionIcon, { backgroundColor: COLORS.primary + '15' }]}>
            <Ionicons name="person-add-outline" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Manage Users</Text>
            <Text style={styles.actionSubtitle}>View and manage all users</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => router.push('/(admin)/properties')}
        >
          <View style={[styles.actionIcon, { backgroundColor: COLORS.secondary + '15' }]}>
            <Ionicons name="home" size={24} color={COLORS.secondary} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Manage Properties</Text>
            <Text style={styles.actionSubtitle}>Approve and monitor listings</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => router.push('/(admin)/settings')}
        >
          <View style={[styles.actionIcon, { backgroundColor: COLORS.info + '15' }]}>
            <Ionicons name="settings-outline" size={24} color={COLORS.info} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>System Settings</Text>
            <Text style={styles.actionSubtitle}>Configure fees and charges</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => router.push('/(admin)/reports')}
        >
          <View style={[styles.actionIcon, { backgroundColor: COLORS.accent + '15' }]}>
            <Ionicons name="bar-chart-outline" size={24} color={COLORS.accent} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Reports & Analytics</Text>
            <Text style={styles.actionSubtitle}>View system reports</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => router.push('/(admin)/maintenance')}
        >
          <View style={[styles.actionIcon, { backgroundColor: COLORS.warning + '15' }]}>
            <Ionicons name="construct-outline" size={24} color={COLORS.warning} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Maintenance Requests</Text>
            <Text style={styles.actionSubtitle}>Handle maintenance tickets</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.gray[600],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: 60,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  greeting: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginTop: 4,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  roleText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  logoutButton: {
    padding: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: 4,
  },
  additionalStats: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  miniStatCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  miniStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  miniStatLabel: {
    fontSize: 11,
    color: COLORS.gray[600],
    marginLeft: 6,
    flex: 1,
  },
  miniStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: COLORS.gray[600],
  },
});