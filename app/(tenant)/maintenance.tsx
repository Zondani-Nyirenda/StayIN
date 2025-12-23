// ========================================
// FILE: app/(tenant)/maintenance.tsx
// Maintenance - With Detail View & Delete Functionality
// ========================================
import React, { useState, useEffect } from 'react';
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
  TextInput,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import TenantService, { MaintenanceRequest } from '../../services/tenantService';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// StayIN Brand Colors
const STAYIN = {
  primaryBlue: '#1E40AF',
  green: '#00AA00',
  orange: '#FFAA00',
  dark: '#000000',
  white: '#FFFFFF',
};

export default function MaintenanceScreen() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [images, setImages] = useState<string[]>([]);

  // Image viewer state
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const tenantId = 2; // Replace with actual logged-in tenant ID
      const data = await TenantService.getMyMaintenanceRequests(tenantId);
      setRequests(data);
    } catch (error) {
      console.error('Failed to load maintenance requests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  const handlePickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant photo library access');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const uris = result.assets.map(asset => asset.uri);
      setImages(prev => [...prev, ...uris].slice(0, 10));
    }
  };

  const handleSubmitRequest = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please describe the issue');
      return;
    }

    try {
      const tenantId = 2;
      const propertyId = 1;

      await TenantService.submitMaintenanceRequest(
        tenantId,
        propertyId,
        title,
        description,
        priority,
        images
      );

      Alert.alert('Success', 'Maintenance request submitted!');
      setShowModal(false);
      resetForm();
      loadRequests();
    } catch (error) {
      Alert.alert('Error', 'Failed to submit request');
      console.error(error);
    }
  };

  const handleDeleteRequest = (request: MaintenanceRequest) => {
    if (request.status !== 'resolved' && request.status !== 'closed') {
      Alert.alert(
        'Cannot Delete',
        'Only resolved or closed requests can be deleted.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Delete Request',
      `Are you sure you want to delete "${request.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // In real app, call delete API
              // await TenantService.deleteMaintenanceRequest(request.id);
              
              // For now, just remove from local state
              setRequests(prev => prev.filter(r => r.id !== request.id));
              setShowDetailModal(false);
              Alert.alert('Success', 'Request deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete request');
              console.error(error);
            }
          },
        },
      ]
    );
  };

  const handleViewDetails = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const handleViewImage = (index: number) => {
    setSelectedImageIndex(index);
    setShowImageViewer(true);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setImages([]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'urgent': return '#DC2626';
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return STAYIN.primaryBlue;
      case 'in_progress': return '#F59E0B';
      case 'resolved': return '#10B981';
      case 'closed': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return 'alert-circle';
      case 'in_progress': return 'time';
      case 'resolved': return 'checkmark-circle';
      case 'closed': return 'close-circle';
      default: return 'help-circle';
    }
  };

  const filteredRequests = requests.filter(req =>
    filter === 'all' ? true : req.status === filter
  );

  const stats = {
    total: requests.length,
    open: requests.filter(r => r.status === 'open').length,
    in_progress: requests.filter(r => r.status === 'in_progress').length,
    resolved: requests.filter(r => r.status === 'resolved').length,
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

      <View style={styles.container}>
        {/* StayIN Gradient Header */}
        <LinearGradient
          colors={[STAYIN.primaryBlue, '#0F172A']}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Maintenance</Text>
              <Text style={styles.headerSubtitle}>Report and track issues</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Stats Chips */}
        <View style={styles.filterWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}
          >
            <View style={[styles.compactChip, { backgroundColor: STAYIN.primaryBlue + '20' }]}>
              <Text style={styles.compactChipText}>Total</Text>
              <Text style={styles.compactChipCount}>{stats.total}</Text>
            </View>
            <View style={[styles.compactChip, { backgroundColor: STAYIN.primaryBlue + '20' }]}>
              <Text style={styles.compactChipText}>Open</Text>
              <Text style={styles.compactChipCount}>{stats.open}</Text>
            </View>
            <View style={[styles.compactChip, { backgroundColor: '#F59E0B20' }]}>
              <Text style={styles.compactChipText}>In Progress</Text>
              <Text style={styles.compactChipCount}>{stats.in_progress}</Text>
            </View>
            <View style={[styles.compactChip, { backgroundColor: '#10B98120' }]}>
              <Text style={styles.compactChipText}>Resolved</Text>
              <Text style={styles.compactChipCount}>{stats.resolved}</Text>
            </View>
          </ScrollView>
        </View>

        {/* New Request Button */}
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.createButton} onPress={() => setShowModal(true)}>
            <Ionicons name="add" size={20} color={STAYIN.white} />
            <Text style={styles.createButtonText}>New Request</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {['all', 'open', 'in_progress', 'resolved'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filter === f && styles.activeFilterTab]}
              onPress={() => setFilter(f as any)}
            >
              <Text style={[styles.filterText, filter === f && styles.activeFilterText]}>
                {f === 'all' ? 'All' : f.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Requests List */}
        <ScrollView
          style={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {filteredRequests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="construct-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No Requests</Text>
              <Text style={styles.emptyText}>
                {filter === 'all'
                  ? 'You have no maintenance requests'
                  : `No ${filter.replace('_', ' ')} requests`}
              </Text>
            </View>
          ) : (
            filteredRequests.map((request) => (
              <TouchableOpacity
                key={request.id}
                style={styles.requestCard}
                onPress={() => handleViewDetails(request)}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.titleContainer}>
                    <Text style={styles.requestTitle}>{request.title}</Text>
                    <Text style={styles.propertyName}>{request.property_title}</Text>
                  </View>
                  <View
                    style={[
                      styles.priorityBadge,
                      { backgroundColor: `${getPriorityColor(request.priority)}20` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.priorityText,
                        { color: getPriorityColor(request.priority) },
                      ]}
                    >
                      {request.priority.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {request.description && (
                  <Text style={styles.description} numberOfLines={2}>
                    {request.description}
                  </Text>
                )}

                {request.images.length > 0 && (
                  <View style={styles.imagesContainer}>
                    <Ionicons name="images-outline" size={14} color="#6B7280" />
                    <Text style={styles.imagesText}>
                      {request.images.length} photo(s) attached
                    </Text>
                  </View>
                )}

                <View style={styles.cardFooter}>
                  <View style={styles.dateContainer}>
                    <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                    <Text style={styles.dateText}>
                      {new Date(request.created_at).toLocaleDateString()}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: `${getStatusColor(request.status)}20` },
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: getStatusColor(request.status) },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(request.status) },
                      ]}
                    >
                      {request.status.replace('_', ' ')}
                    </Text>
                  </View>
                </View>

                <View style={styles.tapHint}>
                  <Text style={styles.tapHintText}>Tap to view details</Text>
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* Detail View Modal */}
        <Modal visible={showDetailModal} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxHeight: '95%' }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Request Details</Text>
                <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {selectedRequest && (
                <ScrollView style={styles.modalBody}>
                  {/* Status Banner */}
                  <View
                    style={[
                      styles.statusBanner,
                      { backgroundColor: `${getStatusColor(selectedRequest.status)}20` },
                    ]}
                  >
                    <Ionicons
                      name={getStatusIcon(selectedRequest.status) as any}
                      size={32}
                      color={getStatusColor(selectedRequest.status)}
                    />
                    <View style={styles.statusBannerText}>
                      <Text style={styles.statusBannerTitle}>
                        {selectedRequest.status.replace('_', ' ').toUpperCase()}
                      </Text>
                      <Text style={styles.statusBannerSubtitle}>
                        {selectedRequest.status === 'open' && 'Waiting for landlord response'}
                        {selectedRequest.status === 'in_progress' && 'Work in progress'}
                        {selectedRequest.status === 'resolved' && 'Issue has been resolved'}
                        {selectedRequest.status === 'closed' && 'Request closed'}
                      </Text>
                    </View>
                  </View>

                  {/* Priority & Property */}
                  <View style={styles.detailSection}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Priority</Text>
                      <View
                        style={[
                          styles.priorityBadge,
                          { backgroundColor: `${getPriorityColor(selectedRequest.priority)}20` },
                        ]}
                      >
                        <Text
                          style={[
                            styles.priorityText,
                            { color: getPriorityColor(selectedRequest.priority) },
                          ]}
                        >
                          {selectedRequest.priority.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Property</Text>
                      <Text style={styles.detailValue}>{selectedRequest.property_title}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Submitted</Text>
                      <Text style={styles.detailValue}>
                        {new Date(selectedRequest.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </Text>
                    </View>
                  </View>

                  {/* Title & Description */}
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Issue Details</Text>
                    <Text style={styles.detailTitle}>{selectedRequest.title}</Text>
                    {selectedRequest.description && (
                      <Text style={styles.detailDescription}>{selectedRequest.description}</Text>
                    )}
                  </View>

                  {/* Images */}
                  {selectedRequest.images.length > 0 && (
                    <View style={styles.detailSection}>
                      <Text style={styles.sectionTitle}>
                        Attached Photos ({selectedRequest.images.length})
                      </Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.imagesGrid}
                      >
                        {selectedRequest.images.map((uri, index) => (
                          <TouchableOpacity
                            key={index}
                            onPress={() => handleViewImage(index)}
                            style={styles.imageThumb}
                          >
                            <Image source={{ uri }} style={styles.thumbImage} />
                            <View style={styles.imageOverlay}>
                              <Ionicons name="expand" size={20} color="#FFF" />
                            </View>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* Delete Button (only for resolved/closed) */}
                  {(selectedRequest.status === 'resolved' || selectedRequest.status === 'closed') && (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteRequest(selectedRequest)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#DC2626" />
                      <Text style={styles.deleteButtonText}>Delete Request</Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        {/* Image Viewer Modal */}
        <Modal visible={showImageViewer} animationType="fade" transparent={true}>
          <View style={styles.imageViewerOverlay}>
            <TouchableOpacity
              style={styles.imageViewerClose}
              onPress={() => setShowImageViewer(false)}
            >
              <Ionicons name="close" size={32} color="#FFF" />
            </TouchableOpacity>
            {selectedRequest && selectedRequest.images.length > 0 && (
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                contentOffset={{ x: selectedImageIndex * width, y: 0 }}
              >
                {selectedRequest.images.map((uri, index) => (
                  <View key={index} style={styles.imageViewerPage}>
                    <Image source={{ uri }} style={styles.fullImage} resizeMode="contain" />
                    <Text style={styles.imageCounter}>
                      {index + 1} / {selectedRequest.images.length}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </Modal>

        {/* New Request Modal */}
        <Modal visible={showModal} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>New Maintenance Request</Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Title *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Leaking faucet in bathroom"
                    value={title}
                    onChangeText={setTitle}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Description *</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Describe the issue in detail..."
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Priority</Text>
                  <View style={styles.priorityGrid}>
                    {(['low', 'medium', 'high', 'urgent'] as const).map((p) => (
                      <TouchableOpacity
                        key={p}
                        style={[
                          styles.priorityOption,
                          priority === p && styles.selectedPriority,
                          { borderColor: getPriorityColor(p) },
                        ]}
                        onPress={() => setPriority(p)}
                      >
                        <Text
                          style={[
                            styles.priorityOptionText,
                            priority === p && { color: getPriorityColor(p) },
                          ]}
                        >
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Photos ({images.length}/10)</Text>
                  <TouchableOpacity style={styles.imageButton} onPress={handlePickImages}>
                    <Ionicons name="camera-outline" size={24} color={STAYIN.primaryBlue} />
                    <Text style={styles.imageButtonText}>Add Photos</Text>
                  </TouchableOpacity>

                  {images.length > 0 && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.selectedImagesContainer}
                    >
                      {images.map((uri, index) => (
                        <View key={index} style={styles.selectedImageWrapper}>
                          <Image source={{ uri }} style={styles.selectedImage} />
                          <TouchableOpacity
                            style={styles.removeImageButton}
                            onPress={() => removeImage(index)}
                          >
                            <Ionicons name="close-circle" size={24} color="#DC2626" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </ScrollView>
                  )}
                </View>

                <TouchableOpacity style={styles.submitButton} onPress={handleSubmitRequest}>
                  <Text style={styles.submitButtonText}>Submit Request</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  headerGradient: { paddingTop: 60, paddingBottom: 36, paddingHorizontal: 20 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitle: { fontSize: 28, fontWeight: '800', color: STAYIN.white, marginBottom: 4 },
  headerSubtitle: { fontSize: 15, color: STAYIN.white, opacity: 0.9 },

  filterWrapper: { paddingVertical: 12, backgroundColor: '#F9FAFB' },
  filterContent: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  compactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    gap: 6,
  },
  compactChipText: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
  compactChipCount: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1F2937',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    textAlign: 'center',
  },

  actionContainer: { padding: 16 },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: STAYIN.primaryBlue,
    padding: 16,
    borderRadius: 12,
    shadowColor: STAYIN.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: { fontSize: 16, fontWeight: '700', color: STAYIN.white },

  filterContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', padding: 16, gap: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  filterTab: { flex: 1, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#F3F4F6', alignItems: 'center' },
  activeFilterTab: { backgroundColor: STAYIN.primaryBlue },
  filterText: { fontSize: 12, fontWeight: '600', color: '#6B7280', textTransform: 'capitalize' },
  activeFilterText: { color: STAYIN.white },

  listContainer: { flex: 1, padding: 16 },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 12 },
  titleContainer: { flex: 1 },
  requestTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  propertyName: { fontSize: 12, color: '#6B7280' },
  priorityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  priorityText: { fontSize: 10, fontWeight: '700' },
  description: { fontSize: 14, color: '#4B5563', lineHeight: 20, marginBottom: 12 },
  imagesContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  imagesText: { fontSize: 12, color: '#6B7280' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  dateContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: 12, color: '#6B7280' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },

  tapHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  tapHintText: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  modalBody: { padding: 20 },

  // Detail View Styles
  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, borderRadius: 12, marginBottom: 20 },
  statusBannerText: { flex: 1 },
  statusBannerTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 4, textTransform: 'uppercase' },
  statusBannerSubtitle: { fontSize: 14, color: '#6B7280' },

  detailSection: { marginBottom: 24, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  detailLabel: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  detailValue: { fontSize: 14, color: '#1F2937', fontWeight: '500' },
  detailTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
  detailDescription: { fontSize: 15, color: '#4B5563', lineHeight: 24 },

  imagesGrid: { flexDirection: 'row', gap: 12 },
  imageThumb: { width: 120, height: 120, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  thumbImage: { width: '100%', height: '100%' },
  imageOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },

  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  deleteButtonText: { fontSize: 16, fontWeight: '600', color: '#DC2626' },

  // Image Viewer
  imageViewerOverlay: { flex: 1, backgroundColor: '#000' },
  imageViewerClose: { position: 'absolute', top: 50, right: 20, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 8 },
  imageViewerPage: { width, height: '100%', justifyContent: 'center', alignItems: 'center' },
  fullImage: { width: width - 40, height: '80%' },
  imageCounter: { position: 'absolute', bottom: 40, alignSelf: 'center', color: '#FFF', fontSize: 16, fontWeight: '600', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },

  // Form Styles
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, fontSize: 15, color: '#1F2937' },
  textArea: { height: 100 },
  priorityGrid: { flexDirection: 'row', gap: 8 },
  priorityOption: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 2, alignItems: 'center' },
  selectedPriority: { backgroundColor: '#F9FAFB' },
  priorityOptionText: { fontSize: 13, fontWeight: '600', color: '#6B7280', textTransform: 'capitalize' },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: STAYIN.primaryBlue,
    borderStyle: 'dashed',
    backgroundColor: STAYIN.primaryBlue + '10',
  },
  imageButtonText: { fontSize: 14, fontWeight: '600', color: STAYIN.primaryBlue },

  selectedImagesContainer: { flexDirection: 'row', gap: 8, marginTop: 12 },
  selectedImageWrapper: { position: 'relative', width: 80, height: 80 },
  selectedImage: { width: '100%', height: '100%', borderRadius: 8 },
  removeImageButton: { position: 'absolute', top: -8, right: -8, backgroundColor: '#FFF', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },

  submitButton: { backgroundColor: STAYIN.primaryBlue, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  submitButtonText: { fontSize: 16, fontWeight: '700', color: STAYIN.white },
});