// app/(landlord)/maintenance.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';
import { useAuth } from '../../contexts/AuthContext';
import LandlordService, { MaintenanceRequest } from '../../services/landlordService';

const STATUS_OPTIONS = ['open', 'in_progress', 'resolved', 'closed'];

export default function MaintenanceScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]); // ← Fixed: explicit type
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const data = await LandlordService.getMaintenanceRequests(user!.id);
      setRequests(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load maintenance requests');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (requestId: number, currentStatus: string) => {
    Alert.alert(
      'Update Status',
      'Choose new status:',
      [
        ...STATUS_OPTIONS.map((status) => ({
          text: status.replace('_', ' ').toUpperCase(),
          onPress: async () => {
            try {
              await LandlordService.updateMaintenanceStatus(requestId, user!.id, status);
              loadRequests();
              Alert.alert('Success', 'Status updated');
            } catch (error) {
              Alert.alert('Error', 'Failed to update status');
            }
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return COLORS.error;
      case 'high': return COLORS.warning;
      case 'medium': return COLORS.info;
      default: return COLORS.gray[600];
    }
  };

  const renderRequest = ({ item }: { item: MaintenanceRequest }) => ( // ← Fixed: typed item
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View>
          <Text style={styles.requestTitle}>{item.title}</Text>
          <Text style={styles.property}>{item.property_title}</Text>
          <Text style={styles.tenant}>Reported by: {item.tenant_name}</Text>
        </View>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
          <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
            {item.priority.toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={styles.description}>{item.description || 'No description'}</Text>

      {item.images && JSON.parse(item.images).length > 0 && (
        <View style={styles.imagesRow}>
          {JSON.parse(item.images).slice(0, 3).map((uri: string, idx: number) => (
            <Image key={idx} source={{ uri }} style={styles.requestImage} />
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.date}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
        <TouchableOpacity
          style={styles.statusButton}
          onPress={() => updateStatus(item.id, item.status)}
        >
          <Text style={styles.statusButtonText}>
            {item.status.replace('_', ' ')}
          </Text>
          <Ionicons name="chevron-down" size={16} color={COLORS.gray[600]} />
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
        <Text style={styles.title}>Maintenance Requests</Text>
        <Text style={styles.count}>{requests.length}</Text>
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderRequest}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="construct-outline" size={64} color={COLORS.gray[300]} />
            <Text style={styles.emptyText}>No maintenance requests</Text>
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
  requestCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  requestHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  requestTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.gray[900] },
  property: { fontSize: 13, color: COLORS.gray[600], marginTop: 2 },
  tenant: { fontSize: 13, color: COLORS.gray[600], marginTop: 2 },
  priorityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  priorityText: { fontSize: 11, fontWeight: 'bold' },
  description: { fontSize: 14, color: COLORS.gray[700], marginVertical: 8 },
  imagesRow: { flexDirection: 'row', gap: 8, marginVertical: 8 },
  requestImage: { width: 80, height: 80, borderRadius: 8 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  date: { fontSize: 12, color: COLORS.gray[500] },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  statusButtonText: { fontSize: 13, fontWeight: '600', color: COLORS.gray[700] },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { marginTop: 16, fontSize: 16, color: COLORS.gray[500] },
});