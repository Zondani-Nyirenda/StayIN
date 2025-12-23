// ========================================
// FILE: app/(tenant)/property-detail.tsx
// Property Details - Fixed Application Submission
// ========================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import TenantService, { Property } from '../../services/tenantService';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';

const { width } = Dimensions.get('window');

const STAYIN = {
  primaryBlue: '#1E40AF',
  green: '#00AA00',
  orange: '#FFAA00',
  dark: '#000000',
  white: '#FFFFFF',
};

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [documents, setDocuments] = useState<string[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    loadPropertyDetails();
  }, [id]);

  const loadPropertyDetails = async () => {
    try {
      const data = await TenantService.getPropertyDetails(Number(id));
      setProperty(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load property details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handlePickDocuments = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        const uris = result.assets.map(asset => asset.uri);
        setDocuments([...documents, ...uris]);
        Alert.alert('Success', `${uris.length} document(s) added`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick documents');
    }
  };

  const handleApply = async () => {
    if (!property || !user?.id) {
      Alert.alert('Error', 'Unable to submit application. Please log in again.');
      return;
    }

    if (documents.length === 0) {
      Alert.alert(
        'No Documents',
        'Would you like to submit without documents? You can add them later.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Submit Anyway', onPress: () => submitApplication() },
        ]
      );
      return;
    }

    submitApplication();
  };

  const submitApplication = async () => {
    if (!property || !user?.id) return;

    Alert.alert(
      'Submit Application',
      `Apply for ${property.title}?\n\nDocuments: ${documents.length}\nApplication Fee: K${property.deposit_amount || 0}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            setSubmitting(true);
            try {
              const applicationId = await TenantService.submitApplication(
                user.id,
                property.id,
                documents
              );

              console.log('Application submitted successfully:', applicationId);

              Alert.alert(
                'Success!',
                'Your application has been submitted successfully. The landlord will review it shortly.',
                [
                  { 
                    text: 'View Applications', 
                    onPress: () => router.replace('/(tenant)/applications')
                  },
                  { 
                    text: 'OK', 
                    onPress: () => router.back()
                  }
                ]
              );
            } catch (error: any) {
              console.error('Application submission error:', error);
              Alert.alert(
                'Error', 
                error.message || 'Failed to submit application. Please try again.'
              );
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={STAYIN.primaryBlue} />
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Property not found</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" backgroundColor="transparent" translucent />

      <View style={styles.container}>
        <LinearGradient
          colors={[STAYIN.primaryBlue, '#0F172A']}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={28} color={STAYIN.white} />
            </TouchableOpacity>
            <Text style={styles.title} numberOfLines={2}>
              {property.title}
            </Text>
          </View>
        </LinearGradient>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Image Carousel */}
          <View style={styles.imageContainer}>
            {property.images.length > 0 ? (
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / width);
                  setActiveImageIndex(index);
                }}
              >
                {property.images.map((img, idx) => (
                  <Image
                    key={idx}
                    source={{ uri: img }}
                    style={styles.propertyImage}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="home-outline" size={64} color="#D1D5DB" />
              </View>
            )}

            {property.images.length > 1 && (
              <View style={styles.dotsContainer}>
                {property.images.map((_, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.dot,
                      idx === activeImageIndex && styles.activeDot,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.headerSection}>
              <Text style={styles.price}>K{property.price_per_month.toLocaleString()}/mo</Text>
              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={16} color="#6B7280" />
                <Text style={styles.address}>{property.address}, {property.city}</Text>
              </View>
            </View>

            <View style={styles.badgeContainer}>
              <View style={[
                styles.badge,
                property.property_type === 'residential' && styles.residentialBadge,
                property.property_type === 'student_boarding' && styles.student_boardingBadge,
                property.property_type === 'commercial' && styles.commercialBadge,
              ]}>
                <Text style={styles.badgeText}>
                  {property.property_type.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>
                  {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                </Text>
              </View>
            </View>

            {property.bedrooms && property.bathrooms && (
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Ionicons name="bed-outline" size={24} color={STAYIN.primaryBlue} />
                  <Text style={styles.statText}>{property.bedrooms} Beds</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="water-outline" size={24} color={STAYIN.primaryBlue} />
                  <Text style={styles.statText}>{property.bathrooms} Baths</Text>
                </View>
                {property.max_occupancy && (
                  <View style={styles.statItem}>
                    <Ionicons name="people-outline" size={24} color={STAYIN.primaryBlue} />
                    <Text style={styles.statText}>{property.max_occupancy} Max</Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{property.description}</Text>
            </View>

            {property.amenities.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Amenities</Text>
                <View style={styles.amenitiesGrid}>
                  {property.amenities.map((amenity, idx) => (
                    <View key={idx} style={styles.amenityChip}>
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                      <Text style={styles.amenityText}>{amenity}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Property Owner</Text>
              <View style={styles.ownerCard}>
                <View style={styles.ownerAvatar}>
                  <Ionicons name="person" size={24} color={STAYIN.primaryBlue} />
                </View>
                <Text style={styles.ownerName}>{property.owner_name || 'Property Owner'}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Application Documents ({documents.length})
              </Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handlePickDocuments}
              >
                <Ionicons name="cloud-upload-outline" size={24} color={STAYIN.primaryBlue} />
                <Text style={styles.uploadText}>Upload Verification Documents</Text>
              </TouchableOpacity>
              {documents.length > 0 && (
                <View style={styles.documentsPreview}>
                  {documents.map((doc, idx) => (
                    <View key={idx} style={styles.documentItem}>
                      <Ionicons name="document-text" size={20} color="#6B7280" />
                      <Text style={styles.documentName} numberOfLines={1}>
                        Document {idx + 1}
                      </Text>
                      <TouchableOpacity
                        onPress={() => setDocuments(documents.filter((_, i) => i !== idx))}
                      >
                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {property.deposit_amount && (
              <View style={styles.infoCard}>
                <Ionicons name="information-circle-outline" size={24} color={STAYIN.primaryBlue} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoTitle}>Deposit Required</Text>
                  <Text style={styles.infoText}>
                    K{property.deposit_amount.toLocaleString()} deposit required upon approval
                  </Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.applyButton,
              (property.status !== 'available' || submitting) && styles.disabledButton,
            ]}
            onPress={handleApply}
            disabled={property.status !== 'available' || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={STAYIN.white} />
            ) : (
              <Text style={styles.applyButtonText}>
                {property.status === 'available' ? 'Apply Now' : 'Not Available'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

// Styles remain the same
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  scrollView: { flex: 1 },
  headerGradient: { paddingTop: 60, paddingBottom: 36, paddingHorizontal: 20 },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255, 255, 255, 0.15)', justifyContent: 'center', alignItems: 'center' },
  title: { flex: 1, fontSize: 24, fontWeight: '800', color: STAYIN.white },
  imageContainer: { height: 300, position: 'relative' },
  propertyImage: { width: width, height: 300 },
  placeholderImage: { width: width, height: 300, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  dotsContainer: { position: 'absolute', bottom: 16, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D1D5DB', marginHorizontal: 4 },
  activeDot: { backgroundColor: STAYIN.white, width: 24 },
  detailsContainer: { padding: 16, paddingBottom: 100 },
  headerSection: { marginBottom: 16 },
  price: { fontSize: 28, fontWeight: '800', color: STAYIN.primaryBlue, marginBottom: 8 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  address: { fontSize: 14, color: '#6B7280' },
  badgeContainer: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  residentialBadge: { backgroundColor: '#DBEAFE' },
  student_boardingBadge: { backgroundColor: '#FEF3C7' },
  commercialBadge: { backgroundColor: '#D1FAE5' },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#1F2937' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#D1FAE5' },
  statusText: { fontSize: 12, fontWeight: '600', color: '#059669', textTransform: 'capitalize' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  statItem: { alignItems: 'center', gap: 4 },
  statText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
  description: { fontSize: 15, color: '#4B5563', lineHeight: 22 },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0FDF4', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#BBF7D0' },
  amenityText: { fontSize: 13, color: '#166534', fontWeight: '500' },
  ownerCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  ownerAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: STAYIN.primaryBlue + '20', justifyContent: 'center', alignItems: 'center' },
  ownerName: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  uploadButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: STAYIN.primaryBlue + '10', padding: 16, borderRadius: 12, borderWidth: 2, borderColor: STAYIN.primaryBlue, borderStyle: 'dashed' },
  uploadText: { fontSize: 14, fontWeight: '600', color: STAYIN.primaryBlue },
  documentsPreview: { marginTop: 12, gap: 8 },
  documentItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  documentName: { flex: 1, fontSize: 14, color: '#4B5563' },
  infoCard: { flexDirection: 'row', gap: 12, backgroundColor: STAYIN.primaryBlue + '10', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: STAYIN.primaryBlue + '40' },
  infoTextContainer: { flex: 1 },
  infoTitle: { fontSize: 14, fontWeight: '600', color: STAYIN.primaryBlue, marginBottom: 4 },
  infoText: { fontSize: 13, color: STAYIN.primaryBlue },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', padding: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 5 },
  applyButton: { backgroundColor: STAYIN.primaryBlue, padding: 16, borderRadius: 12, alignItems: 'center' },
  disabledButton: { backgroundColor: '#9CA3AF' },
  applyButtonText: { fontSize: 16, fontWeight: '700', color: STAYIN.white },
  errorText: { fontSize: 16, color: '#6B7280' },
});