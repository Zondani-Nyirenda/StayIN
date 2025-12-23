// ========================================
// FILE: app/(tenant)/agreements.tsx
// Digital Tenancy Agreements - StayIN Branded Header
// ========================================
import React, { useState, useEffect, useRef } from 'react';
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
  Dimensions,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import Svg, { Path } from 'react-native-svg';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// StayIN Brand Colors
const STAYIN = {
  primaryBlue: '#1E40AF',
  white: '#FFFFFF',
};

interface Agreement {
  id: number;
  property_id: number;
  property_title: string;
  property_address: string;
  landlord_name: string;
  tenant_name: string;
  rent_amount: number;
  deposit_amount: number;
  start_date: string;
  end_date: string;
  status: 'pending' | 'signed' | 'active' | 'expired';
  signed_date: string | null;
  signature_data: string | null;
  terms: string[];
  created_at: string;
}

export default function AgreementsScreen() {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null);
  const [showSignModal, setShowSignModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [signature, setSignature] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const agreementRef = useRef(null);

  useEffect(() => {
    loadAgreements();
  }, []);

  const loadAgreements = async () => {
    try {
      // Mock data - replace with actual database call
      const mockAgreements: Agreement[] = [
        {
          id: 1,
          property_id: 1,
          property_title: 'Modern 2BR Apartment',
          property_address: 'Plot 123, Roma, Lusaka',
          landlord_name: 'Test Landlord',
          tenant_name: 'Test Tenant',
          rent_amount: 1250,
          deposit_amount: 1250,
          start_date: '2025-01-01',
          end_date: '2025-12-31',
          status: 'pending',
          signed_date: null,
          signature_data: null,
          terms: [
            'The tenant agrees to pay rent of K1,250 per month on or before the 5th day of each month.',
            'A security deposit of K1,250 is required and will be refunded at the end of the tenancy, subject to property inspection.',
            'The tenant is responsible for maintaining the property in good condition.',
            'The landlord is responsible for major repairs and structural maintenance.',
            'The tenant must give 30 days written notice before vacating the property.',
            'No subletting is allowed without prior written consent from the landlord.',
            'The tenant agrees to use the property for residential purposes only.',
            'Utilities (water, electricity) are the responsibility of the tenant unless otherwise stated.',
            'The landlord reserves the right to inspect the property with 24 hours notice.',
            'Any modifications to the property require written approval from the landlord.',
          ],
          created_at: '2024-12-15',
        },
        {
          id: 2,
          property_id: 2,
          property_title: 'Student Room - UNZA Area',
          property_address: 'House 45, Great East Road, Lusaka',
          landlord_name: 'Test Landlord',
          tenant_name: 'Test Tenant',
          rent_amount: 800,
          deposit_amount: 800,
          start_date: '2024-11-01',
          end_date: '2025-10-31',
          status: 'signed',
          signed_date: '2024-11-15',
          signature_data: 'mock_signature',
          terms: [
            'Monthly rent of K800 due by the 1st of each month.',
            'Security deposit of K800 required.',
            'Shared facilities with other tenants.',
            'Quiet hours from 10 PM to 7 AM.',
            'No overnight guests without prior approval.',
          ],
          created_at: '2024-10-20',
        },
      ];

      setAgreements(mockAgreements);
    } catch (error) {
      console.error('Failed to load agreements:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAgreements();
  };

  const handleViewTerms = (agreement: Agreement) => {
    setSelectedAgreement(agreement);
    setShowTermsModal(true);
  };

  const handleSignAgreement = (agreement: Agreement) => {
    setSelectedAgreement(agreement);
    setShowSignModal(true);
  };

  const handleDownloadAgreement = async (agreement: Agreement) => {
    try {
      if (agreementRef.current) {
        const uri = await captureRef(agreementRef, {
          format: 'png',
          quality: 1,
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'Save Agreement',
            UTI: 'public.png',
          });
        }
      }

      Alert.alert('Success', 'Agreement downloaded successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to download agreement');
      console.error('Download error:', error);
    }
  };

  const handleClearSignature = () => {
    setSignature([]);
    setCurrentPath('');
  };

  const handleSaveSignature = () => {
    if (signature.length === 0) {
      Alert.alert('Error', 'Please provide your signature');
      return;
    }

    Alert.alert(
      'Confirm Signature',
      'By signing this agreement, you agree to all terms and conditions. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Agreement',
          onPress: async () => {
            try {
              const signatureData = JSON.stringify(signature);
              
              const updatedAgreements = agreements.map(a =>
                a.id === selectedAgreement?.id
                  ? {
                      ...a,
                      status: 'signed' as const,
                      signed_date: new Date().toISOString(),
                      signature_data: signatureData,
                    }
                  : a
              );

              setAgreements(updatedAgreements);
              setShowSignModal(false);
              handleClearSignature();
              
              Alert.alert(
                'Success',
                'Agreement signed successfully!',
                [
                  {
                    text: 'Download',
                    onPress: () => {
                      const signedAgreement = updatedAgreements.find(
                        a => a.id === selectedAgreement?.id
                      );
                      if (signedAgreement) {
                        handleDownloadAgreement(signedAgreement);
                      }
                    },
                  },
                  { text: 'OK' },
                ]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to save signature');
            }
          },
        },
      ]
    );
  };

  const panGesture = Gesture.Pan()
    .onStart((event) => {
      const newPath = `M ${event.x} ${event.y}`;
      setCurrentPath(newPath);
    })
    .onUpdate((event) => {
      setCurrentPath(prev => `${prev} L ${event.x} ${event.y}`);
    })
    .onEnd(() => {
      if (currentPath) {
        setSignature(prev => [...prev, currentPath]);
        setCurrentPath('');
      }
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'signed':
      case 'active':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'expired':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'signed':
      case 'active':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'expired':
        return 'close-circle';
      default:
        return 'document';
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={STAYIN.primaryBlue} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" backgroundColor="transparent" translucent />

      <GestureHandlerRootView style={styles.container}>
        {/* StayIN Gradient Header */}
        <LinearGradient
          colors={[STAYIN.primaryBlue, '#0F172A']}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Tenancy Agreements</Text>
              <Text style={styles.headerSubtitle}>View and sign rental agreements</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>
              {agreements.filter(a => a.status === 'signed').length}
            </Text>
            <Text style={styles.statLabel}>Signed</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>
              {agreements.filter(a => a.status === 'pending').length}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{agreements.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        {/* Agreements List */}
        <ScrollView
          style={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {agreements.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No Agreements</Text>
              <Text style={styles.emptyText}>
                Your tenancy agreements will appear here
              </Text>
            </View>
          ) : (
            agreements.map((agreement) => (
              <View key={agreement.id} style={styles.agreementCard}>
                {/* Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="document-text" size={28} color={STAYIN.primaryBlue} />
                  </View>
                  <View style={styles.headerInfo}>
                    <Text style={styles.propertyTitle}>
                      {agreement.property_title}
                    </Text>
                    <Text style={styles.propertyAddress}>
                      {agreement.property_address}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: `${getStatusColor(agreement.status)}20` },
                    ]}
                  >
                    <Ionicons
                      name={getStatusIcon(agreement.status)}
                      size={14}
                      color={getStatusColor(agreement.status)}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(agreement.status) },
                      ]}
                    >
                      {agreement.status}
                    </Text>
                  </View>
                </View>

                {/* Details */}
                <View style={styles.detailsContainer}>
                  <View style={styles.detailRow}>
                    <Ionicons name="person-outline" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>
                      Landlord: {agreement.landlord_name}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="cash-outline" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>
                      Rent: K{agreement.rent_amount}/month
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>
                      Period: {new Date(agreement.start_date).toLocaleDateString()} -{' '}
                      {new Date(agreement.end_date).toLocaleDateString()}
                    </Text>
                  </View>

                  {agreement.signed_date && (
                    <View style={styles.detailRow}>
                      <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
                      <Text style={[styles.detailText, { color: '#10B981' }]}>
                        Signed: {new Date(agreement.signed_date).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Actions */}
                <View style={styles.actionsContainer}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleViewTerms(agreement)}
                  >
                    <Ionicons name="eye-outline" size={18} color={STAYIN.primaryBlue} />
                    <Text style={styles.actionButtonText}>View Terms</Text>
                  </TouchableOpacity>

                  {agreement.status === 'pending' ? (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.signButton]}
                      onPress={() => handleSignAgreement(agreement)}
                    >
                      <Ionicons name="create-outline" size={18} color={STAYIN.white} />
                      <Text style={styles.signButtonText}>Sign Now</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDownloadAgreement(agreement)}
                    >
                      <Ionicons name="download-outline" size={18} color="#10B981" />
                      <Text style={[styles.actionButtonText, { color: '#10B981' }]}>
                        Download
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* Terms Modal */}
        <Modal
          visible={showTermsModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowTermsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.termsModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Agreement Terms</Text>
                <TouchableOpacity onPress={() => setShowTermsModal(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.termsContent} ref={agreementRef}>
                <View style={styles.termsDocument}>
                  <Text style={styles.documentTitle}>TENANCY AGREEMENT</Text>

                  <View style={styles.documentSection}>
                    <Text style={styles.sectionTitle}>PROPERTY DETAILS</Text>
                    <Text style={styles.sectionText}>
                      Property: {selectedAgreement?.property_title}
                    </Text>
                    <Text style={styles.sectionText}>
                      Address: {selectedAgreement?.property_address}
                    </Text>
                  </View>

                  <View style={styles.documentSection}>
                    <Text style={styles.sectionTitle}>PARTIES</Text>
                    <Text style={styles.sectionText}>
                      Landlord: {selectedAgreement?.landlord_name}
                    </Text>
                    <Text style={styles.sectionText}>
                      Tenant: {selectedAgreement?.tenant_name}
                    </Text>
                  </View>

                  <View style={styles.documentSection}>
                    <Text style={styles.sectionTitle}>FINANCIAL TERMS</Text>
                    <Text style={styles.sectionText}>
                      Monthly Rent: K{selectedAgreement?.rent_amount}
                    </Text>
                    <Text style={styles.sectionText}>
                      Security Deposit: K{selectedAgreement?.deposit_amount}
                    </Text>
                  </View>

                  <View style={styles.documentSection}>
                    <Text style={styles.sectionTitle}>LEASE PERIOD</Text>
                    <Text style={styles.sectionText}>
                      Start Date:{' '}
                      {selectedAgreement?.start_date &&
                        new Date(selectedAgreement.start_date).toLocaleDateString()}
                    </Text>
                    <Text style={styles.sectionText}>
                      End Date:{' '}
                      {selectedAgreement?.end_date &&
                        new Date(selectedAgreement.end_date).toLocaleDateString()}
                    </Text>
                  </View>

                  <View style={styles.documentSection}>
                    <Text style={styles.sectionTitle}>TERMS AND CONDITIONS</Text>
                    {selectedAgreement?.terms.map((term, index) => (
                      <View key={index} style={styles.termItem}>
                        <Text style={styles.termNumber}>{index + 1}.</Text>
                        <Text style={styles.termText}>{term}</Text>
                      </View>
                    ))}
                  </View>

                  {selectedAgreement?.status === 'signed' && (
                    <View style={styles.documentSection}>
                      <Text style={styles.sectionTitle}>SIGNATURE</Text>
                      <View style={styles.signatureBox}>
                        <Text style={styles.signatureLabel}>
                          Tenant Signature (Digital)
                        </Text>
                        <Text style={styles.signatureName}>
                          {selectedAgreement.tenant_name}
                        </Text>
                        <Text style={styles.signatureDate}>
                          Signed on:{' '}
                          {selectedAgreement.signed_date &&
                            new Date(selectedAgreement.signed_date).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Signature Modal */}
        <Modal
          visible={showSignModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowSignModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.signatureModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Sign Agreement</Text>
                <TouchableOpacity onPress={() => setShowSignModal(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.signatureInfo}>
                <Ionicons name="information-circle" size={24} color={STAYIN.primaryBlue} />
                <Text style={styles.signatureInfoText}>
                  Please sign below using your finger or stylus. Your signature will
                  be legally binding.
                </Text>
              </View>

              <View style={styles.signaturePadContainer}>
                <GestureDetector gesture={panGesture}>
                  <View style={styles.signaturePad}>
                    <Svg height="300" width={width - 80}>
                      {signature.map((path, index) => (
                        <Path
                          key={index}
                          d={path}
                          stroke="#1F2937"
                          strokeWidth={3}
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      ))}
                      {currentPath && (
                        <Path
                          d={currentPath}
                          stroke="#1F2937"
                          strokeWidth={3}
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}
                    </Svg>
                    {signature.length === 0 && !currentPath && (
                      <View style={styles.signaturePlaceholder}>
                        <Ionicons name="create-outline" size={32} color="#D1D5DB" />
                        <Text style={styles.placeholderText}>Sign Here</Text>
                      </View>
                    )}
                  </View>
                </GestureDetector>
              </View>

              <View style={styles.signatureActions}>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={handleClearSignature}
                >
                  <Ionicons name="refresh" size={20} color="#6B7280" />
                  <Text style={styles.clearButtonText}>Clear</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveSignatureButton}
                  onPress={handleSaveSignature}
                >
                  <Ionicons name="checkmark" size={20} color={STAYIN.white} />
                  <Text style={styles.saveSignatureText}>Sign & Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </GestureHandlerRootView>
    </>
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

  // StayIN Gradient Header
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 36,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: STAYIN.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: STAYIN.white,
    opacity: 0.9,
  },

  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: STAYIN.primaryBlue,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },

  listContainer: {
    flex: 1,
    padding: 16,
  },
  agreementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: STAYIN.primaryBlue + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  propertyAddress: {
    fontSize: 13,
    color: '#6B7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  detailsContainer: {
    gap: 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: STAYIN.primaryBlue,
    backgroundColor: '#FFFFFF',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: STAYIN.primaryBlue,
  },
  signButton: {
    backgroundColor: STAYIN.primaryBlue,
    borderColor: STAYIN.primaryBlue,
  },
  signButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: STAYIN.white,
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
  termsModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  signatureModal: {
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
  termsContent: {
    flex: 1,
  },
  termsDocument: {
    padding: 24,
  },
  documentTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 24,
    textTransform: 'uppercase',
  },
  documentSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  sectionText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 6,
  },
  termItem: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingRight: 8,
  },
  termNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: STAYIN.primaryBlue,
    marginRight: 8,
    minWidth: 24,
  },
  termText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  signatureBox: {
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  signatureLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  signatureName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  signatureDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  signatureInfo: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: STAYIN.primaryBlue + '10',
    padding: 16,
    margin: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: STAYIN.primaryBlue + '40',
  },
  signatureInfoText: {
    flex: 1,
    fontSize: 13,
    color: STAYIN.primaryBlue,
    lineHeight: 18,
  },
  signaturePadContainer: {
    margin: 20,
  },
  signaturePad: {
    height: 300,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signaturePlaceholder: {
    position: 'absolute',
    alignItems: 'center',
    gap: 8,
  },
  placeholderText: {
    fontSize: 16,
    color: '#D1D5DB',
    fontWeight: '500',
  },
  signatureActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  clearButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveSignatureButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: STAYIN.primaryBlue,
    shadowColor: STAYIN.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveSignatureText: {
    fontSize: 15,
    fontWeight: '700',
    color: STAYIN.white,
  },
});