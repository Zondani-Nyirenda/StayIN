// ========================================
// FILE: app/(tenant)/property-detail.tsx
// Property Details with Application Submission
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
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import TenantService, { Property } from '../../services/tenantService';

const { width } = Dimensions.get('window');

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
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
    if (!property) return;

    Alert.alert(
      'Submit Application',
      `Apply for ${property.title}?\n\nDocuments attached: ${documents.length}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            try {
              // Get current user ID (you'll need to implement auth context)
              const tenantId = 2; // Replace with actual logged-in user ID
              
              await TenantService.submitApplication(
                tenantId,
                property.id,
                documents
              );

              Alert.alert(
                'Success',
                'Application submitted successfully!',
                [{ text: 'OK', onPress: () => router.back() }]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to submit application');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
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
    <View style={styles.container}>
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
          
          {/* Image Dots */}
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

          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>

        {/* Property Details */}
        <View style={styles.detailsContainer}>
          {/* Title & Price */}
          <View style={styles.headerSection}>
            <Text style={styles.title}>{property.title}</Text>
            <Text style={styles.price}>K{property.price_per_month.toLocaleString()}/mo</Text>
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={16} color="#6B7280" />
              <Text style={styles.address}>{property.address}, {property.city}</Text>
            </View>
          </View>

          {/* Property Type Badge */}
          <View style={styles.badgeContainer}>
            <View style={[styles.badge, styles[`${property.property_type}Badge`]]}>
              <Text style={styles.badgeText}>
                {property.property_type.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{property.status}</Text>
            </View>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            {property.bedrooms && (
              <View style={styles.statItem}>
                <Ionicons name="bed-outline" size={24} color="#4F46E5" />
                <Text style={styles.statText}>{property.bedrooms} Beds</Text>
              </View>
            )}
            {property.bathrooms && (
              <View style={styles.statItem}>
                <Ionicons name="water-outline" size={24} color="#4F46E5" />
                <Text style={styles.statText}>{property.bathrooms} Baths</Text>
              </View>
            )}
            {property.max_occupancy && (
              <View style={styles.statItem}>
                <Ionicons name="people-outline" size={24} color="#4F46E5" />
                <Text style={styles.statText}>{property.max_occupancy} Max</Text>
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{property.description}</Text>
          </View>

          {/* Amenities */}
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

          {/* Owner Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Property Owner</Text>
            <View style={styles.ownerCard}>
              <View style={styles.ownerAvatar}>
                <Ionicons name="person" size={24} color="#4F46E5" />
              </View>
              <Text style={styles.ownerName}>{property.owner_name || 'Property Owner'}</Text>
            </View>
          </View>

          {/* Documents Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Application Documents ({documents.length})
            </Text>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handlePickDocuments}
            >
              <Ionicons name="cloud-upload-outline" size={24} color="#4F46E5" />
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

          {/* Deposit Info */}
          {property.deposit_amount && (
            <View style={styles.infoCard}>
              <Ionicons name="information-circle-outline" size={24} color="#3B82F6" />
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

      {/* Apply Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.applyButton,
            property.status !== 'available' && styles.disabledButton,
          ]}
          onPress={handleApply}
          disabled={property.status !== 'available'}
        >
          <Text style={styles.applyButtonText}>
            {property.status === 'available' ? 'Apply Now' : 'Not Available'}
          </Text>
        </TouchableOpacity>
      </View>
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
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    height: 300,
    position: 'relative',
  },
  propertyImage: {
    width: width,
    height: 300,
  },
  placeholderImage: {
    width: width,
    height: 300,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#4F46E5',
    width: 24,
  },
  backButton: {
    position: 'absolute',
    top: 48,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailsContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  headerSection: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: '800',
    color: '#4F46E5',
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  address: {
    fontSize: 14,
    color: '#6B7280',
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  residentialBadge: {
    backgroundColor: '#DBEAFE',
  },
  student_boardingBadge: {
    backgroundColor: '#FEF3C7',
  },
  commercialBadge: {
    backgroundColor: '#D1FAE5',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#D1FAE5',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    textTransform: 'capitalize',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  amenityText: {
    fontSize: 13,
    color: '#166534',
    fontWeight: '500',
  },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  ownerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ownerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4F46E5',
    borderStyle: 'dashed',
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },
  documentsPreview: {
    marginTop: 12,
    gap: 8,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  documentName: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
  },
  infoCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#3B82F6',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  applyButton: {
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
  },
});