// ========================================
// FILE: app/(tenant)/applications.tsx
// My Applications - Fixed to Show All Applications
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
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';
import { useAuth } from '../../contexts/AuthContext';
import TenantService, { TenantApplication } from '../../services/tenantService';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';

const STAYIN = {
  primaryBlue: '#1E40AF',
  green: '#00AA00',
  orange: '#FFAA00',
  dark: '#000000',
  white: '#FFFFFF',
};

export default function ApplicationsScreen() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<TenantApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Payment Modal State
  const [selectedApp, setSelectedApp] = useState<TenantApplication | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');

  // Reload when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('Applications screen focused, reloading...');
      loadApplications();
    }, [user?.id])
  );

  useEffect(() => {
    loadApplications();
  }, [user?.id]);

  const loadApplications = async () => {
    if (!user?.id) {
      console.log('No user ID found');
      setLoading(false);
      return;
    }

    console.log('Loading applications for user:', user.id);

    try {
      const data = await TenantService.getMyApplications(user.id);
      console.log('Applications loaded:', data.length);
      console.log('Application details:', JSON.stringify(data, null, 2));
      setApplications(data);
    } catch (error) {
      console.error('Failed to load applications:', error);
      Alert.alert('Error', 'Unable to load applications. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadApplications();
  };

  const handlePayNow = (app: TenantApplication) => {
    if (app.amount_due <= 0) {
      Alert.alert('Info', 'No outstanding payment for this application.');
      return;
    }
    setSelectedApp(app);
    setShowPaymentModal(true);
  };

  const processPayment = async () => {
    if (!paymentMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    if (!paymentMethod.includes('Bank') && phoneNumber.length < 9) {
      Alert.alert('Error', 'Please enter a valid mobile number');
      return;
    }

    if (!selectedApp || !user) return;

    Alert.alert(
      'Confirm Payment',
      `Pay K${selectedApp.amount_due.toLocaleString()} for "${selectedApp.property_title}"?\n\nMethod: ${paymentMethod}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay Now',
          onPress: async () => {
            try {
              await TenantService.recordPayment(
                user.id,
                selectedApp.property_id,
                selectedApp.amount_due,
                'initial_payment',
                `TXN-${Date.now()}`,
                paymentMethod
              );

              Alert.alert('Success!', 'Payment recorded successfully.');
              setShowPaymentModal(false);
              setPaymentMethod('');
              setPhoneNumber('');
              loadApplications(); // Refresh list to update amount_due
            } catch (err: any) {
              Alert.alert('Payment Failed', err.message || 'Please try again later.');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#10B981';
      case 'rejected': return '#EF4444';
      case 'pending': return '#F59E0B';
      default: return '#6B7280';
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
        <ActivityIndicator size="large" color={STAYIN.primaryBlue} />
        <Text style={styles.loadingText}>Loading applications...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />

      <View style={styles.container}>
        {/* Header */}
        <LinearGradient colors={[STAYIN.primaryBlue, '#0F172A']} style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>My Applications</Text>
              <Text style={styles.headerSubtitle}>Track your rental applications</Text>
            </View>
          </View>
        </LinearGradient>

      

        {/* Stats Chips */}
        <View style={styles.chipsWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContent}>
            {(['total', 'pending', 'approved', 'rejected'] as const).map((key) => (
              <View key={key} style={styles.compactChip}>
                <Text style={styles.compactChipText}>
                  {key === 'total' ? 'Total' : key.charAt(0).toUpperCase() + key.slice(1)}
                </Text>
                <Text style={styles.compactChipCount}>{stats[key]}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filter === f && styles.activeFilterTab]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.activeFilterText]}>
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Applications List */}
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContainer}
        >
          {filteredApplications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={80} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No Applications Found</Text>
              <Text style={styles.emptyText}>
                {filter === 'all'
                  ? "You haven't submitted any applications yet"
                  : `No ${filter} applications`}
              </Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => loadApplications()}
              >
                <Ionicons name="refresh" size={20} color={STAYIN.white} />
                <Text style={styles.emptyButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredApplications.map((app) => (
              <View key={app.id} style={styles.applicationCard}>
                {/* Property Info & Status */}
                <View style={styles.cardHeader}>
                  <View style={styles.propertyInfo}>
                    <Text style={styles.propertyTitle} numberOfLines={2}>
                      {app.property_title}
                    </Text>
                    <Text style={styles.propertyType}>
                      {app.property_type.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(app.status) + '20' }]}>
                    <Ionicons
                      name={
                        app.status === 'approved' ? 'checkmark-circle' :
                        app.status === 'rejected' ? 'close-circle' : 'time'
                      }
                      size={18}
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
                    <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>
                      Applied: {new Date(app.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  {app.documents.length > 0 && (
                    <View style={styles.detailRow}>
                      <Ionicons name="document-attach-outline" size={16} color="#6B7280" />
                      <Text style={styles.detailText}>{app.documents.length} document(s)</Text>
                    </View>
                  )}
                </View>

                {/* Approved: Payment Section */}
                {app.status === 'approved' && (
                  <View style={styles.actionContainer}>
                    {app.amount_due > 0 ? (
                      <>
                        <View style={styles.dueAmountBox}>
                          <Text style={styles.dueAmountLabel}>Amount Due</Text>
                          <Text style={styles.dueAmountValue}>
                            K{app.amount_due.toLocaleString()}
                          </Text>
                          <Text style={styles.dueBreakdown}>
                            Deposit: K{app.deposit_amount.toLocaleString()} + Rent: K{app.rent_amount.toLocaleString()}
                          </Text>
                        </View>

                        <TouchableOpacity style={styles.payNowButton} onPress={() => handlePayNow(app)}>
                          <Ionicons name="card" size={20} color={STAYIN.white} />
                          <Text style={styles.payNowButtonText}>
                            Pay Now • K{app.amount_due.toLocaleString()}
                          </Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <View style={styles.paidBox}>
                        <Ionicons name="checkmark-circle" size={28} color="#10B981" />
                        <Text style={styles.paidText}>Payment Completed</Text>
                        <TouchableOpacity style={styles.viewLeaseButton}>
                          <Ionicons name="document-text" size={18} color={STAYIN.white} />
                          <Text style={styles.viewLeaseText}>View Lease Agreement</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}

                {/* Pending Hint */}
                {app.status === 'pending' && (
                  <View style={styles.warningBox}>
                    <Ionicons name="time-outline" size={16} color="#F59E0B" />
                    <Text style={styles.warningText}>Waiting for landlord review</Text>
                  </View>
                )}

                {/* Rejected Message */}
                {app.status === 'rejected' && (
                  <View style={styles.rejectedBox}>
                    <Ionicons name="close-circle-outline" size={16} color="#EF4444" />
                    <Text style={styles.rejectedText}>
                      {app.notes || 'Application was not approved'}
                    </Text>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowPaymentModal(false);
          setPaymentMethod('');
          setPhoneNumber('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Complete Payment</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowPaymentModal(false);
                  setPaymentMethod('');
                  setPhoneNumber('');
                }}
              >
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Amount Summary */}
              <View style={styles.amountDisplay}>
                <Text style={styles.amountLabel}>Property</Text>
                <Text style={styles.propertyInModal}>{selectedApp?.property_title}</Text>
                <Text style={styles.amountValue}>
                  K{selectedApp?.amount_due.toLocaleString()}
                </Text>
                <Text style={styles.amountNote}>Initial payment (deposit + first month rent)</Text>
              </View>

              {/* Payment Methods */}
              <Text style={styles.sectionLabel}>Select Payment Method</Text>
              <View style={styles.methodsGrid}>
                {['MTN Mobile Money', 'Airtel Money', 'Zamtel Kwacha', 'Bank Transfer'].map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[
                      styles.methodCard,
                      paymentMethod === method && styles.selectedMethod,
                    ]}
                    onPress={() => setPaymentMethod(method)}
                  >
                    <Ionicons
                      name={method.includes('Bank') ? 'business' : 'phone-portrait'}
                      size={32}
                      color={paymentMethod === method ? STAYIN.primaryBlue : '#666'}
                    />
                    <Text
                      style={[
                        styles.methodText,
                        paymentMethod === method && styles.selectedMethodText,
                      ]}
                    >
                      {method}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Mobile Number Input */}
              {paymentMethod && !paymentMethod.includes('Bank') && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Mobile Money Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 0977123456"
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    maxLength={10}
                  />
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowPaymentModal(false);
                    setPaymentMethod('');
                    setPhoneNumber('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmButton} onPress={processPayment}>
                  <Text style={styles.confirmButtonText}>Pay Now</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#6B7280' },

  headerGradient: { paddingTop: 60, paddingBottom: 36, paddingHorizontal: 20 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#FFF' },
  headerSubtitle: { fontSize: 15, color: '#FFF', opacity: 0.9, marginTop: 4 },

  debugBox: { backgroundColor: '#FEF3C7', padding: 12, margin: 16, borderRadius: 8 },
  debugText: { fontSize: 12, color: '#92400E', marginBottom: 4 },
  debugButton: { backgroundColor: '#F59E0B', padding: 8, borderRadius: 6, marginTop: 8 },
  debugButtonText: { color: '#FFF', fontSize: 12, fontWeight: '600', textAlign: 'center' },

  chipsWrapper: { paddingVertical: 12, backgroundColor: '#F9FAFB' },
  chipsContent: { paddingHorizontal: 20, gap: 12 },
  compactChip: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    gap: 8,
  },
  compactChipText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  compactChipCount: { fontSize: 15, fontWeight: 'bold', color: STAYIN.primaryBlue },

  filterContainer: { flexDirection: 'row', padding: 16, gap: 8, backgroundColor: '#FFF' },
  filterTab: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center' },
  activeFilterTab: { backgroundColor: STAYIN.primaryBlue },
  filterText: { fontSize: 14, fontWeight: '600', color: '#4B5563' },
  activeFilterText: { color: '#FFF' },

  listContainer: { padding: 16, paddingTop: 0 },

  applicationCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEE',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  propertyInfo: { flex: 1 },
  propertyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
  propertyType: { fontSize: 13, color: '#6B7280', textTransform: 'capitalize' },

  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 24, gap: 6 },
  statusText: { fontSize: 13, fontWeight: '700' },

  cardDetails: { gap: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 14, color: '#4B5563' },

  actionContainer: { marginTop: 16 },

  dueAmountBox: {
    backgroundColor: '#FFFBEB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FBBF24',
  },
  dueAmountLabel: { fontSize: 14, color: '#92400E', marginBottom: 4 },
  dueAmountValue: { fontSize: 32, fontWeight: '800', color: '#B45309' },
  dueBreakdown: { fontSize: 13, color: '#92400E', marginTop: 8 },

  payNowButton: {
    flexDirection: 'row',
    backgroundColor: STAYIN.green,
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  payNowButtonText: { color: '#FFF', fontSize: 17, fontWeight: '700' },

  paidBox: { alignItems: 'center', paddingVertical: 20, gap: 12 },
  paidText: { fontSize: 18, fontWeight: '600', color: '#10B981' },
  viewLeaseButton: {
    flexDirection: 'row',
    backgroundColor: STAYIN.primaryBlue,
    padding: 14,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  viewLeaseText: { color: '#FFF', fontSize: 15, fontWeight: '600' },

  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF7ED',
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
    gap: 10,
    alignItems: 'center',
  },
  warningText: { fontSize: 14, color: '#F59E0B', flex: 1 },

  rejectedBox: {
    flexDirection: 'row',
    backgroundColor: '#FEE2E2',
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
    gap: 10,
    alignItems: 'center',
  },
  rejectedText: { fontSize: 14, color: '#EF4444', flex: 1 },

  emptyContainer: { alignItems: 'center', paddingVertical: 80, gap: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#374151' },
  emptyText: { fontSize: 15, color: '#6B7280', textAlign: 'center', paddingHorizontal: 40 },
  emptyButton: {
    flexDirection: 'row',
    backgroundColor: STAYIN.primaryBlue,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  emptyButtonText: { color: '#FFF', fontSize: 15, fontWeight: '600' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: '#EEE' },
  modalTitle: { fontSize: 22, fontWeight: '700', color: '#111827' },
  modalBody: { padding: 20 },

  amountDisplay: {
    backgroundColor: '#EBF8FF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  amountLabel: { fontSize: 14, color: '#666', marginBottom: 4 },
  propertyInModal: { fontSize: 18, fontWeight: '600', color: STAYIN.primaryBlue, marginVertical: 8 },
  amountValue: { fontSize: 40, fontWeight: '800', color: STAYIN.primaryBlue },
  amountNote: { fontSize: 14, color: '#666', marginTop: 8 },

  sectionLabel: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 },

  methodsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  methodCard: {
    width: '48%',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  selectedMethod: { borderColor: STAYIN.primaryBlue, backgroundColor: STAYIN.primaryBlue + '15' },
  methodText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  selectedMethodText: { color: STAYIN.primaryBlue },

  inputContainer: { marginVertical: 16 },
  inputLabel: { fontSize: 15, fontWeight: '600', marginBottom: 8, color: '#374151' },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, padding: 16, fontSize: 16, backgroundColor: '#FFF' },

  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelButton: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 2, borderColor: '#E5E7EB', alignItems: 'center' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#666' },
  confirmButton: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: STAYIN.primaryBlue, alignItems: 'center' },
  confirmButtonText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});