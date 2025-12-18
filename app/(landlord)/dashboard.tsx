// ========================================
// FILE: app/(landlord)/dashboard.tsx
// Landlord Dashboard - Property Stats as Chips
// ========================================
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';
import LandlordService, { LandlordStats, FinancialBreakdown } from '../../services/landlordService';

export default function LandlordDashboard() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<LandlordStats | null>(null);
  const [financials, setFinancials] = useState<FinancialBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const loadDashboardData = async () => {
    if (!user?.id) return;

    try {
      const [dashboardStats, monthlyFinancials] = await Promise.all([
        LandlordService.getDashboardStats(user.id),
        LandlordService.getFinancialBreakdown(user.id, 'month'),
      ]);
      setStats(dashboardStats);
      setFinancials(monthlyFinancials);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
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

  const occupancyRate = stats?.totalProperties && stats.totalProperties > 0
    ? ((stats.occupiedProperties / stats.totalProperties) * 100).toFixed(0)
    : '0';

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{user?.fullName || 'Landlord'}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="business" size={14} color={COLORS.white} />
            <Text style={styles.roleText}>Property Owner</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      {/* Property Portfolio Stats as Compact Chips */}
      <View style={styles.filterWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity 
            style={styles.compactChip}
            onPress={() => router.push('/(landlord)/properties')}
          >
            <Text style={styles.compactChipText}>Total Properties</Text>
            <Text style={styles.compactChipCount}>{stats?.totalProperties || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.compactChip}
            onPress={() => router.push('/(landlord)/properties')}
          >
            <Text style={styles.compactChipText}>Occupied</Text>
            <Text style={styles.compactChipCount}>{stats?.occupiedProperties || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.compactChip}
            onPress={() => router.push('/(landlord)/properties')}
          >
            <Text style={styles.compactChipText}>Available</Text>
            <Text style={styles.compactChipCount}>{stats?.availableProperties || 0}</Text>
          </TouchableOpacity>

          <View style={styles.compactChip}>
            <Text style={styles.compactChipText}>Occupancy</Text>
            <Text style={styles.compactChipCount}>{occupancyRate}%</Text>
          </View>
        </ScrollView>
      </View>

      {/* Monthly Revenue Card */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Monthly Revenue</Text>
          <TouchableOpacity onPress={() => setShowBreakdown(!showBreakdown)}>
            <Ionicons 
              name={showBreakdown ? 'chevron-up' : 'chevron-down'} 
              size={24} 
              color={COLORS.primary} 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.revenueCard}>
          <View style={styles.revenueHeader}>
            <Text style={styles.revenueLabel}>Total Collected</Text>
            <Text style={styles.revenueAmount}>
              K{stats?.monthlyRevenue.toLocaleString() || '0'}
            </Text>
          </View>

          {showBreakdown && financials && (
            <View style={styles.breakdown}>
              <View style={styles.divider} />
              
              <View style={styles.breakdownRow}>
                <View style={styles.breakdownLabel}>
                  <View style={[styles.breakdownDot, { backgroundColor: COLORS.error }]} />
                  <Text style={styles.breakdownText}>
                    Platform Commission ({financials.platform_commission_percent}%)
                  </Text>
                </View>
                <Text style={[styles.breakdownAmount, { color: COLORS.error }]}>
                  -K{financials.platform_commission_amount.toLocaleString()}
                </Text>
              </View>

              <View style={styles.breakdownRow}>
                <View style={styles.breakdownLabel}>
                  <View style={[styles.breakdownDot, { backgroundColor: COLORS.warning }]} />
                  <Text style={styles.breakdownText}>
                    Maintenance Fund ({financials.maintenance_fund_percent}%)
                  </Text>
                </View>
                <Text style={[styles.breakdownAmount, { color: COLORS.warning }]}>
                  -K{financials.maintenance_fund_amount.toLocaleString()}
                </Text>
              </View>

              <View style={styles.breakdownRow}>
                <View style={styles.breakdownLabel}>
                  <View style={[styles.breakdownDot, { backgroundColor: COLORS.info }]} />
                  <Text style={styles.breakdownText}>
                    Application Fees ({financials.application_fees_percent}%)
                  </Text>
                </View>
                <Text style={[styles.breakdownAmount, { color: COLORS.info }]}>
                  -K{financials.application_fees_amount.toLocaleString()}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.breakdownRow}>
                <View style={styles.breakdownLabel}>
                  <View style={[styles.breakdownDot, { backgroundColor: COLORS.success }]} />
                  <Text style={[styles.breakdownText, styles.netText]}>
                    Your Net Earnings ({financials.net_to_owner_percent}%)
                  </Text>
                </View>
                <Text style={[styles.breakdownAmount, styles.netAmount]}>
                  K{financials.net_to_owner_amount.toLocaleString()}
                </Text>
              </View>

              <TouchableOpacity 
                style={styles.viewStatementButton}
                onPress={() => router.push('/(landlord)/financials')}
              >
                <Ionicons name="document-text-outline" size={16} color={COLORS.primary} />
                <Text style={styles.viewStatementText}>View Full Statement</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <TouchableOpacity 
          style={styles.quickStatCard}
          onPress={() => router.push('/(landlord)/tenants')}
        >
          <View style={styles.quickStatHeader}>
            <Ionicons name="people" size={20} color={COLORS.primary} />
            <Text style={styles.quickStatLabel}>Active Tenants</Text>
          </View>
          <Text style={styles.quickStatValue}>{stats?.activeTenants || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.quickStatCard}
          onPress={() => router.push('/(landlord)/applications')}
        >
          <View style={styles.quickStatHeader}>
            <Ionicons name="document-text" size={20} color={COLORS.warning} />
            <Text style={styles.quickStatLabel}>Pending Apps</Text>
          </View>
          <Text style={styles.quickStatValue}>{stats?.pendingApplications || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.quickStatCard}
          onPress={() => router.push('/(landlord)/maintenance')}
        >
          <View style={styles.quickStatHeader}>
            <Ionicons name="construct" size={20} color={COLORS.error} />
            <Text style={styles.quickStatLabel}>Maintenance</Text>
          </View>
          <Text style={styles.quickStatValue}>{stats?.maintenanceRequests || 0}</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(landlord)/add-property')}>
          <View style={[styles.actionIcon, { backgroundColor: COLORS.primary + '15' }]}>
            <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Add New Property</Text>
            <Text style={styles.actionSubtitle}>List a new rental property</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(landlord)/properties')}>
          <View style={[styles.actionIcon, { backgroundColor: COLORS.secondary + '15' }]}>
            <Ionicons name="home" size={24} color={COLORS.secondary} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Manage Properties</Text>
            <Text style={styles.actionSubtitle}>View and edit your listings</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(landlord)/applications')}>
          <View style={[styles.actionIcon, { backgroundColor: COLORS.warning + '15' }]}>
            <Ionicons name="document-text-outline" size={24} color={COLORS.warning} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Review Applications</Text>
            <Text style={styles.actionSubtitle}>
              {stats?.pendingApplications || 0} pending review
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(landlord)/tenants')}>
          <View style={[styles.actionIcon, { backgroundColor: COLORS.success + '15' }]}>
            <Ionicons name="people-outline" size={24} color={COLORS.success} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>View Tenants</Text>
            <Text style={styles.actionSubtitle}>Manage tenant information</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(landlord)/financials')}>
          <View style={[styles.actionIcon, { backgroundColor: COLORS.info + '15' }]}>
            <Ionicons name="bar-chart-outline" size={24} color={COLORS.info} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Financial Reports</Text>
            <Text style={styles.actionSubtitle}>Download statements & reports</Text>
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
    flex: 1,
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

  // Compact Chip Filter for Property Stats
  filterWrapper: {
    paddingVertical: 12,
    backgroundColor: COLORS.background,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  compactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    gap: 6,
  },
  compactChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray[700],
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

  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  revenueCard: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  revenueHeader: {
    alignItems: 'center',
  },
  revenueLabel: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginBottom: 8,
  },
  revenueAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  breakdown: {
    marginTop: 16,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray[200],
    marginVertical: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  breakdownLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  breakdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  breakdownText: {
    fontSize: 13,
    color: COLORS.gray[700],
    flex: 1,
  },
  netText: {
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  breakdownAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  netAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  viewStatementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary + '10',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    gap: 6,
  },
  viewStatementText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  quickStats: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginVertical: 8,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    alignItems: 'center',
  },
  quickStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickStatLabel: {
    fontSize: 12,
    color: COLORS.gray[600],
    marginLeft: 6,
    fontWeight: '600',
  },
  quickStatValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
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