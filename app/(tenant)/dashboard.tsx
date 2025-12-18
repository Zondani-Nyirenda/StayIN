// ========================================
// FILE: app/(tenant)/dashboard.tsx
// Tenant Dashboard Home Screen
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
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import TenantService from '../../services/tenantService';

const { width } = Dimensions.get('window');

export default function TenantDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    activeRentals: 0,
    pendingApplications: 0,
    maintenanceRequests: 0,
    upcomingPayments: 1,
  });
  const [userName, setUserName] = useState('Test Tenant');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const tenantId = 2; // Replace with actual logged-in user ID
      
      const [activeRentals, pendingApps, maintenanceReqs] = await Promise.all([
        TenantService.getActiveRentalCount(tenantId),
        TenantService.getPendingApplicationsCount(tenantId),
        TenantService.getMyMaintenanceRequests(tenantId),
      ]);

      setStats({
        activeRentals,
        pendingApplications: pendingApps,
        maintenanceRequests: maintenanceReqs.filter(r => r.status === 'open').length,
        upcomingPayments: 1, // Example
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

  const quickActions = [
    {
      id: 'browse',
      icon: 'home-outline',
      label: 'Browse Properties',
      route: '/(tenant)/properties',
      color: '#4F46E5',
      bgColor: '#EEF2FF',
    },
    {
      id: 'applications',
      icon: 'document-text-outline',
      label: 'My Applications',
      route: '/(tenant)/applications',
      color: '#F59E0B',
      bgColor: '#FEF3C7',
    },
    {
      id: 'payments',
      icon: 'card-outline',
      label: 'Payments',
      route: '/(tenant)/payments',
      color: '#10B981',
      bgColor: '#D1FAE5',
    },
    {
      id: 'maintenance',
      icon: 'construct-outline',
      label: 'Maintenance',
      route: '/(tenant)/maintenance',
      color: '#EF4444',
      bgColor: '#FEE2E2',
    },
  ];

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.userName}>{userName}</Text>
            </View>
            <TouchableOpacity style={styles.profileButton}>
              <Ionicons name="person-circle" size={40} color="#4F46E5" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.activeCard]}>
              <View style={styles.statIcon}>
                <Ionicons name="home" size={24} color="#4F46E5" />
              </View>
              <Text style={styles.statNumber}>{stats.activeRentals}</Text>
              <Text style={styles.statLabel}>Active Rentals</Text>
            </View>

            <View style={[styles.statCard, styles.pendingCard]}>
              <View style={styles.statIcon}>
                <Ionicons name="time" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.statNumber}>{stats.pendingApplications}</Text>
              <Text style={styles.statLabel}>Pending Apps</Text>
            </View>

            <View style={[styles.statCard, styles.maintenanceCard]}>
              <View style={styles.statIcon}>
                <Ionicons name="construct" size={24} color="#EF4444" />
              </View>
              <Text style={styles.statNumber}>{stats.maintenanceRequests}</Text>
              <Text style={styles.statLabel}>Open Issues</Text>
            </View>

            <View style={[styles.statCard, styles.paymentCard]}>
              <View style={styles.statIcon}>
                <Ionicons name="calendar" size={24} color="#10B981" />
              </View>
              <Text style={styles.statNumber}>{stats.upcomingPayments}</Text>
              <Text style={styles.statLabel}>Due Soon</Text>
            </View>
          </View>
        </View>

        {/* Next Payment Alert */}
        {stats.upcomingPayments > 0 && (
          <View style={styles.alertSection}>
            <View style={styles.alertCard}>
              <View style={styles.alertIcon}>
                <Ionicons name="alert-circle" size={24} color="#F59E0B" />
              </View>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>Rent Payment Due</Text>
                <Text style={styles.alertText}>
                  Your rent payment of K1,250 is due on January 5, 2025
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.alertButton}
                onPress={() => router.push('/(tenant)/payments')}
              >
                <Text style={styles.alertButtonText}>Pay Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.activityCard}>
            <View style={styles.activityIcon}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Payment Completed</Text>
              <Text style={styles.activityText}>
                Rent payment for December 2024
              </Text>
              <Text style={styles.activityTime}>2 days ago</Text>
            </View>
          </View>

          <View style={styles.activityCard}>
            <View style={styles.activityIcon}>
              <Ionicons name="document-text" size={24} color="#3B82F6" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Application Submitted</Text>
              <Text style={styles.activityText}>
                Modern 2BR Apartment in Lusaka
              </Text>
              <Text style={styles.activityTime}>5 days ago</Text>
            </View>
          </View>

          <View style={styles.activityCard}>
            <View style={styles.activityIcon}>
              <Ionicons name="construct" size={24} color="#F59E0B" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Maintenance Request</Text>
              <Text style={styles.activityText}>
                Leaking faucet - In Progress
              </Text>
              <Text style={styles.activityTime}>1 week ago</Text>
            </View>
          </View>
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <View style={styles.tipCard}>
            <Ionicons name="bulb" size={24} color="#F59E0B" />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Tip: Set up Auto-Pay</Text>
              <Text style={styles.tipText}>
                Never miss a rent payment by enabling automatic payments
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#4F46E5',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 14,
    color: '#C7D2FE',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (width - 52) / 2,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activeCard: {
    backgroundColor: '#EEF2FF',
  },
  pendingCard: {
    backgroundColor: '#FEF3C7',
  },
  maintenanceCard: {
    backgroundColor: '#FEE2E2',
  },
  paymentCard: {
    backgroundColor: '#D1FAE5',
  },
  statIcon: {
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  alertSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  alertCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  alertIcon: {
    alignSelf: 'flex-start',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
  },
  alertButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  alertButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: (width - 52) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  activitySection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },
  activityCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  activityText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  tipsSection: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  tipCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
  },
});