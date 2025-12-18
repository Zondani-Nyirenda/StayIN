// ========================================
// FILE: app/(tenant)/applications.tsx
// Tenant - View & Track Applications (with Compact Chip Stats)
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
import { COLORS } from '../../utils/constants';
import { useAuth } from '../../contexts/AuthContext';
import TenantService, { TenantApplication } from '../../services/tenantService';

export default function ApplicationsScreen() {
  const { user } = useAuth(); // Real logged-in user
  const [applications, setApplications] = useState<TenantApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    if (!user?.id) return;

    try {
      const data = await TenantService.getMyApplications(user.id);
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
      case 'approved': return '#10B981';
      case 'rejected': return '#EF4444';
      case 'pending': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return 'checkmark-circle';
      case 'rejected': return 'close-circle';
      case 'pending': return 'time';
      default: return 'help-circle';
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
        <ActivityIndicator size="large" color={COLORS.primary} />
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

      {/* Stats as Compact Chips */}
      <View style={styles.chipsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContent}
        >
          <View style={styles.compactChip}>
            <Text style={styles.compactChipText}>Total</Text>
            <Text style={styles.compactChipCount}>{stats.total}</Text>
          </View>

          <View style={styles.compactChip}>
            <Text style={styles.compactChipText}>Pending</Text>
            <Text style={styles.compactChipCount}>{stats.pending}</Text>
          </View>

          <View style={styles.compactChip}>
            <Text style={styles.compactChipText}>Approved</Text>
            <Text style={styles.compactChipCount}>{stats.approved}</Text>
          </View>

          <View style={styles.compactChip}>
            <Text style={styles.compactChipText}>Rejected</Text>
            <Text style={styles.compactChipCount}>{stats.rejected}</Text>
          </View>
        </ScrollView>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {['all', 'pending', 'approved', 'rejected'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.activeFilterTab]}
            onPress={() => setFilter(f as any)}
          >
            <Text style={[styles.filterText, filter === f && styles.activeFilterText]}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Applications List */}
      <ScrollView
        style={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredApplications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color={COLORS.gray[300]} />
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
                    <Ionicons name="business-outline" size={14} color={COLORS.gray[600]} />
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
                  <Text style={[styles.statusText, { color: getStatusColor(app.status) }]}>
                    {app.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Details */}
              <View style={styles.cardDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="document-text-outline" size={16} color={COLORS.gray[600]} />
                  <Text style={styles.detailText}>
                    {app.documents.length} document(s) submitted
                  </Text>
                </View>

                {app.application_fee > 0 && (
                  <View style={styles.detailRow}>
                    <Ionicons name="cash-outline" size={16} color={COLORS.gray[600]} />
                    <Text style={styles.detailText}>
                      Fee: K{app.application_fee}
                    </Text>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={16} color={COLORS.gray[600]} />
                  <Text style={styles.detailText}>
                    Applied: {new Date(app.created_at).toLocaleDateString()}
                  </Text>
                </View>

                {app.notes && (
                  <View style={styles.notesContainer}>
                    <Ionicons name="information-circle-outline" size={16} color={COLORS.info} />
                    <Text style={styles.notesText}>{app.notes}</Text>
                  </View>
                )}
              </View>

              {/* Approved Action */}
              {app.status === 'approved' && (
                <View style={styles.actionContainer}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="document-text" size={18} color={COLORS.white} />
                    <Text style={styles.actionButtonText}>View Lease Agreement</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Pending Hint */}
              {app.status === 'pending' && (
                <View style={styles.warningBox}>
                  <Ionicons name="time-outline" size={16} color={COLORS.warning} />
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
  container: { flex: 1, backgroundColor: COLORS.background },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    backgroundColor: COLORS.white,
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  headerTitle: { fontSize: 28, fontWeight: '700', color: COLORS.gray[900], marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: COLORS.gray[600] },

  // Compact Chip Stats
  chipsWrapper: { paddingVertical: 12, backgroundColor: COLORS.background },
  chipsContent: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
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
  compactChipText: { fontSize: 12, fontWeight: '600', color: COLORS.gray[700] },
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

  filterContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.gray[100],
    alignItems: 'center',
  },
  activeFilterTab: { backgroundColor: COLORS.primary },
  filterText: { fontSize: 13, fontWeight: '600', color: COLORS.gray[700] },
  activeFilterText: { color: COLORS.white },

  listContainer: { flex: 1, padding: 16 },

  applicationCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  propertyInfo: { flex: 1 },
  propertyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.gray[900], marginBottom: 4 },
  propertyTypeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  propertyType: { fontSize: 12, color: COLORS.gray[600], textTransform: 'capitalize' },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },

  cardDetails: {
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 13, color: COLORS.gray[700] },

  notesContainer: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: COLORS.info + '10',
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  notesText: { flex: 1, fontSize: 13, color: COLORS.info, lineHeight: 18 },

  actionContainer: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.gray[100] },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
  },
  actionButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.white },

  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.warning + '10',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  warningText: { fontSize: 13, color: COLORS.warning, fontWeight: '500' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.gray[900] },
  emptyText: { fontSize: 14, color: COLORS.gray[600], textAlign: 'center', paddingHorizontal: 32 },
});