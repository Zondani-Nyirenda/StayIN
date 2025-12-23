// ========================================
// FILE: app/(landlord)/applications.tsx
// Applications - StayIN Branded Gradient Header
// FIXED: Text strings must be rendered within a <Text> component
// ========================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';
import LandlordService, { ApplicationDetail } from '../../services/landlordService';
import { LinearGradient } from 'expo-linear-gradient';

// StayIN Brand Colors
const STAYIN = {
  primaryBlue: '#1E40AF',
  white: '#FFFFFF',
};

export default function ApplicationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [applications, setApplications] = useState<ApplicationDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');

  // Document Viewer
  const [modalVisible, setModalVisible] = useState(false);
  const [currentImages, setCurrentImages] = useState<string[]>([]);

  // Notes Input Modal
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [notesInput, setNotesInput] = useState('');
  const [currentApplicationId, setCurrentApplicationId] = useState<number | null>(null);
  const [currentAction, setCurrentAction] = useState<'approved' | 'rejected' | null>(null);

  useEffect(() => {
    loadApplications();
  }, [selectedStatus]);

  const loadApplications = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const data = await LandlordService.getApplications(
        user.id,
        selectedStatus === 'all' ? undefined : selectedStatus as any
      );
      setApplications(data);
    } catch (error) {
      console.error('Failed to load applications:', error);
      Alert.alert('Error', 'Could not load applications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (application: ApplicationDetail) => {
    Alert.alert(
      'Approve Application',
      `Approve ${application.tenant_name} for "${application.property_title}"?\n\nThis will mark the property as OCCUPIED.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => {
            setCurrentApplicationId(application.id);
            setCurrentAction('approved');
            setNotesInput('');
            setNotesModalVisible(true);
          },
        },
      ]
    );
  };

  const handleReject = (application: ApplicationDetail) => {
    Alert.alert(
      'Reject Application',
      `Reject application from ${application.tenant_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            setCurrentApplicationId(application.id);
            setCurrentAction('rejected');
            setNotesInput('');
            setNotesModalVisible(true);
          },
        },
      ]
    );
  };

  const submitDecision = async () => {
    if (!currentApplicationId || !currentAction) return;

    try {
      setNotesModalVisible(false);
      setLoading(true);

      await LandlordService.updateApplicationStatus(
        currentApplicationId,
        user!.id,
        currentAction,
        notesInput.trim() || undefined
      );

      await loadApplications();

      Alert.alert(
        'Success',
        `Application has been ${currentAction === 'approved' ? 'APPROVED' : 'REJECTED'}.${
          currentAction === 'approved' ? '\n\nProperty is now marked as OCCUPIED.' : ''
        }`
      );
    } catch (error: any) {
      console.error('Update failed:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to update application. Please try again.'
      );
    } finally {
      setCurrentApplicationId(null);
      setCurrentAction(null);
      setNotesInput('');
      setLoading(false);
    }
  };

  const viewTenantDetails = (application: ApplicationDetail) => {
    Alert.alert(
      'Tenant Details',
      `Name: ${application.tenant_name}\n` +
        `Email: ${application.tenant_email}\n` +
        `Phone: ${application.tenant_phone}\n\n` +
        `Property: ${application.property_title}\n` +
        `Fee Paid: K${application.application_fee}\n` +
        `Applied: ${new Date(application.created_at).toLocaleDateString()}\n\n` +
        `${application.notes ? `Landlord Notes: ${application.notes}` : 'No notes yet'}`
    );
  };

  const viewDocuments = (documentsJson: string) => {
    try {
      const docs = JSON.parse(documentsJson);
      if (Array.isArray(docs) && docs.length > 0) {
        setCurrentImages(docs);
        setModalVisible(true);
      } else {
        Alert.alert('No Documents', 'This application has no attached documents.');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not read documents.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return COLORS.warning;
      case 'approved': return COLORS.success;
      case 'rejected': return COLORS.error;
      default: return COLORS.gray[500];
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'time-outline';
      case 'approved': return 'checkmark-circle';
      case 'rejected': return 'close-circle';
      default: return 'help-circle-outline';
    }
  };

  const getCount = (status: string) => {
    if (status === 'all') return applications.length;
    return applications.filter(a => a.status === status).length;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={STAYIN.primaryBlue} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" backgroundColor="transparent" translucent />

      <View style={styles.container}>
        {/* StayIN Gradient Header */}
        <LinearGradient
          colors={[STAYIN.primaryBlue, '#0F172A']}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={28} color={STAYIN.white} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Applications</Text>

            <View style={{ width: 28 }} /> {/* Spacer */}
          </View>
        </LinearGradient>

        {/* Status Filter Chips */}
        <View style={styles.filterWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
            {['pending', 'approved', 'rejected', 'all'].map((status) => {
              const label = status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1);
              const count = getCount(status);
              const isActive = selectedStatus === status;

              return (
                <TouchableOpacity
                  key={status}
                  style={[styles.compactChip, isActive && styles.compactChipActive]}
                  onPress={() => setSelectedStatus(status)}
                >
                  <Text style={[styles.compactChipText, isActive && styles.compactChipTextActive]}>
                    {label}
                  </Text>
                  <Text style={[styles.compactChipCount, isActive && styles.compactChipCountActive]}>
                    {count}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Applications List */}
        <ScrollView style={styles.content}>
          {applications.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color={COLORS.gray[300]} />
              <Text style={styles.emptyStateText}>
                {selectedStatus === 'pending' ? 'No pending applications' : `No ${selectedStatus} applications`}
              </Text>
            </View>
          ) : (
            applications.map((application) => (
              <View key={application.id} style={styles.applicationCard}>
                <View style={styles.applicationHeader}>
                  <View style={styles.tenantAvatar}>
                    <Ionicons name="person" size={24} color={COLORS.primary} />
                  </View>
                  <View style={styles.applicationInfo}>
                    <Text style={styles.tenantName}>{application.tenant_name}</Text>
                    <Text style={styles.propertyTitle} numberOfLines={1}>
                      {application.property_title}
                    </Text>
                    <Text style={styles.applicationDate}>
                      Applied {new Date(application.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(application.status) + '15' }]}>
                    <Ionicons name={getStatusIcon(application.status) as any} size={16} color={getStatusColor(application.status)} />
                  </View>
                </View>

                <View style={styles.contactInfo}>
                  <View style={styles.contactItem}>
                    <Ionicons name="mail-outline" size={14} color={COLORS.gray[600]} />
                    <Text style={styles.contactText}>{application.tenant_email}</Text>
                  </View>
                  <View style={styles.contactItem}>
                    <Ionicons name="call-outline" size={14} color={COLORS.gray[600]} />
                    <Text style={styles.contactText}>{application.tenant_phone}</Text>
                  </View>
                </View>

                <View style={styles.feeRow}>
                  <Text style={styles.feeLabel}>Application Fee:</Text>
                  <Text style={styles.feeAmount}>K{application.application_fee}</Text>
                </View>

                {application.notes && (
                  <View style={styles.notesSection}>
                    <Text style={styles.notesLabel}>Notes:</Text>
                    <Text style={styles.notesText}>{application.notes}</Text>
                  </View>
                )}

                <View style={[styles.statusBar, { backgroundColor: getStatusColor(application.status) + '10' }]}>
                  <Ionicons name={getStatusIcon(application.status) as any} size={16} color={getStatusColor(application.status)} />
                  <Text style={[styles.statusText, { color: getStatusColor(application.status) }]}>
                    {application.status.toUpperCase()}
                  </Text>
                </View>

                {/* FIXED ACTION ROW - Single conditional, consistent layout */}
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.actionButton} onPress={() => viewTenantDetails(application)}>
                    <Ionicons name="information-circle-outline" size={18} color={COLORS.info} />
                    <Text style={styles.actionButtonText}>Details</Text>
                  </TouchableOpacity>

                  {application.status === 'pending' ? (
                    <>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.approveButton]}
                        onPress={() => handleApprove(application)}
                      >
                        <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.white} />
                        <Text style={[styles.actionButtonText, { color: COLORS.white }]}>Approve</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => handleReject(application)}
                      >
                        <Ionicons name="close-circle-outline" size={18} color={COLORS.white} />
                        <Text style={[styles.actionButtonText, { color: COLORS.white }]}>Reject</Text>
                      </TouchableOpacity>
                    </>
                  ) : application.status === 'approved' ? (
                    <View style={[styles.actionButton, styles.statusBadgeView]}>
                      <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                      <Text style={[styles.actionButtonText, styles.statusTextApproved]}>Approved</Text>
                    </View>
                  ) : application.status === 'rejected' ? (
                    <View style={[styles.actionButton, styles.statusBadgeView]}>
                      <Ionicons name="close-circle" size={18} color={COLORS.error} />
                      <Text style={[styles.actionButtonText, styles.statusTextRejected]}>Rejected</Text>
                    </View>
                  ) : null}
                </View>

                {application.documents && (
                  <TouchableOpacity
                    style={styles.documentsButton}
                    onPress={() => viewDocuments(application.documents)}
                  >
                    <Ionicons name="document-attach-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.documentsText}>
                      View Documents ({JSON.parse(application.documents)?.length || 0})
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </ScrollView>

        {/* Notes Input Modal */}
        <Modal visible={notesModalVisible} transparent animationType="fade">
          <View style={styles.notesModalOverlay}>
            <View style={styles.notesModalContent}>
              <Text style={styles.notesModalTitle}>
                {currentAction === 'approved' ? 'Approval Notes (Optional)' : 'Rejection Reason (Optional)'}
              </Text>
              <Text style={styles.notesModalSubtitle}>
                Add a message for the tenant:
              </Text>
              
              <TextInput
                style={styles.notesTextInput}
                placeholder="Enter notes here..."
                placeholderTextColor={COLORS.gray[400]}
                value={notesInput}
                onChangeText={setNotesInput}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <View style={styles.notesModalButtons}>
                <TouchableOpacity
                  style={[styles.notesModalButton, styles.cancelButton]}
                  onPress={() => {
                    setNotesModalVisible(false);
                    setCurrentApplicationId(null);
                    setCurrentAction(null);
                    setNotesInput('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.notesModalButton, styles.submitButton]}
                  onPress={submitDecision}
                >
                  <Text style={styles.submitButtonText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Document Viewer Modal */}
        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Application Documents</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color={COLORS.white} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={currentImages}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, i) => i.toString()}
              renderItem={({ item }) => (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: item }} style={styles.fullImage} resizeMode="contain" />
                </View>
              )}
            />
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

  // Header
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: STAYIN.white,
  },

  // Filters
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
  compactChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  compactChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  compactChipTextActive: {
    color: COLORS.white,
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
  compactChipCountActive: {
    color: COLORS.white,
    backgroundColor: COLORS.white + '40',
  },

  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray[500],
  },

  applicationCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  applicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tenantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  applicationInfo: {
    flex: 1,
  },
  tenantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  propertyTitle: {
    fontSize: 13,
    color: COLORS.gray[600],
    marginTop: 2,
  },
  applicationDate: {
    fontSize: 11,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  statusBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: {
    marginBottom: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  contactText: {
    fontSize: 12,
    color: COLORS.gray[700],
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  feeLabel: {
    fontSize: 13,
    color: COLORS.gray[600],
  },
  feeAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  notesSection: {
    backgroundColor: COLORS.info + '10',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.gray[600],
    marginBottom: 4,
  },
  notesText: {
    fontSize: 12,
    color: COLORS.gray[700],
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Action Row & Buttons
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.gray[100],
    gap: 6,
  },
  approveButton: {
    backgroundColor: COLORS.success,
  },
  rejectButton: {
    backgroundColor: COLORS.error,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  statusBadgeView: {
    backgroundColor: COLORS.gray[100],
  },
  statusTextApproved: {
    color: COLORS.success,
  },
  statusTextRejected: {
    color: COLORS.error,
  },

  documentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary + '10',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
  },
  documentsText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Notes Modal
  notesModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notesModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  notesModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 8,
  },
  notesModalSubtitle: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginBottom: 16,
  },
  notesTextInput: {
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: COLORS.gray[900],
    minHeight: 100,
    marginBottom: 20,
  },
  notesModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  notesModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.gray[100],
  },
  submitButton: {
    backgroundColor: COLORS.primary,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },

  // Document Viewer
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  imageContainer: {
    width: '100%',
    height: 600,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
});