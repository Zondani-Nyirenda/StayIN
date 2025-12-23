// ========================================
// FILE: app/(landlord)/manage-boarding-house.tsx
// Landlord View: Manage Rooms, Bedspaces & Occupancy
// ========================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../utils/constants';
import { useAuth } from '../../contexts/AuthContext';
import BoardingHouseService, { Bedspace, BoardingRoom } from '../../services/boardingHouseService';

export default function ManageBoardingHouseScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [newRoom, setNewRoom] = useState<Partial<BoardingRoom>>({
    room_number: '',
    bedspace_count: 2,
    price_per_bedspace: 0,
    gender: 'mixed',
    status: 'active',
  });

  useEffect(() => {
    loadOverview();
  }, [id]);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const data = await BoardingHouseService.getBoardingHouseOverview(
        Number(id),
        user!.id
      );
      setOverview(data);
    } catch (error) {
      console.error('Failed to load overview:', error);
      Alert.alert('Error', 'Failed to load boarding house details');
    } finally {
      setLoading(false);
    }
  };

  const viewRoomDetails = async (room: any) => {
    try {
      const details = await BoardingHouseService.getRoomDetails(room.id, user!.id);
      setSelectedRoom(details);
    } catch (error) {
      Alert.alert('Error', 'Failed to load room details');
    }
  };

  const releaseBedspace = async (bedspaceId: number) => {
    Alert.alert(
      'Release Bedspace',
      'Are you sure you want to release this bedspace? The tenant will be notified.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Release',
          style: 'destructive',
          onPress: async () => {
            try {
              await BoardingHouseService.releaseBedspace(bedspaceId, user!.id);
              Alert.alert('Success', 'Bedspace released successfully');
              loadOverview();
              if (selectedRoom) {
                viewRoomDetails(selectedRoom);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to release bedspace');
            }
          },
        },
      ]
    );
  };

  const addNewRoom = async () => {
    if (!newRoom.room_number || !newRoom.bedspace_count || !newRoom.price_per_bedspace) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await BoardingHouseService.addRoom(user!.id, {
        ...newRoom,
        property_id: Number(id),
      } as BoardingRoom);

      Alert.alert('Success', 'Room added successfully');
      setShowAddRoomModal(false);
      setNewRoom({
        room_number: '',
        bedspace_count: 2,
        price_per_bedspace: 0,
        gender: 'mixed',
        status: 'active',
      });
      loadOverview();
    } catch (error) {
      Alert.alert('Error', 'Failed to add room');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading boarding house...</Text>
      </View>
    );
  }

  if (!overview) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Boarding house not found</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" backgroundColor="transparent" translucent />

      <View style={styles.container}>
        {/* Header */}
        <LinearGradient colors={['#1E40AF', '#0F172A']} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={28} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Manage Boarding</Text>
            <TouchableOpacity onPress={() => setShowAddRoomModal(true)}>
              <Ionicons name="add-circle" size={32} color="#FFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView style={styles.content}>
          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="bed" size={24} color={COLORS.primary} />
              <Text style={styles.statValue}>{overview.metadata.available_bedspaces}</Text>
              <Text style={styles.statLabel}>Available</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
              <Text style={styles.statValue}>
                {overview.metadata.total_bedspaces - overview.metadata.available_bedspaces}
              </Text>
              <Text style={styles.statLabel}>Occupied</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="stats-chart" size={24} color={COLORS.warning} />
              <Text style={styles.statValue}>{overview.occupancy_rate.toFixed(0)}%</Text>
              <Text style={styles.statLabel}>Occupancy</Text>
            </View>
          </View>

          {/* Revenue Card */}
          <View style={styles.revenueCard}>
            <Text style={styles.revenueLabel}>Monthly Revenue</Text>
            <Text style={styles.revenueAmount}>
              K{overview.monthly_revenue.toLocaleString()}
            </Text>
            <Text style={styles.revenueSubtext}>
              Total: K{overview.total_revenue.toLocaleString()}
            </Text>
          </View>

          {/* Rooms List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rooms ({overview.rooms.length})</Text>
            {overview.rooms.map((room: any) => (
              <TouchableOpacity
                key={room.id}
                style={styles.roomCard}
                onPress={() => viewRoomDetails(room)}
              >
                <View style={styles.roomHeader}>
                  <View>
                    <Text style={styles.roomNumber}>{room.room_number}</Text>
                    {room.room_name && (
                      <Text style={styles.roomName}>{room.room_name}</Text>
                    )}
                  </View>
                  <View style={styles.roomPrice}>
                    <Text style={styles.priceAmount}>K{room.price_per_bedspace}</Text>
                    <Text style={styles.priceLabel}>/bed</Text>
                  </View>
                </View>

                <View style={styles.roomProgress}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${
                            ((room.bedspace_count - room.available_count) /
                              room.bedspace_count) *
                            100
                          }%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {room.bedspace_count - room.available_count}/{room.bedspace_count} occupied
                  </Text>
                </View>

                <View style={styles.roomFooter}>
                  <View style={styles.roomTag}>
                    <Ionicons name="layers" size={14} color={COLORS.gray[600]} />
                    <Text style={styles.roomTagText}>Floor {room.floor_number}</Text>
                  </View>
                  <View style={styles.roomTag}>
                    <Ionicons name="people" size={14} color={COLORS.gray[600]} />
                    <Text style={styles.roomTagText}>{room.gender}</Text>
                  </View>
                  {room.available_count === 0 && (
                    <View style={[styles.roomTag, styles.fullTag]}>
                      <Text style={styles.fullTagText}>Full</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Room Details Modal */}
        <Modal
          visible={!!selectedRoom}
          animationType="slide"
          transparent
          onRequestClose={() => setSelectedRoom(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {selectedRoom?.room_number} {selectedRoom?.room_name && `- ${selectedRoom.room_name}`}
                </Text>
                <TouchableOpacity onPress={() => setSelectedRoom(null)}>
                  <Ionicons name="close" size={28} color={COLORS.gray[700]} />
                </TouchableOpacity>
              </View>

              <ScrollView>
                <View style={styles.bedspaceGrid}>
                  {selectedRoom?.bedspaces?.map((bed: Bedspace) => (
                    <View
                      key={bed.id}
                      style={[
                        styles.bedspaceCard,
                        bed.occupancy_status === 'occupied' && styles.bedspaceOccupied,
                      ]}
                    >
                      <Ionicons
                        name="bed"
                        size={28}
                        color={
                          bed.occupancy_status === 'occupied'
                            ? COLORS.success
                            : COLORS.gray[400]
                        }
                      />
                      <Text style={styles.bedspaceNumber}>{bed.bedspace_number}</Text>
                      <Text
                        style={[
                          styles.bedspaceStatus,
                          bed.occupancy_status === 'occupied' && styles.bedspaceStatusOccupied,
                        ]}
                      >
                        {bed.occupancy_status}
                      </Text>

                      {bed.tenant_name && (
                        <>
                          <Text style={styles.tenantName}>{bed.tenant_name}</Text>
                          <TouchableOpacity
                            style={styles.releaseButton}
                            onPress={() => releaseBedspace(bed.id!)}
                          >
                            <Ionicons name="log-out" size={14} color={COLORS.error} />
                            <Text style={styles.releaseButtonText}>Release</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Add Room Modal */}
        <Modal
          visible={showAddRoomModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowAddRoomModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add New Room</Text>

              <View style={styles.form}>
                <Text style={styles.label}>Room Number *</Text>
                <TextInput
                  style={styles.input}
                  value={newRoom.room_number}
                  onChangeText={(text) => setNewRoom({ ...newRoom, room_number: text })}
                  placeholder="e.g. R201"
                />

                <Text style={styles.label}>Room Name (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={newRoom.room_name}
                  onChangeText={(text) => setNewRoom({ ...newRoom, room_name: text })}
                  placeholder="e.g. Deluxe Suite"
                />

                <View style={styles.row}>
                  <View style={styles.half}>
                    <Text style={styles.label}>Floor</Text>
                    <TextInput
                      style={styles.input}
                      value={String(newRoom.floor_number || '')}
                      onChangeText={(text) =>
                        setNewRoom({ ...newRoom, floor_number: Number(text) || 1 })
                      }
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.half}>
                    <Text style={styles.label}>Bedspaces *</Text>
                    <TextInput
                      style={styles.input}
                      value={String(newRoom.bedspace_count)}
                      onChangeText={(text) =>
                        setNewRoom({ ...newRoom, bedspace_count: Number(text) || 1 })
                      }
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <Text style={styles.label}>Price per Bedspace (K) *</Text>
                <TextInput
                  style={styles.input}
                  value={String(newRoom.price_per_bedspace || '')}
                  onChangeText={(text) =>
                    setNewRoom({ ...newRoom, price_per_bedspace: Number(text) || 0 })
                  }
                  keyboardType="numeric"
                  placeholder="e.g. 800"
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowAddRoomModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmButton} onPress={addNewRoom}>
                  <Text style={styles.confirmButtonText}>Add Room</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: COLORS.gray[600] },
  header: { paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FFF' },
  content: { flex: 1 },
  statsRow: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  statValue: { fontSize: 24, fontWeight: 'bold', color: COLORS.gray[900], marginTop: 8 },
  statLabel: { fontSize: 12, color: COLORS.gray[600], marginTop: 4 },
  revenueCard: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  revenueLabel: { fontSize: 14, color: COLORS.white, opacity: 0.9 },
  revenueAmount: { fontSize: 36, fontWeight: 'bold', color: COLORS.white, marginTop: 8 },
  revenueSubtext: { fontSize: 13, color: COLORS.white, opacity: 0.8, marginTop: 4 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.gray[900], marginBottom: 12 },
  roomCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  roomHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  roomNumber: { fontSize: 18, fontWeight: 'bold', color: COLORS.gray[900] },
  roomName: { fontSize: 13, color: COLORS.gray[600], marginTop: 2 },
  roomPrice: { alignItems: 'flex-end' },
  priceAmount: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
  priceLabel: { fontSize: 11, color: COLORS.gray[600] },
  roomProgress: { marginBottom: 12 },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: { height: '100%', backgroundColor: COLORS.success },
  progressText: { fontSize: 12, color: COLORS.gray[600] },
  roomFooter: { flexDirection: 'row', gap: 8 },
  roomTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  roomTagText: { fontSize: 12, color: COLORS.gray[700] },
  fullTag: { backgroundColor: COLORS.error + '15' },
  fullTagText: { fontSize: 12, fontWeight: '600', color: COLORS.error },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.gray[900] },
  bedspaceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  bedspaceCard: {
    width: '47%',
    backgroundColor: COLORS.gray[50],
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray[300],
  },
  bedspaceOccupied: {
    backgroundColor: COLORS.success + '10',
    borderColor: COLORS.success + '30',
  },
  bedspaceNumber: { fontSize: 16, fontWeight: 'bold', color: COLORS.gray[900], marginTop: 8 },
  bedspaceStatus: { fontSize: 12, color: COLORS.gray[600], marginTop: 4 },
  bedspaceStatusOccupied: { color: COLORS.success, fontWeight: '600' },
  tenantName: { fontSize: 12, color: COLORS.gray[700], marginTop: 6, textAlign: 'center' },
  releaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    gap: 4,
  },
  releaseButtonText: { fontSize: 11, fontWeight: '600', color: COLORS.error },
  form: { marginBottom: 20 },
  label: { fontSize: 15, fontWeight: '600', color: COLORS.gray[800], marginBottom: 8, marginTop: 12 },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
  },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.gray[200],
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: { fontSize: 15, fontWeight: '600', color: COLORS.gray[700] },
  confirmButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: { fontSize: 15, fontWeight: 'bold', color: COLORS.white },
});