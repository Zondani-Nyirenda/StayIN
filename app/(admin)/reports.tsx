// ========================================
// FILE: app/(admin)/reports.tsx
// Reports & Analytics Screen
// ========================================
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';
import AdminService from '../../services/adminService';

type Period = 'week' | 'month' | 'year';

export default function ReportsScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>('month');
  const [analytics, setAnalytics] = useState<any>(null);
  const [revenueReport, setRevenueReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [analyticsData, revenue] = await Promise.all([
        AdminService.getAnalytics(period),
        AdminService.getRevenueReport(getDateRange().start, getDateRange().end)
      ]);
      setAnalytics(analyticsData);
      setRevenueReport(revenue);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    const end = new Date().toISOString();
    const start = new Date();
    
    switch (period) {
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(start.getFullYear() - 1);
        break;
    }
    
    return { start: start.toISOString(), end };
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reports & Analytics</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['week', 'month', 'year'] as Period[]).map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.periodButton, period === p && styles.periodButtonActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[
                styles.periodButtonText,
                period === p && styles.periodButtonTextActive
              ]}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Key Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Metrics</Text>
          
          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, { backgroundColor: COLORS.primary + '15' }]}>
              <Ionicons name="trending-up" size={28} color={COLORS.primary} />
              <Text style={styles.metricValue}>K{analytics?.revenue?.toLocaleString() || '0'}</Text>
              <Text style={styles.metricLabel}>Revenue</Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: COLORS.success + '15' }]}>
              <Ionicons name="people" size={28} color={COLORS.success} />
              <Text style={styles.metricValue}>{analytics?.activeTenants || 0}</Text>
              <Text style={styles.metricLabel}>Active Tenants</Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: COLORS.secondary + '15' }]}>
              <Ionicons name="receipt" size={28} color={COLORS.secondary} />
              <Text style={styles.metricValue}>{analytics?.transactions || 0}</Text>
              <Text style={styles.metricLabel}>Transactions</Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: COLORS.info + '15' }]}>
              <Ionicons name="person-add" size={28} color={COLORS.info} />
              <Text style={styles.metricValue}>{analytics?.newUsers || 0}</Text>
              <Text style={styles.metricLabel}>New Users</Text>
            </View>
          </View>
        </View>

        {/* Revenue Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue Breakdown</Text>
          
          <View style={styles.card}>
            <View style={styles.totalRevenue}>
              <Text style={styles.totalRevenueLabel}>Total Revenue</Text>
              <Text style={styles.totalRevenueValue}>
                K{revenueReport?.total?.toLocaleString() || '0'}
              </Text>
            </View>

            {revenueReport?.breakdown?.length > 0 ? (
              revenueReport.breakdown.map((item: any, index: number) => (
                <View key={index} style={styles.revenueItem}>
                  <View style={styles.revenueItemHeader}>
                    <View style={[
                      styles.revenueItemIcon,
                      { backgroundColor: getPaymentTypeColor(item.payment_type) + '20' }
                    ]}>
                      <Ionicons 
                        name={getPaymentTypeIcon(item.payment_type) as any} 
                        size={20} 
                        color={getPaymentTypeColor(item.payment_type)} 
                      />
                    </View>
                    <View style={styles.revenueItemInfo}>
                      <Text style={styles.revenueItemLabel}>
                        {item.payment_type.replace('_', ' ').toUpperCase()}
                      </Text>
                      <Text style={styles.revenueItemCount}>{item.count} transactions</Text>
                    </View>
                  </View>
                  <Text style={styles.revenueItemValue}>K{item.total?.toLocaleString()}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>No revenue data for this period</Text>
            )}
          </View>
        </View>

        {/* Growth Indicators */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Growth Indicators</Text>
          
          <View style={styles.card}>
            <View style={styles.growthItem}>
              <Ionicons name="home" size={24} color={COLORS.primary} />
              <View style={styles.growthItemContent}>
                <Text style={styles.growthItemLabel}>New Properties</Text>
                <Text style={styles.growthItemValue}>{analytics?.newProperties || 0}</Text>
              </View>
              <View style={[styles.growthBadge, { backgroundColor: COLORS.success + '15' }]}>
                <Ionicons name="arrow-up" size={12} color={COLORS.success} />
              </View>
            </View>

            <View style={styles.growthItem}>
              <Ionicons name="person-add" size={24} color={COLORS.secondary} />
              <View style={styles.growthItemContent}>
                <Text style={styles.growthItemLabel}>New Users</Text>
                <Text style={styles.growthItemValue}>{analytics?.newUsers || 0}</Text>
              </View>
              <View style={[styles.growthBadge, { backgroundColor: COLORS.success + '15' }]}>
                <Ionicons name="arrow-up" size={12} color={COLORS.success} />
              </View>
            </View>
          </View>
        </View>

        {/* Export Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Reports</Text>
          
          <TouchableOpacity style={styles.exportButton}>
            <Ionicons name="download-outline" size={20} color={COLORS.primary} />
            <Text style={styles.exportButtonText}>Download PDF Report</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.exportButton}>
            <Ionicons name="document-text-outline" size={20} color={COLORS.secondary} />
            <Text style={styles.exportButtonText}>Export to Excel</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const getPaymentTypeIcon = (type: string) => {
  switch (type) {
    case 'rent': return 'home';
    case 'deposit': return 'shield-checkmark';
    case 'penalty': return 'warning';
    case 'application_fee': return 'document-text';
    default: return 'cash';
  }
};

const getPaymentTypeColor = (type: string) => {
  switch (type) {
    case 'rent': return COLORS.primary;
    case 'deposit': return COLORS.success;
    case 'penalty': return COLORS.warning;
    case 'application_fee': return COLORS.info;
    default: return COLORS.gray[500];
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  content: {
    flex: 1,
  },
  periodSelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  periodButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[600],
  },
  periodButtonTextActive: {
    color: COLORS.white,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: '47%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: COLORS.gray[600],
    marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  totalRevenue: {
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  totalRevenueLabel: {
    fontSize: 13,
    color: COLORS.gray[600],
    marginBottom: 4,
  },
  totalRevenueValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  revenueItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  revenueItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  revenueItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  revenueItemInfo: {
    flex: 1,
  },
  revenueItemLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  revenueItemCount: {
    fontSize: 11,
    color: COLORS.gray[600],
    marginTop: 2,
  },
  revenueItemValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.gray[500],
    paddingVertical: 20,
  },
  growthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  growthItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  growthItemLabel: {
    fontSize: 13,
    color: COLORS.gray[600],
  },
  growthItemValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginTop: 2,
  },
  growthBadge: {
    padding: 6,
    borderRadius: 8,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    gap: 8,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
});