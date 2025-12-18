// ========================================
// FILE: app/(tenant)/applications.tsx
// View and Track Application Status
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
import TenantService, { TenantApplication } from '../../services/tenantService';

export default function ApplicationsScreen() {
  const [applications, setApplications] = useState<TenantApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const tenantId = 2; // Replace with actual logged-in user ID
      const data = await TenantService.getMyApplications(tenantId);
      setApplications(data);
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadApplications();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#10B981';
      case 'rejected':
        return '#EF4444';
      case 'pending':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return 'checkmark-circle';
      case 'rejected':
        return 'close-circle';
      case 'pending':
        return 'time';
      default:
        return 'help-circle';
    }
  };

  const filteredApplications = applications.filter(app => 
    filter === 'all' ? true : app.status === filter
  );

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Applications</Text>
        <Text style={styles.headerSubtitle}>Track your rental applications</Text>
      </View>

      {/* Stats Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statsContainer}
        contentContainerStyle={styles.statsContent}
      >
        <View style={[styles.statCard, styles.totalCard]}>
          <Ionicons name="documents-outline" size={32} color="#4F46E5" />
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>

        <View style={[styles.statCard, styles.pendingCard]}>
          <Ionicons name="time-outline" size={32} color="#F59E0B" />
          <Text style={styles.statNumber}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>

        <View style={[styles.statCard, styles.approvedCard]}>
          <Ionicons name="checkmark-circle-outline" size={32} color="#10B981" />
          <Text style={styles.statNumber}>{stats.approved}</Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>

        <View style={[styles.statCard, styles.rejectedCard]}>
          <Ionicons name="close-circle-outline" size={32} color="#EF4444" />
          <Text style={styles.statNumber}>{stats.rejected}</Text>
          <Text style={styles.statLabel}>Rejected</Text>
        </View>
      </ScrollView>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {['all', 'pending', 'approved', 'rejected'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.activeFilterTab]}
            onPress={() => setFilter(f as any)}
          >
            <Text
              style={[styles.filterText, filter === f && styles.activeFilterText]}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Applications List */}
      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredApplications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Applications</Text>
            <Text style={styles.emptyText}>
              {filter === 'all'
                ? "You haven't submitted any applications yet"
                : `No ${filter} applications found`}
            </Text>
          </View>
        ) : (
          filteredApplications.map((app) => (
            <View key={app.id} style={styles.applicationCard}>
              {/* Property Info */}
              <View style={styles.cardHeader}>
                <View style={styles.propertyInfo}>
                  <Text style={styles.propertyTitle} numberOfLines={1}>
                    {app.property_title}
                  </Text>
                  <View style={styles.propertyTypeRow}>
                    <Ionicons name="business-outline" size={14} color="#6B7280" />
                    <Text style={styles.propertyType}>
                      {app.property_type.replace('_', ' ')}
                    </Text>
                  </View>
                </View>

                {/* Status Badge */}
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${getStatusColor(app.status)}20` },
                  ]}
                >
                  <Ionicons
                    name={getStatusIcon(app.status)}
                    size={16}
                    color={getStatusColor(app.status)}
                  />
                  <Text
                    style={[styles.statusText, { color: getStatusColor(app.status) }]}
                  >
                    {app.status}
                  </Text>
                </View>
              </View>

              {/* Application Details */}
              <View style={styles.cardDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="document-text-outline" size={16} color="#6B7280" />
                  <Text style={styles.detailText}>
                    {app.documents.length} document(s) submitted
                  </Text>
                </View>

                {app.application_fee > 0 && (
                  <View style={styles.detailRow}>
                    <Ionicons name="cash-outline" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>
                      Fee: K{app.application_fee.toFixed(2)}
                    </Text>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                  <Text style={styles.detailText}>
                    Applied: {new Date(app.created_at).toLocaleDateString()}
                  </Text>
                </View>

                {app.notes && (
                  <View style={styles.notesContainer}>
                    <Ionicons name="information-circle-outline" size={16} color="#3B82F6" />
                    <Text style={styles.notesText}>{app.notes}</Text>
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              {app.status === 'approved' && (
                <View style={styles.actionContainer}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="document-text" size={18} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>View Agreement</Text>
                  </TouchableOpacity>
                </View>
              )}

              {app.status === 'pending' && (
                <View style={styles.warningBox}>
                  <Ionicons name="time-outline" size={16} color="#F59E0B" />
                  <Text style={styles.warningText}>
                    Waiting for landlord review
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
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
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statsContent: {
    padding: 16,
    gap: 12,
  },
  statCard: {
    width: 120,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  totalCard: {
    backgroundColor: '#EEF2FF',
  },
  pendingCard: {
    backgroundColor: '#FEF3C7',
  },
  approvedCard: {
    backgroundColor: '#D1FAE5',
  },
  rejectedCard: {
    backgroundColor: '#FEE2E2',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  activeFilterTab: {
    backgroundColor: '#4F46E5',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  applicationCard: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  propertyInfo: {
    flex: 1,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  propertyTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  propertyType: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  cardDetails: {
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#4B5563',
  },
  notesContainer: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  notesText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
  actionContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4F46E5',
    padding: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  warningText: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});