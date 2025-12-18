// ========================================
// FILE: app/(tenant)/maintenance.tsx
// Submit and Track Maintenance Requests - Stats as Chips
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import TenantService, { MaintenanceRequest } from '../../services/tenantService';

export default function MaintenanceScreen() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const tenantId = 2; // Replace with actual logged-in tenant ID from auth
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
      setImages(prev => [...prev, ...uris].slice(0, 10)); // max 10
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
      const tenantId = 2; // Replace with real tenant ID
      const propertyId = 1; // In real app, track active rental

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

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setImages([]);
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
      case 'open': return '#3B82F6';
      case 'in_progress': return '#F59E0B';
      case 'resolved': return '#10B981';
      case 'closed': return '#6B7280';
      default: return '#6B7280';
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
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Maintenance</Text>
        <Text style={styles.headerSubtitle}>Report and track issues</Text>
      </View>

      {/* Stats as Compact Chips */}
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          <View style={styles.compactChip}>
            <Text style={styles.compactChipText}>Total</Text>
            <Text style={styles.compactChipCount}>{stats.total}</Text>
          </View>

          <View style={styles.compactChip}>
            <Text style={styles.compactChipText}>Open</Text>
            <Text style={styles.compactChipCount}>{stats.open}</Text>
          </View>

          <View style={styles.compactChip}>
            <Text style={styles.compactChipText}>In Progress</Text>
            <Text style={styles.compactChipCount}>{stats.in_progress}</Text>
          </View>

          <View style={styles.compactChip}>
            <Text style={styles.compactChipText}>Resolved</Text>
            <Text style={styles.compactChipCount}>{stats.resolved}</Text>
          </View>
        </ScrollView>
      </View>

      {/* Create Button */}
      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.createButton} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
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
            <View key={request.id} style={styles.requestCard}>
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
                <Text style={styles.description} numberOfLines={3}>
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
            </View>
          ))
        )}
      </ScrollView>

      {/* Create Request Modal */}
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
                  <Ionicons name="camera-outline" size={24} color="#4F46E5" />
                  <Text style={styles.imageButtonText}>Add Photos</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleSubmitRequest}>
                <Text style={styles.submitButtonText}>Submit Request</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: '#6B7280' },

  // Compact Stats Chips
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
    color: '#6B7280',
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
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  activeFilterTab: { backgroundColor: '#4F46E5' },
  filterText: { fontSize: 12, fontWeight: '600', color: '#6B7280', textTransform: 'capitalize' },
  activeFilterText: { color: '#FFFFFF' },

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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 12,
  },
  titleContainer: { flex: 1 },
  requestTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  propertyName: { fontSize: 12, color: '#6B7280' },
  priorityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  priorityText: { fontSize: 10, fontWeight: '700' },
  description: { fontSize: 14, color: '#4B5563', lineHeight: 20, marginBottom: 12 },
  imagesContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  imagesText: { fontSize: 12, color: '#6B7280' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  dateContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: 12, color: '#6B7280' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  modalBody: { padding: 20 },
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
    borderColor: '#4F46E5',
    borderStyle: 'dashed',
    backgroundColor: '#EEF2FF',
  },
  imageButtonText: { fontSize: 14, fontWeight: '600', color: '#4F46E5' },
  submitButton: { backgroundColor: '#4F46E5', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  submitButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});