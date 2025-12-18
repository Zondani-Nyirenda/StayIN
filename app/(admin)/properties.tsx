// ========================================
// FILE: app/(admin)/properties.tsx
// Properties Management Screen
// ========================================
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';
import AdminService, { Property } from '../../services/adminService';

export default function PropertiesScreen() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadProperties = async () => {
    try {
      const allProperties = await AdminService.getAllProperties();
      setProperties(allProperties);
      setFilteredProperties(allProperties);
    } catch (error) {
      console.error('Failed to load properties:', error);
      Alert.alert('Error', 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [selectedType, searchQuery, properties]);

  const filterProperties = () => {
    let filtered = properties;

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(p => p.property_type === selectedType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(query) ||
        p.address.toLowerCase().includes(query) ||
        p.city.toLowerCase().includes(query) ||
        p.owner_name?.toLowerCase().includes(query)
      );
    }

    setFilteredProperties(filtered);
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
              await AdminService.updatePropertyStatus(propertyId, status);
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
              await AdminService.deleteProperty(propertyId);
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

  const viewPropertyRevenue = async (propertyId: number) => {
    try {
      const revenue = await AdminService.getPropertyRevenue(propertyId);
      Alert.alert(
        'Property Revenue',
        `Rent Collected: K${revenue?.rent_collected || 0}\nDeposits: K${revenue?.deposits || 0}\nPenalties: K${revenue?.penalties || 0}\n\nTotal Payments: ${revenue?.total_payments || 0}`,
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to load revenue data');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'residential': return COLORS.primary;
      case 'student_boarding': return COLORS.secondary;
      case 'commercial': return COLORS.accent;
      default: return COLORS.gray[500];
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'residential': return 'home';
      case 'student_boarding': return 'school';
      case 'commercial': return 'business';
      default: return 'home-outline';
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
        <Text style={styles.headerTitle}>Properties</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.gray[400]} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search properties..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Type Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {['all', 'residential', 'student_boarding', 'commercial'].map(type => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterChip,
              selectedType === type && styles.filterChipActive
            ]}
            onPress={() => setSelectedType(type)}
          >
            <Text style={[
              styles.filterChipText,
              selectedType === type && styles.filterChipTextActive
            ]}>
              {type === 'all' ? 'All' : type.replace('_', ' ')} ({type === 'all' ? properties.length : properties.filter(p => p.property_type === type).length})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Properties List */}
      <ScrollView style={styles.content}>
        {filteredProperties.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="home-outline" size={64} color={COLORS.gray[300]} />
            <Text style={styles.emptyStateText}>No properties found</Text>
          </View>
        ) : (
          filteredProperties.map(property => (
            <View key={property.id} style={styles.propertyCard}>
              {/* Property Header */}
              <View style={styles.propertyHeader}>
                <View style={[styles.propertyIcon, { backgroundColor: getTypeColor(property.property_type) + '20' }]}>
                  <Ionicons name={getTypeIcon(property.property_type) as any} size={24} color={getTypeColor(property.property_type)} />
                </View>
                <View style={styles.propertyInfo}>
                  <Text style={styles.propertyTitle} numberOfLines={1}>{property.title}</Text>
                  <Text style={styles.propertyAddress} numberOfLines={1}>
                    {property.address}, {property.city}
                  </Text>
                  <Text style={styles.propertyOwner}>
                    Owner: {property.owner_name || 'Unknown'}
                  </Text>
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

              {/* Price and Badges */}
              <View style={styles.priceRow}>
                <Text style={styles.price}>K{property.price_per_month.toLocaleString()}/mo</Text>
                <View style={styles.badgeRow}>
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

              {/* Actions */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleStatusChange(property.id, property.status)}
                >
                  <Ionicons name="swap-horizontal-outline" size={18} color={COLORS.info} />
                  <Text style={styles.actionButtonText}>Status</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => viewPropertyRevenue(property.id)}
                >
                  <Ionicons name="cash-outline" size={18} color={COLORS.success} />
                  <Text style={styles.actionButtonText}>Revenue</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteProperty(property.id, property.title)}
                >
                  <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                  <Text style={[styles.actionButtonText, { color: COLORS.error }]}>Delete</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.addedDate}>
                Added: {new Date(property.created_at).toLocaleDateString()}
              </Text>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.gray[900],
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray[600],
    textTransform: 'capitalize',
  },
  filterChipTextActive: {
    color: COLORS.white,
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
  propertyCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  propertyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  propertyIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  propertyInfo: {
    flex: 1,
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
  propertyOwner: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
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
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  badgeRow: {
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
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.gray[100],
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  addedDate: {
    fontSize: 11,
    color: COLORS.gray[500],
    marginTop: 4,
  },
});