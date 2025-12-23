// ========================================
// FILE: app/(landlord)/maintenance.tsx
// Maintenance Requests - Full Image Gallery + Better UX
// ========================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  Modal,
  Dimensions,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';
import { useAuth } from '../../contexts/AuthContext';
import LandlordService, { MaintenanceRequest } from '../../services/landlordService';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// StayIN Brand Colors
const STAYIN = {
  primaryBlue: '#1E40AF',
  white: '#FFFFFF',
};

const STATUS_OPTIONS = ['open', 'in_progress', 'resolved', 'closed'] as const;

export default function MaintenanceScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Image Gallery Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [initialIndex, setInitialIndex] = useState(0);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async (isRefresh = false) => {
    if (!user?.id) return;

    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const data = await LandlordService.getMaintenanceRequests(user.id);
      setRequests(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load maintenance requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => loadRequests(true);

  const openImageGallery = (images: string[], index: number) => {
    setSelectedImages(images);
    setInitialIndex(index);
    setModalVisible(true);
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
              Alert.alert('Success', 'Status updated successfully');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return COLORS.error;
      case 'in_progress': return COLORS.warning;
      case 'resolved': return COLORS.success;
      case 'closed': return COLORS.gray[600];
      default: return COLORS.primary;
    }
  };

  const renderRequest = ({ item }: { item: MaintenanceRequest }) => {
    const images: string[] = item.images ? JSON.parse(item.images) : [];
    const displayedImages = images.slice(0, 4);
    const remainingCount = images.length > 4 ? images.length - 4 : 0;

    return (
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

        <Text style={styles.description}>{item.description || 'No description provided'}</Text>

        {images.length > 0 && (
          <View style={styles.imagesGrid}>
            {displayedImages.map((uri: string, idx: number) => (
              <TouchableOpacity
                key={idx}
                onPress={() => openImageGallery(images, idx)}
                style={styles.imageWrapper}
              >
                <Image source={{ uri }} style={styles.gridImage} />
                {idx === 3 && remainingCount > 0 && (
                  <View style={styles.moreOverlay}>
                    <Text style={styles.moreText}>+{remainingCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.date}>
            {new Date(item.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>

          <TouchableOpacity
            style={[styles.statusButton, { borderColor: getStatusColor(item.status) }]}
            onPress={() => updateStatus(item.id, item.status)}
          >
            <Text style={[styles.statusButtonText, { color: getStatusColor(item.status) }]}>
              {item.status.replace('_', ' ').toUpperCase()}
            </Text>
            <Ionicons name="chevron-down" size={16} color={getStatusColor(item.status)} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={STAYIN.primaryBlue} />
        <Text style={styles.loadingText}>Loading requests...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" backgroundColor="transparent" translucent />

      <View style={styles.container}>
        {/* Gradient Header */}
        <LinearGradient
          colors={[STAYIN.primaryBlue, '#0F172A']}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={28} color={STAYIN.white} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Maintenance Requests</Text>

            <Text style={styles.countBadge}>{requests.length}</Text>
          </View>
        </LinearGradient>

        <FlatList
          data={requests}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderRequest}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="construct-outline" size={80} color={COLORS.gray[300]} />
              <Text style={styles.emptyTitle}>No Maintenance Requests</Text>
              <Text style={styles.emptyText}>All clear! No pending issues reported.</Text>
            </View>
          }
        />

        {/* Full-Screen Image Gallery Modal */}
        <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={32} color={STAYIN.white} />
              </TouchableOpacity>
              <Text style={styles.modalImageCount}>
                {initialIndex + 1} / {selectedImages.length}
              </Text>
              <View style={{ width: 32 }} />
            </View>

            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setInitialIndex(newIndex);
              }}
            >
              {selectedImages.map((uri, idx) => (
                <View key={idx} style={styles.fullImageContainer}>
                  <Image source={{ uri }} style={styles.fullImage} resizeMode="contain" />
                </View>
              ))}
            </ScrollView>
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.gray[600],
  },

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
  countBadge: {
    fontSize: 20,
    fontWeight: '700',
    color: STAYIN.white,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },

  list: {
    padding: 16,
  },

  requestCard: {
    backgroundColor: COLORS.white,
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  requestTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  property: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  tenant: {
    fontSize: 13,
    color: COLORS.gray[600],
    marginTop: 2,
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 15,
    color: COLORS.gray[700],
    lineHeight: 22,
    marginVertical: 12,
  },

  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 8,
  },
  imageWrapper: {
    position: 'relative',
  },
  gridImage: {
    width: (SCREEN_WIDTH - 64 - 24) / 2, // 2 per row with padding
    height: 120,
    borderRadius: 12,
  },
  moreOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  moreText: {
    color: STAYIN.white,
    fontSize: 24,
    fontWeight: 'bold',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  date: {
    fontSize: 13,
    color: COLORS.gray[500],
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },

  empty: {
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gray[700],
    marginTop: 20,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.gray[500],
    marginTop: 8,
  },

  // Modal Gallery
  modalOverlay: {
    flex: 1,
    backgroundColor: 'black',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  modalImageCount: {
    fontSize: 16,
    color: STAYIN.white,
    fontWeight: '600',
  },
  fullImageContainer: {
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.2,
  },
});