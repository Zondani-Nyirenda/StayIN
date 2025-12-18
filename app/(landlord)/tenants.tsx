// app/(landlord)/tenants.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';
import { useAuth } from '../../contexts/AuthContext';
import LandlordService, { TenantInfo } from '../../services/landlordService';

export default function TenantsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [tenants, setTenants] = useState<TenantInfo[]>([]); // ← Fixed: explicit type
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      const data = await LandlordService.getTenants(user!.id);
      setTenants(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'current': return COLORS.success;
      case 'overdue': return COLORS.error;
      default: return COLORS.warning;
    }
  };

  const renderTenant = ({ item }: { item: TenantInfo }) => ( // ← Fixed: typed item
    <View style={styles.tenantCard}>
      <View style={styles.tenantHeader}>
        <View>
          <Text style={styles.tenantName}>{item.full_name}</Text>
          <Text style={styles.tenantEmail}>{item.email}</Text>
          <Text style={styles.tenantPhone}>{item.phone_number}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.payment_status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.payment_status) }]}>
            {item.payment_status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.propertyInfo}>
        <Text style={styles.propertyTitle}>{item.property_title}</Text>
        <Text style={styles.rentInfo}>Rent: K{item.rent_amount}/month</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="call-outline" size={20} color={COLORS.primary} />
          <Text style={styles.actionText}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="mail-outline" size={20} color={COLORS.info} />
          <Text style={styles.actionText}>Message</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.title}>My Tenants</Text>
        <Text style={styles.count}>{tenants.length}</Text>
      </View>

      <FlatList
        data={tenants}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTenant}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={64} color={COLORS.gray[300]} />
            <Text style={styles.emptyText}>No tenants yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
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
  title: { fontSize: 18, fontWeight: 'bold', color: COLORS.gray[900] },
  count: { fontSize: 16, color: COLORS.primary, fontWeight: '600' },
  list: { padding: 16 },
  tenantCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  tenantHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  tenantName: { fontSize: 16, fontWeight: 'bold', color: COLORS.gray[900] },
  tenantEmail: { fontSize: 13, color: COLORS.gray[600], marginTop: 2 },
  tenantPhone: { fontSize: 13, color: COLORS.gray[600], marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  propertyInfo: { marginBottom: 12 },
  propertyTitle: { fontSize: 14, color: COLORS.gray[800], fontWeight: '600' },
  rentInfo: { fontSize: 13, color: COLORS.primary, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 20 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: 13, color: COLORS.gray[700], fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { marginTop: 16, fontSize: 16, color: COLORS.gray[500] },
});