// ========================================
// FILE: app/(landlord)/financials.tsx
// FIXED: Real PDF download functionality
// ========================================
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';
import LandlordService, { FinancialBreakdown } from '../../services/landlordService';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

export default function FinancialsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [period, setPeriod] = useState<'month' | 'year'>('month');
  const [financials, setFinancials] = useState<FinancialBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadFinancials();
  }, [period]);

  const loadFinancials = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const data = await LandlordService.getFinancialBreakdown(user.id, period);
      setFinancials(data);
    } catch (error) {
      console.error('Failed to load financials:', error);
      Alert.alert('Error', 'Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const generateCSVContent = (transactions: any[]) => {
    const headers = [
      'Date',
      'Property',
      'Tenant',
      'Amount',
      'Platform Fee (25%)',
      'Maintenance Fund (15%)',
      'App Fee (10%)',
      'Net to Owner (50%)'
    ].join(',');

    const rows = transactions.map(t => {
      const platformFee = (t.amount * 0.25).toFixed(2);
      const maintenanceFee = (t.amount * 0.15).toFixed(2);
      const appFee = (t.amount * 0.10).toFixed(2);
      const netAmount = (t.amount * 0.50).toFixed(2);

      return [
        new Date(t.paid_at).toLocaleDateString(),
        `"${t.property_title}"`,
        `"${t.tenant_name}"`,
        t.amount.toFixed(2),
        platformFee,
        maintenanceFee,
        appFee,
        netAmount
      ].join(',');
    });

    return [headers, ...rows].join('\n');
  };

  const handleDownloadStatement = async () => {
    if (downloading) return;

    setDownloading(true);
    try {
      const endDate = new Date().toISOString();
      const startDate = new Date();
      
      if (period === 'month') {
        startDate.setMonth(startDate.getMonth() - 1);
      } else {
        startDate.setFullYear(startDate.getFullYear() - 1);
      }

      const transactions = await LandlordService.downloadFinancialStatement(
        user!.id,
        startDate.toISOString(),
        endDate
      );

      if (!transactions || transactions.length === 0) {
        Alert.alert('No Data', 'No transactions found for the selected period.');
        return;
      }

      // Generate CSV content
      const csvContent = generateCSVContent(transactions);

      // Create filename
      const filename = `financial_statement_${period}_${new Date().toISOString().split('T')[0]}.csv`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      // Write file using legacy API (explicitly imported)
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Save Financial Statement',
          UTI: 'public.comma-separated-values-text',
        });

        Alert.alert(
          'Statement Generated',
          `${transactions.length} transactions exported successfully!\n\nFile: ${filename}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Download Complete',
          `Statement saved to:\n${fileUri}\n\n${transactions.length} transactions included.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('Download error:', error);
      Alert.alert('Error', error.message || 'Failed to generate statement');
    } finally {
      setDownloading(false);
    }
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
        <Text style={styles.headerTitle}>Financial Reports</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[styles.periodButton, period === 'month' && styles.periodButtonActive]}
            onPress={() => setPeriod('month')}
          >
            <Text style={[
              styles.periodButtonText,
              period === 'month' && styles.periodButtonTextActive
            ]}>
              This Month
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, period === 'year' && styles.periodButtonActive]}
            onPress={() => setPeriod('year')}
          >
            <Text style={[
              styles.periodButtonText,
              period === 'year' && styles.periodButtonTextActive
            ]}>
              This Year
            </Text>
          </TouchableOpacity>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="cash" size={32} color={COLORS.primary} />
            <Text style={styles.summaryPeriod}>{financials?.period}</Text>
          </View>
          
          <View style={styles.summaryMain}>
            <Text style={styles.summaryLabel}>Total Rent Collected</Text>
            <Text style={styles.summaryAmount}>
              K{financials?.total_rent_collected.toLocaleString() || '0'}
            </Text>
            <Text style={styles.transactionCount}>
              {financials?.transaction_count || 0} transactions
            </Text>
          </View>
        </View>

        {/* Fee Breakdown - VISIBLE TO LANDLORD */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fee Breakdown</Text>
          <Text style={styles.sectionSubtitle}>
            Transparent breakdown of all fees and charges
          </Text>

          <View style={styles.breakdownCard}>
            {/* Platform Commission */}
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <View style={[styles.breakdownIcon, { backgroundColor: COLORS.error + '15' }]}>
                  <Ionicons name="business" size={20} color={COLORS.error} />
                </View>
                <View>
                  <Text style={styles.breakdownLabel}>Platform Commission</Text>
                  <Text style={styles.breakdownPercent}>
                    {financials?.platform_commission_percent}% of rent collected
                  </Text>
                </View>
              </View>
              <Text style={[styles.breakdownAmount, { color: COLORS.error }]}>
                -K{financials?.platform_commission_amount.toLocaleString()}
              </Text>
            </View>

            {/* Maintenance Fund */}
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <View style={[styles.breakdownIcon, { backgroundColor: COLORS.warning + '15' }]}>
                  <Ionicons name="construct" size={20} color={COLORS.warning} />
                </View>
                <View>
                  <Text style={styles.breakdownLabel}>Maintenance Fund</Text>
                  <Text style={styles.breakdownPercent}>
                    {financials?.maintenance_fund_percent}% reserved for repairs
                  </Text>
                </View>
              </View>
              <Text style={[styles.breakdownAmount, { color: COLORS.warning }]}>
                -K{financials?.maintenance_fund_amount.toLocaleString()}
              </Text>
            </View>

            {/* Application Fees */}
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <View style={[styles.breakdownIcon, { backgroundColor: COLORS.info + '15' }]}>
                  <Ionicons name="document-text" size={20} color={COLORS.info} />
                </View>
                <View>
                  <Text style={styles.breakdownLabel}>Application Processing</Text>
                  <Text style={styles.breakdownPercent}>
                    {financials?.application_fees_percent}% application fees
                  </Text>
                </View>
              </View>
              <Text style={[styles.breakdownAmount, { color: COLORS.info }]}>
                -K{financials?.application_fees_amount.toLocaleString()}
              </Text>
            </View>

            <View style={styles.divider} />

            {/* Net to Owner */}
            <View style={[styles.breakdownRow, styles.netRow]}>
              <View style={styles.breakdownLeft}>
                <View style={[styles.breakdownIcon, { backgroundColor: COLORS.success + '15' }]}>
                  <Ionicons name="wallet" size={20} color={COLORS.success} />
                </View>
                <View>
                  <Text style={[styles.breakdownLabel, styles.netLabel]}>Your Net Earnings</Text>
                  <Text style={styles.breakdownPercent}>
                    {financials?.net_to_owner_percent}% to your account
                  </Text>
                </View>
              </View>
              <Text style={[styles.breakdownAmount, styles.netAmount]}>
                K{financials?.net_to_owner_amount.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Chart Visualization */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue Distribution</Text>
          
          <View style={styles.chartCard}>
            <View style={styles.chartRow}>
              <View style={styles.chartBar}>
                <View style={[
                  styles.chartSegment,
                  { 
                    flex: financials?.net_to_owner_percent,
                    backgroundColor: COLORS.success 
                  }
                ]} />
                <View style={[
                  styles.chartSegment,
                  { 
                    flex: financials?.platform_commission_percent,
                    backgroundColor: COLORS.error 
                  }
                ]} />
                <View style={[
                  styles.chartSegment,
                  { 
                    flex: financials?.maintenance_fund_percent,
                    backgroundColor: COLORS.warning 
                  }
                ]} />
                <View style={[
                  styles.chartSegment,
                  { 
                    flex: financials?.application_fees_percent,
                    backgroundColor: COLORS.info 
                  }
                ]} />
              </View>
            </View>

            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
                <Text style={styles.legendText}>You ({financials?.net_to_owner_percent}%)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.error }]} />
                <Text style={styles.legendText}>Platform ({financials?.platform_commission_percent}%)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.warning }]} />
                <Text style={styles.legendText}>Maintenance ({financials?.maintenance_fund_percent}%)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.info }]} />
                <Text style={styles.legendText}>App Fee ({financials?.application_fees_percent}%)</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Download Statement - FIXED */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.downloadButton, downloading && styles.downloadButtonDisabled]}
            onPress={handleDownloadStatement}
            disabled={downloading}
          >
            {downloading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Ionicons name="download-outline" size={24} color={COLORS.white} />
            )}
            <Text style={styles.downloadButtonText}>
              {downloading ? 'Generating...' : 'Download Financial Statement (CSV)'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.downloadNote}>
            Statement includes all transactions, fees, and detailed breakdown
          </Text>
        </View>
      </ScrollView>
    </View>
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
    gap: 12,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
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
  summaryCard: {
    backgroundColor: COLORS.white,
    margin: 16,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  summaryHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryPeriod: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginTop: 8,
  },
  summaryMain: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    color: COLORS.gray[600],
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 40,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  transactionCount: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.gray[600],
    marginBottom: 16,
  },
  breakdownCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  netRow: {
    backgroundColor: COLORS.success + '05',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  breakdownIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakdownLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  netLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  breakdownPercent: {
    fontSize: 11,
    color: COLORS.gray[600],
    marginTop: 2,
  },
  breakdownAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  netAmount: {
    fontSize: 20,
    color: COLORS.success,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray[200],
    marginVertical: 8,
  },
  chartCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  chartRow: {
    marginBottom: 16,
  },
  chartBar: {
    height: 40,
    borderRadius: 20,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  chartSegment: {
    height: '100%',
  },
  chartLegend: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 13,
    color: COLORS.gray[700],
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
  },
  downloadButtonDisabled: {
    opacity: 0.6,
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  downloadNote: {
    fontSize: 12,
    color: COLORS.gray[600],
    textAlign: 'center',
    marginTop: 12,
  },
});