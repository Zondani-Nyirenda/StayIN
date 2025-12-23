// ========================================
// FILE: app/(landlord)/properties.tsx
// Landlord Properties Management - StayIN Branded Gradient Header
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';
import { useAuth } from '../../contexts/AuthContext';
import LandlordService, { PropertyWithRevenue } from '../../services/landlordService';
import { LinearGradient } from 'expo-linear-gradient';

// StayIN Brand Colors
const STAYIN = {
  primaryBlue: '#1E40AF',
  white: '#FFFFFF',
};

export default function PropertiesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [properties, setProperties] = useState<PropertyWithRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    if (!user?.id) return;

    try {
      const data = await LandlordService.getPropertiesWithRevenue(user.id);
      setProperties(data);
    } catch (error) {
      console.error('Failed to load properties:', error);
      Alert.alert('Error', 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (propertyId: number, currentStatus: string) => {
    const statusOptions = ['available', 'occupied', 'maintenance', 'inactive'];
    
    Alert.alert(
      'Change Property Status',
      'Select new status:',
      [
        ...statusOptions.map(status => ({
          text: status.charAt(0).toUpperCase() + status.slice(1),
          onPress: async () => {
            try {
              await LandlordService.updatePropertyStatus(propertyId, user!.id, status);
              await loadProperties();
              Alert.alert('Success', 'Property status updated');
            } catch (error) {
              Alert.alert('Error', 'Failed to update status');
            }
          }
        })),
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleDeleteProperty = (propertyId: number, title: string) => {
    Alert.alert(
      'Delete Property',
      `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await LandlordService.deleteProperty(propertyId, user!.id);
              await loadProperties();
              Alert.alert('Success', 'Property deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete property');
            }
          }
        }
      ]
    );
  };

  const showRevenueBreakdown = (property: PropertyWithRevenue) => {
    Alert.alert(
      `Revenue: ${property.title}`,
      `Total Collected: K${property.total_collected.toLocaleString()}\n\n` +
      `Platform Commission (25%): -K${property.platform_commission.toLocaleString()}\n` +
      `Maintenance Fund (15%): -K${property.maintenance_fund.toLocaleString()}\n` +
      `Application Fees (10%): -K${property.application_fees.toLocaleString()}\n\n` +
      `Your Net Earnings (50%): K${property.net_to_owner.toLocaleString()}\n\n` +
      `Active Tenants: ${property.tenant_count}`
    );
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'residential': return COLORS.primary;
      case 'student_boarding': return COLORS.secondary;
      case 'commercial': return COLORS.accent;
      default: return COLORS.gray[500];
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return COLORS.success;
      case 'occupied': return COLORS.info;
      case 'maintenance': return COLORS.warning;
      case 'inactive': return COLORS.gray[500];
      default: return COLORS.gray[500];
    }
  };

  const filteredProperties = selectedType === 'all' 
    ? properties 
    : properties.filter(p => p.property_type === selectedType);

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

            <Text style={styles.headerTitle}>My Properties</Text>

            <TouchableOpacity 
              onPress={() => router.push('/(landlord)/add-property')}
            >
              <Ionicons name="add-circle" size={32} color={STAYIN.white} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Compact Chip-Style Type Filter */}
        <View style={styles.filterWrapper}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.filterContent}
          >
            {['all', 'residential', 'student_boarding', 'commercial'].map((type) => {
              const count = type === 'all' 
                ? properties.length 
                : properties.filter(p => p.property_type === type).length;

              const label = type === 'all' 
                ? 'All' 
                : type === 'residential' 
                  ? 'Residential'
                  : type === 'student_boarding'
                    ? 'Student'
                    : 'Commercial';

              const isActive = selectedType === type;

              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.compactChip,
                    isActive && styles.compactChipActive,
                  ]}
                  onPress={() => setSelectedType(type)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.compactChipText,
                    isActive && styles.compactChipTextActive,
                  ]}>
                    {label}
                  </Text>
                  <Text style={[
                    styles.compactChipCount,
                    isActive && styles.compactChipCountActive,
                  ]}>
                    {count}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Properties List */}
        <ScrollView style={styles.content}>
          {filteredProperties.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="home-outline" size={64} color={COLORS.gray[300]} />
              <Text style={styles.emptyStateText}>No properties yet</Text>
              <TouchableOpacity 
                style={styles.addPropertyButton}
                onPress={() => router.push('/(landlord)/add-property')}
              >
                <Ionicons name="add-circle-outline" size={20} color={STAYIN.white} />
                <Text style={styles.addPropertyButtonText}>Add Your First Property</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredProperties.map(property => (
              <View key={property.id} style={styles.propertyCard}>
                {/* Property Header */}
                <View style={styles.propertyHeader}>
                  <View style={styles.propertyInfo}>
                    <Text style={styles.propertyTitle} numberOfLines={1}>{property.title}</Text>
                    <Text style={styles.propertyAddress} numberOfLines={1}>
                      {property.address}, {property.city}
                    </Text>
                  </View>
                  <View style={styles.badges}>
                    <View style={[styles.badge, { backgroundColor: getTypeColor(property.property_type) + '15' }]}>
                      <Text style={[styles.badgeText, { color: getTypeColor(property.property_type) }]}>
                        {property.property_type.replace('_', ' ')}
                      </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: getStatusColor(property.status) + '15' }]}>
                      <Text style={[styles.badgeText, { color: getStatusColor(property.status) }]}>
                        {property.status}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Property Details */}
                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <Ionicons name="bed-outline" size={16} color={COLORS.gray[600]} />
                    <Text style={styles.detailText}>{property.bedrooms || 0} beds</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="water-outline" size={16} color={COLORS.gray[600]} />
                    <Text style={styles.detailText}>{property.bathrooms || 0} baths</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="people-outline" size={16} color={COLORS.gray[600]} />
                    <Text style={styles.detailText}>{property.max_occupancy || 0} max</Text>
                  </View>
                </View>

                {/* Price */}
                <Text style={styles.price}>K{property.price_per_month.toLocaleString()}/month</Text>

                {/* Revenue Breakdown */}
                <View style={styles.revenueSection}>
                  <TouchableOpacity 
                    style={styles.revenueSummary}
                    onPress={() => showRevenueBreakdown(property)}
                  >
                    <View>
                      <Text style={styles.revenueLabel}>Total Collected</Text>
                      <Text style={styles.revenueAmount}>K{property.total_collected.toLocaleString()}</Text>
                    </View>
                    <View>
                      <Text style={styles.netLabel}>Your Net</Text>
                      <Text style={styles.netAmount}>K{property.net_to_owner.toLocaleString()}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
                  </TouchableOpacity>

                  <View style={styles.miniBreakdown}>
                    <View style={styles.miniBreakdownItem}>
                      <Text style={styles.miniBreakdownLabel}>Platform (25%)</Text>
                      <Text style={styles.miniBreakdownValue}>-K{property.platform_commission.toLocaleString()}</Text>
                    </View>
                    <View style={styles.miniBreakdownItem}>
                      <Text style={styles.miniBreakdownLabel}>Maintenance (15%)</Text>
                      <Text style={styles.miniBreakdownValue}>-K{property.maintenance_fund.toLocaleString()}</Text>
                    </View>
                    <View style={styles.miniBreakdownItem}>
                      <Text style={styles.miniBreakdownLabel}>App Fee (10%)</Text>
                      <Text style={styles.miniBreakdownValue}>-K{property.application_fees.toLocaleString()}</Text>
                    </View>
                  </View>
                </View>

                {/* Tenants */}
                {property.tenant_count > 0 && (
                  <View style={styles.tenantInfo}>
                    <Ionicons name="people" size={16} color={COLORS.success} />
                    <Text style={styles.tenantText}>
                      {property.tenant_count} active tenant{property.tenant_count > 1 ? 's' : ''}
                    </Text>
                  </View>
                )}

                {/* Actions */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push(`/(landlord)/edit-property?id=${property.id}`)}
                  >
                    <Ionicons name="create-outline" size={18} color={COLORS.primary} />
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleStatusChange(property.id, property.status)}
                  >
                    <Ionicons name="swap-horizontal-outline" size={18} color={COLORS.info} />
                    <Text style={styles.actionButtonText}>Status</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteProperty(property.id, property.title)}
                  >
                    <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                    <Text style={[styles.actionButtonText, { color: COLORS.error }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
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

  // StayIN Gradient Header
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

  // Compact Chip-Style Type Filter
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
    marginBottom: 24,
  },
  addPropertyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  addPropertyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
  propertyCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  propertyHeader: {
    marginBottom: 12,
  },
  propertyInfo: {
    marginBottom: 8,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  propertyAddress: {
    fontSize: 13,
    color: COLORS.gray[600],
    marginTop: 2,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: COLORS.gray[600],
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 12,
  },
  revenueSection: {
    backgroundColor: COLORS.gray[50],
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  revenueSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  revenueLabel: {
    fontSize: 11,
    color: COLORS.gray[600],
  },
  revenueAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  netLabel: {
    fontSize: 11,
    color: COLORS.gray[600],
    textAlign: 'right',
  },
  netAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  miniBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  miniBreakdownItem: {
    flex: 1,
  },
  miniBreakdownLabel: {
    fontSize: 9,
    color: COLORS.gray[500],
  },
  miniBreakdownValue: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.error,
  },
  tenantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '10',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  tenantText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.success,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.gray[100],
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
});