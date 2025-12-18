// ========================================
// FILE: app/(tenant)/payments.tsx
// Payment History & Make Payments
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
import { Ionicons } from '@expo/vector-icons';
import TenantService, { Payment } from '../../services/tenantService';

export default function PaymentsScreen() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const tenantId = 2; // Replace with actual logged-in user ID
      const data = await TenantService.getPaymentHistory(tenantId);
      setPayments(data);
    } catch (error) {
      console.error('Failed to load payments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPayments();
  };

  const handleMakePayment = () => {
    setShowPaymentModal(true);
  };

  const handleProcessPayment = async () => {
    if (!selectedPaymentMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    if (phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    Alert.alert(
      'Confirm Payment',
      `Pay K1,250 via ${selectedPaymentMethod}?\n\nPhone: ${phoneNumber}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const tenantId = 2;
              const propertyId = 1; // Example
              const transactionRef = `TXN${Date.now()}`;

              await TenantService.recordPayment(
                tenantId,
                propertyId,
                1250,
                'rent',
                transactionRef,
                selectedPaymentMethod
              );

              setShowPaymentModal(false);
              Alert.alert('Success', 'Payment processed successfully!');
              loadPayments();
            } catch (error) {
              Alert.alert('Error', 'Payment failed. Please try again.');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'failed':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getPaymentTypeIcon = (type: string) => {
    switch (type) {
      case 'rent':
        return 'home';
      case 'deposit':
        return 'shield-checkmark';
      case 'penalty':
        return 'warning';
      case 'application_fee':
        return 'document-text';
      default:
        return 'cash';
    }
  };

  const totalPaid = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingAmount = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

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
        <Text style={styles.headerTitle}>Payments</Text>
        <Text style={styles.headerSubtitle}>Manage your rental payments</Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, styles.totalCard]}>
          <Ionicons name="checkmark-circle" size={32} color="#10B981" />
          <Text style={styles.summaryAmount}>K{totalPaid.toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>Total Paid</Text>
        </View>

        <View style={[styles.summaryCard, styles.pendingCard]}>
          <Ionicons name="time" size={32} color="#F59E0B" />
          <Text style={styles.summaryAmount}>K{pendingAmount.toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
      </View>

      {/* Make Payment Button */}
      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.payButton} onPress={handleMakePayment}>
          <Ionicons name="card" size={20} color="#FFFFFF" />
          <Text style={styles.payButtonText}>Make Payment</Text>
        </TouchableOpacity>
      </View>

      {/* Payment History */}
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>Payment History</Text>
        <Text style={styles.historyCount}>{payments.length} transactions</Text>
      </View>

      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {payments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Payments Yet</Text>
            <Text style={styles.emptyText}>
              Your payment history will appear here
            </Text>
          </View>
        ) : (
          payments.map((payment) => (
            <View key={payment.id} style={styles.paymentCard}>
              <View style={styles.paymentHeader}>
                <View style={styles.paymentIconContainer}>
                  <Ionicons
                    name={getPaymentTypeIcon(payment.payment_type)}
                    size={24}
                    color="#4F46E5"
                  />
                </View>

                <View style={styles.paymentInfo}>
                  <Text style={styles.propertyName}>{payment.property_title}</Text>
                  <Text style={styles.paymentType}>
                    {payment.payment_type.replace('_', ' ')}
                  </Text>
                </View>

                <View style={styles.paymentAmountContainer}>
                  <Text style={styles.paymentAmount}>
                    K{payment.amount.toFixed(2)}
                  </Text>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: getStatusColor(payment.status) },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.paymentDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                  <Text style={styles.detailText}>
                    {new Date(payment.created_at).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>

                {payment.payment_method && (
                  <View style={styles.detailRow}>
                    <Ionicons name="card-outline" size={14} color="#6B7280" />
                    <Text style={styles.detailText}>{payment.payment_method}</Text>
                  </View>
                )}

                {payment.transaction_ref && (
                  <View style={styles.detailRow}>
                    <Ionicons name="document-text-outline" size={14} color="#6B7280" />
                    <Text style={styles.detailText} numberOfLines={1}>
                      Ref: {payment.transaction_ref}
                    </Text>
                  </View>
                )}
              </View>

              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: `${getStatusColor(payment.status)}20` },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(payment.status) },
                  ]}
                >
                  {payment.status.toUpperCase()}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Make Payment</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {/* Payment Amount */}
              <View style={styles.amountDisplay}>
                <Text style={styles.amountLabel}>Amount to Pay</Text>
                <Text style={styles.amountValue}>K1,250.00</Text>
                <Text style={styles.amountNote}>Rent for January 2025</Text>
              </View>

              {/* Payment Methods */}
              <Text style={styles.sectionLabel}>Select Payment Method</Text>
              <View style={styles.methodsGrid}>
                {['MTN Mobile Money', 'Airtel Money', 'Zamtel Money', 'Bank Transfer'].map(
                  (method) => (
                    <TouchableOpacity
                      key={method}
                      style={[
                        styles.methodCard,
                        selectedPaymentMethod === method && styles.selectedMethod,
                      ]}
                      onPress={() => setSelectedPaymentMethod(method)}
                    >
                      <Ionicons
                        name={
                          method.includes('Bank') ? 'business' : 'phone-portrait'
                        }
                        size={24}
                        color={
                          selectedPaymentMethod === method ? '#4F46E5' : '#6B7280'
                        }
                      />
                      <Text
                        style={[
                          styles.methodText,
                          selectedPaymentMethod === method &&
                            styles.selectedMethodText,
                        ]}
                      >
                        {method}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>

              {/* Phone Number Input */}
              {selectedPaymentMethod && !selectedPaymentMethod.includes('Bank') && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Mobile Money Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 0977123456"
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
                  onPress={() => setShowPaymentModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleProcessPayment}
                >
                  <Text style={styles.confirmButtonText}>Pay Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  totalCard: {
    backgroundColor: '#D1FAE5',
  },
  pendingCard: {
    backgroundColor: '#FEF3C7',
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  actionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  historyCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  paymentCard: {
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
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  paymentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentInfo: {
    flex: 1,
  },
  propertyName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  paymentType: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  paymentAmountContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  paymentDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalBody: {
    padding: 20,
  },
  amountDisplay: {
    backgroundColor: '#EEF2FF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  amountLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#4F46E5',
    marginBottom: 4,
  },
  amountNote: {
    fontSize: 13,
    color: '#6B7280',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  methodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  methodCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    gap: 8,
  },
  selectedMethod: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  methodText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  selectedMethodText: {
    color: '#4F46E5',
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  confirmButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});