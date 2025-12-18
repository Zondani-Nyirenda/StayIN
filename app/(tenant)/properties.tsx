// ========================================
// FILE: app/(tenant)/properties.tsx
// Tenant Browse Properties - Compact Chip Filter
// ========================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';
import TenantService from '../../services/tenantService';

interface Property {
  id: number;
  title: string;
  address: string;
  city: string;
  price_per_month: number;
  property_type: string;
  images?: string[];
}

const TYPES = ['all', 'residential', 'student_boarding', 'commercial'];

export default function PropertiesScreen() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    loadProperties();
  }, [selectedType]);

  const loadProperties = async () => {
    setLoading(true);
    try {
      const type = selectedType === 'all' ? undefined : (selectedType as 'residential' | 'student_boarding' | 'commercial');
      const data = await TenantService.getAvailableProperties(type);
      setProperties(data);
    } catch (error) {
      console.error('Failed to load properties:', error);
    } finally {
      setLoading(false);
    }
  };

  // Count properties by type
  const getCount = (type: string) => {
    if (type === 'all') return properties.length;
    return properties.filter(p => p.property_type === type).length;
  };

  const getLabel = (type: string) => {
    switch (type) {
      case 'all': return 'All';
      case 'residential': return 'Residential';
      case 'student_boarding': return 'Student';
      case 'commercial': return 'Commercial';
      default: return type;
    }
  };

  const renderProperty = ({ item }: { item: Property }) => (
    <TouchableOpacity
      style={styles.propertyCard}
      onPress={() => router.push(`../property-detail?id=${item.id}`)}
    >
      {item.images?.[0] ? (
        <Image source={{ uri: item.images[0] }} style={styles.propertyImage} />
      ) : (
        <View style={[styles.propertyImage, styles.placeholderImage]}>
          <Ionicons name="home" size={40} color={COLORS.gray[400]} />
        </View>
      )}
      <View style={styles.propertyInfo}>
        <Text style={styles.propertyTitle}>{item.title}</Text>
        <Text style={styles.propertyAddress}>{item.address}, {item.city}</Text>
        <View style={styles.propertyFooter}>
          <Text style={styles.price}>K{item.price_per_month.toLocaleString()}/mo</Text>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>
              {item.property_type.replace('_', ' ')}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Browse Properties</Text>
      </View>

      {/* Compact Chip Filter with Counts */}
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {TYPES.map((type) => {
            const label = getLabel(type);
            const count = getCount(type);
            const isActive = selectedType === type;

            return (
              <TouchableOpacity
                key={type}
                style={[styles.compactChip, isActive && styles.compactChipActive]}
                onPress={() => setSelectedType(type)}
                activeOpacity={0.7}
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

      {/* Properties List */}
      <FlatList
        data={properties}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProperty}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="home-outline" size={64} color={COLORS.gray[300]} />
            <Text style={styles.emptyText}>No properties found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.gray[900] },

  // Compact Chip Filter
  filterWrapper: {
    paddingVertical: 12,
    backgroundColor: COLORS.background,
  },
  filterContent: {
    paddingHorizontal: 20,
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

  list: { padding: 20 },
  propertyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  propertyImage: { width: '100%', height: 180 },
  placeholderImage: {
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  propertyInfo: { padding: 16 },
  propertyTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.gray[900] },
  propertyAddress: { fontSize: 13, color: COLORS.gray[600], marginTop: 4 },
  propertyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  price: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  typeBadge: {
    backgroundColor: COLORS.secondary + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: { fontSize: 11, fontWeight: '600', color: COLORS.secondary },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { marginTop: 16, fontSize: 16, color: COLORS.gray[500] },
});