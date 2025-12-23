// ========================================
// FILE: app/(landlord)/dashboard.tsx
// Landlord Dashboard - Final Stable Version with Profile Avatar
// ========================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';
import LandlordService, { LandlordStats, FinancialBreakdown } from '../../services/landlordService';
import { LinearGradient } from 'expo-linear-gradient';

// StayIN Brand Colors
const STAYIN = {
  primaryBlue: '#1E40AF',
  white: '#FFFFFF',
};

export default function LandlordDashboard() {
  const { user } = useAuth(); // Only need user, no refreshUser here
  const router = useRouter();
  const [stats, setStats] = useState<LandlordStats | null>(null);
  const [financials, setFinancials] = useState<FinancialBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showPropertyTypeModal, setShowPropertyTypeModal] = useState(false);

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
    if (user?.id) {
      loadDashboardData();
    }
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleAddProperty = () => {
    setShowPropertyTypeModal(true);
  };

  const selectPropertyType = (type: 'regular' | 'boarding') => {
    setShowPropertyTypeModal(false);
    if (type === 'regular') {
      router.push('/(landlord)/add-property');
    } else {
      router.push('/(landlord)/add-boarding-house');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={STAYIN.primaryBlue} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" backgroundColor="transparent" translucent />

      <View style={styles.container}>
        {/* Gradient Header with Profile Avatar */}
        <LinearGradient
          colors={[STAYIN.primaryBlue, '#0F172A']}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            {/* Left: Greeting + Name */}
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.userName}>{user?.fullName || 'Landlord'}</Text>
            </View>

            {/* Right: Profile Avatar Only */}
            <TouchableOpacity
              style={styles.profileAvatarButton}
              onPress={() => router.push('/(landlord)/profile')}
            >
              {user?.profileImage ? (
                <Image source={{ uri: user.profileImage }} style={styles.profileAvatar} />
              ) : (
                <Ionicons name="person-circle-outline" size={48} color={STAYIN.white} />
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.scrollContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
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

          {/* Quick Stats - 4 Cards in 2x2 Grid */}
          <View style={styles.quickStatsGrid}>
            <TouchableOpacity
              style={styles.quickStatCard}
              onPress={() => router.push('/(landlord)/properties')}
            >
              <View style={styles.quickStatHeader}>
                <Ionicons name="home-outline" size={20} color={COLORS.secondary} />
                <Text style={styles.quickStatLabel}>Total Properties</Text>
              </View>
              <Text style={styles.quickStatValue}>{stats?.totalProperties || 0}</Text>
            </TouchableOpacity>

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

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(landlord)/profile')}
            >
              <View style={[styles.actionIcon, { backgroundColor: COLORS.primary + '15' }]}>
                <Ionicons name="person-outline" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>My Profile</Text>
                <Text style={styles.actionSubtitle}>View and edit personal information</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={handleAddProperty}>
              <View style={[styles.actionIcon, { backgroundColor: COLORS.success + '15' }]}>
                <Ionicons name="add-circle-outline" size={24} color={COLORS.success} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Add New Property</Text>
                <Text style={styles.actionSubtitle}>List a new rental or boarding house</Text>
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
              <View style={[styles.actionIcon, { backgroundColor: COLORS.info + '15' }]}>
                <Ionicons name="people-outline" size={24} color={COLORS.info} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>View Tenants</Text>
                <Text style={styles.actionSubtitle}>Manage tenant information</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(landlord)/maintenance')}>
              <View style={[styles.actionIcon, { backgroundColor: COLORS.error + '15' }]}>
                <Ionicons name="construct-outline" size={24} color={COLORS.error} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Maintenance Requests</Text>
                <Text style={styles.actionSubtitle}>
                  {stats?.maintenanceRequests || 0} open issues
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(landlord)/financials')}>
              <View style={[styles.actionIcon, { backgroundColor: COLORS.success + '15' }]}>
                <Ionicons name="bar-chart-outline" size={24} color={COLORS.success} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Financial Reports</Text>
                <Text style={styles.actionSubtitle}>Download statements & reports</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Property Type Selection Modal */}
        <Modal
          visible={showPropertyTypeModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowPropertyTypeModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Property Type</Text>
                <TouchableOpacity onPress={() => setShowPropertyTypeModal(false)}>
                  <Ionicons name="close" size={28} color={COLORS.gray[700]} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                What type of property would you like to add?
              </Text>

              <TouchableOpacity
                style={styles.propertyTypeCard}
                onPress={() => selectPropertyType('regular')}
              >
                <View style={[styles.propertyTypeIcon, { backgroundColor: COLORS.primary + '15' }]}>
                  <Ionicons name="home" size={32} color={COLORS.primary} />
                </View>
                <View style={styles.propertyTypeInfo}>
                  <Text style={styles.propertyTypeTitle}>Residential / Commercial</Text>
                  <Text style={styles.propertyTypeDescription}>
                    Houses, apartments, flats, shops, offices, warehouses
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={COLORS.gray[400]} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.propertyTypeCard}
                onPress={() => selectPropertyType('boarding')}
              >
                <View style={[styles.propertyTypeIcon, { backgroundColor: COLORS.secondary + '15' }]}>
                  <Ionicons name="school" size={32} color={COLORS.secondary} />
                </View>
                <View style={styles.propertyTypeInfo}>
                  <Text style={styles.propertyTypeTitle}>Student Boarding House</Text>
                  <Text style={styles.propertyTypeDescription}>
                    Hostels with rooms and per-bedspace pricing
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={COLORS.gray[400]} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowPropertyTypeModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </>
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

  headerGradient: {
    paddingTop: 60,
    paddingBottom: 36,
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
  profileAvatarButton: {
    padding: 4,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: STAYIN.white,
  },

  scrollContainer: {
    flex: 1,
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

  quickStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    marginVertical: 8,
  },
  quickStatCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    padding: 16,
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
    fontSize: 24,
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

  breakdown: { marginTop: 16 },
  divider: { height: 1, backgroundColor: COLORS.gray[200], marginVertical: 12 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  breakdownLabel: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  breakdownDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  breakdownText: { fontSize: 13, color: COLORS.gray[700], flex: 1 },
  netText: { fontWeight: 'bold', color: COLORS.gray[900] },
  breakdownAmount: { fontSize: 14, fontWeight: '600' },
  netAmount: { fontSize: 18, fontWeight: 'bold', color: COLORS.success },
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
  viewStatementText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginBottom: 24,
  },
  propertyTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.gray[200],
  },
  propertyTypeIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  propertyTypeInfo: {
    flex: 1,
  },
  propertyTypeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  propertyTypeDescription: {
    fontSize: 13,
    color: COLORS.gray[600],
    lineHeight: 18,
  },
  cancelButton: {
    backgroundColor: COLORS.gray[200],
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
});