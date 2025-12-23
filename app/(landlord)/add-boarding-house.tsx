// ========================================
// FILE: app/(landlord)/add-boarding-house.tsx
// Fully Complete & Working with Images + Amenities
// ========================================
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../../utils/constants';
import { useAuth } from '../../contexts/AuthContext';
import BoardingHouseService, { BoardingRoom } from '../../services/boardingHouseService';

const GENDER_OPTIONS = [
  { value: 'male_only', label: 'Male Only' },
  { value: 'female_only', label: 'Female Only' },
  { value: 'mixed', label: 'Mixed' },
  { value: 'separated_floors', label: 'Separated by Floor' },
];

const ROOM_GENDER = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'mixed', label: 'Mixed' },
];

const COMMON_AMENITIES = [
  'WiFi',
  'Electricity Included',
  'Water Included',
  'Security',
  'Laundry',
  'Kitchen',
  'Study Area',
  'Parking',
  'CCTV',
  'Borehole',
];

export default function AddBoardingHouseScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  // House data
  const [houseData, setHouseData] = useState({
    title: '',
    description: '',
    address: '',
    city: '',
    gender_policy: 'mixed' as any,
    rules_and_policies: '',
    guardian_name: '',
    guardian_phone: '',
    guardian_email: '',
    check_in_time: '14:00',
    check_out_time: '10:00',
    amenities: [] as string[],
    images: [] as string[], // Local URIs
  });

  // Rooms
  const [rooms, setRooms] = useState<BoardingRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<BoardingRoom>({
    property_id: 0,
    room_number: '',
    room_name: '',
    floor_number: 1,
    bedspace_count: 2,
    price_per_bedspace: 0,
    gender: 'mixed',
    status: 'active',
  });

  const toggleAmenity = (amenity: string) => {
    setHouseData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Denied', 'Please allow access to your photos to upload images.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
      selectionLimit: 10 - houseData.images.length,
    });

    if (!result.canceled) {
      const newImages = result.assets.map(asset => asset.uri);
      setHouseData(prev => ({
        ...prev,
        images: [...prev.images, ...newImages],
      }));
    }
  };

  const removeImage = (index: number) => {
    setHouseData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const addRoom = () => {
    if (!currentRoom.room_number.trim()) {
      Alert.alert('Error', 'Room number is required');
      return;
    }
    if (currentRoom.bedspace_count < 1) {
      Alert.alert('Error', 'At least 1 bedspace required');
      return;
    }
    if (currentRoom.price_per_bedspace <= 0) {
      Alert.alert('Error', 'Price per bedspace must be greater than 0');
      return;
    }

    setRooms([...rooms, { ...currentRoom }]);
    setCurrentRoom({
      ...currentRoom,
      room_number: '',
      room_name: '',
      bedspace_count: 2,
      price_per_bedspace: currentRoom.price_per_bedspace,
    });
  };

  const removeRoom = (index: number) => {
    setRooms(rooms.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validation
    if (!houseData.title.trim() || !houseData.address.trim() || !houseData.city.trim()) {
      Alert.alert('Error', 'Please fill in house name, address, and city');
      return;
    }
    if (houseData.images.length === 0) {
      Alert.alert('Error', 'Please add at least one photo');
      return;
    }
    if (rooms.length === 0) {
      Alert.alert('Error', 'Please add at least one room');
      return;
    }

    setLoading(true);
    try {
      const totalRooms = rooms.length;
      const totalBedspaces = rooms.reduce((sum, r) => sum + r.bedspace_count, 0);

      const propertyId = await BoardingHouseService.createBoardingHouse(
        user!.id,
        {
          title: houseData.title,
          description: houseData.description,
          address: houseData.address,
          city: houseData.city,
          amenities: houseData.amenities,
          images: houseData.images,
        },
        {
          property_id: 0,
          total_rooms: totalRooms,
          total_bedspaces: totalBedspaces,
          available_bedspaces: totalBedspaces,
          gender_policy: houseData.gender_policy,
          rules_and_policies: houseData.rules_and_policies || undefined,
          guardian_name: houseData.guardian_name || undefined,
          guardian_phone: houseData.guardian_phone || undefined,
          guardian_email: houseData.guardian_email || undefined,
          check_in_time: houseData.check_in_time,
          check_out_time: houseData.check_out_time,
        }
      );

      // Add rooms one by one
      for (const room of rooms) {
        await BoardingHouseService.addRoom(user!.id, {
          ...room,
          property_id: propertyId,
        });
      }

      Alert.alert('Success 🎉', 'Student boarding house created successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Boarding house creation failed:', error);
      Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <StatusBar style="light" />
      <View style={styles.container}>
        <LinearGradient colors={['#1E40AF', '#0F172A']} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={28} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Boarding House</Text>
            <View style={{ width: 28 }} />
          </View>
        </LinearGradient>

        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]}>
            <Text style={styles.stepNumber}>1</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]}>
            <Text style={styles.stepNumber}>2</Text>
          </View>
        </View>

        <ScrollView style={styles.content}>
          {step === 1 && (
            <View style={styles.form}>
              <Text style={styles.sectionTitle}>House Information</Text>

              <Text style={styles.label}>Photos * ({houseData.images.length}/10)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                {houseData.images.map((uri, index) => (
                  <View key={index} style={styles.imageContainer}>
                    <Image source={{ uri }} style={styles.previewImage} />
                    <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeImage(index)}>
                      <Ionicons name="close" size={16} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                ))}
                {houseData.images.length < 10 && (
                  <TouchableOpacity style={styles.addImageBtn} onPress={pickImages}>
                    <Ionicons name="camera" size={30} color={COLORS.primary} />
                    <Text style={styles.addImageText}>Add Photo</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>

              <Text style={styles.label}>House Name *</Text>
              <TextInput
                style={styles.input}
                value={houseData.title}
                onChangeText={(t) => setHouseData({ ...houseData, title: t })}
                placeholder="e.g. UNZA Boys Hostel"
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={houseData.description}
                onChangeText={(t) => setHouseData({ ...houseData, description: t })}
                multiline
                placeholder="Brief description of the boarding house..."
              />

              <Text style={styles.label}>Address *</Text>
              <TextInput
                style={styles.input}
                value={houseData.address}
                onChangeText={(t) => setHouseData({ ...houseData, address: t })}
                placeholder="Full street address"
              />

              <Text style={styles.label}>City *</Text>
              <TextInput
                style={styles.input}
                value={houseData.city}
                onChangeText={(t) => setHouseData({ ...houseData, city: t })}
                placeholder="e.g. Lusaka"
              />

              <Text style={styles.label}>Amenities</Text>
              <View style={styles.amenitiesGrid}>
                {COMMON_AMENITIES.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.amenityChip,
                      houseData.amenities.includes(item) && styles.amenityChipActive,
                    ]}
                    onPress={() => toggleAmenity(item)}
                  >
                    <Text
                      style={[
                        styles.amenityText,
                        houseData.amenities.includes(item) && styles.amenityTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Gender Policy *</Text>
              <View style={styles.genderGrid}>
                {GENDER_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.genderChip,
                      houseData.gender_policy === opt.value && styles.genderChipActive,
                    ]}
                    onPress={() => setHouseData({ ...houseData, gender_policy: opt.value })}
                  >
                    <Text
                      style={[
                        styles.genderText,
                        houseData.gender_policy === opt.value && styles.genderTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Rules & Policies (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={houseData.rules_and_policies}
                onChangeText={(t) => setHouseData({ ...houseData, rules_and_policies: t })}
                multiline
                numberOfLines={4}
                placeholder="Curfew, visitors, noise policy..."
              />

              <Text style={styles.label}>Guardian/Manager Name</Text>
              <TextInput
                style={styles.input}
                value={houseData.guardian_name}
                onChangeText={(t) => setHouseData({ ...houseData, guardian_name: t })}
              />

              <Text style={styles.label}>Guardian Phone</Text>
              <TextInput
                style={styles.input}
                value={houseData.guardian_phone}
                onChangeText={(t) => setHouseData({ ...houseData, guardian_phone: t })}
                keyboardType="phone-pad"
                placeholder="+260..."
              />

              <TouchableOpacity style={styles.nextButton} onPress={() => setStep(2)}>
                <Text style={styles.nextButtonText}>Next: Add Rooms</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <View style={styles.form}>
              <Text style={styles.sectionTitle}>Add Rooms & Bedspaces</Text>

              <View style={styles.roomForm}>
                <Text style={styles.label}>Room Number *</Text>
                <TextInput
                  style={styles.input}
                  value={currentRoom.room_number}
                  onChangeText={(t) => setCurrentRoom({ ...currentRoom, room_number: t })}
                  placeholder="e.g. 101"
                />

                <Text style={styles.label}>Room Name (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={currentRoom.room_name}
                  onChangeText={(t) => setCurrentRoom({ ...currentRoom, room_name: t })}
                  placeholder="e.g. Executive Room"
                />

                <View style={styles.row}>
                  <View style={styles.half}>
                    <Text style={styles.label}>Floor</Text>
                    <TextInput
                      style={styles.input}
                      value={String(currentRoom.floor_number)}
                      onChangeText={(t) => setCurrentRoom({ ...currentRoom, floor_number: Number(t) || 1 })}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.half}>
                    <Text style={styles.label}>Bedspaces *</Text>
                    <TextInput
                      style={styles.input}
                      value={String(currentRoom.bedspace_count)}
                      onChangeText={(t) => setCurrentRoom({ ...currentRoom, bedspace_count: Number(t) || 1 })}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <Text style={styles.label}>Price per Bedspace (K) *</Text>
                <TextInput
                  style={styles.input}
                  value={currentRoom.price_per_bedspace > 0 ? String(currentRoom.price_per_bedspace) : ''}
                  onChangeText={(t) => setCurrentRoom({ ...currentRoom, price_per_bedspace: Number(t) || 0 })}
                  keyboardType="numeric"
                  placeholder="800"
                />

                <Text style={styles.label}>Room Gender</Text>
                <View style={styles.genderGrid}>
                  {ROOM_GENDER.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.genderChip,
                        currentRoom.gender === opt.value && styles.genderChipActive,
                      ]}
                      onPress={() => setCurrentRoom({ ...currentRoom, gender: opt.value as any })}
                    >
                      <Text
                        style={[
                          styles.genderText,
                          currentRoom.gender === opt.value && styles.genderTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={styles.addRoomButton} onPress={addRoom}>
                  <Ionicons name="add-circle" size={20} color="#FFF" />
                  <Text style={styles.addRoomButtonText}>Add This Room</Text>
                </TouchableOpacity>
              </View>

              {rooms.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Added Rooms ({rooms.length})</Text>
                  {rooms.map((room, index) => (
                    <View key={index} style={styles.roomCard}>
                      <View style={styles.roomCardHeader}>
                        <Text style={styles.roomCardTitle}>
                          {room.room_number} {room.room_name && `– ${room.room_name}`}
                        </Text>
                        <TouchableOpacity onPress={() => removeRoom(index)}>
                          <Ionicons name="trash" size={20} color={COLORS.error || '#ef4444'} />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.roomCardDetail}>
                        Floor {room.floor_number} • {room.bedspace_count} beds • K{room.price_per_bedspace}/bed
                      </Text>
                      <Text style={styles.roomCardDetail}>Gender: {room.gender}</Text>
                    </View>
                  ))}
                </>
              )}

              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Summary</Text>
                <Text style={styles.summaryText}>Total Rooms: {rooms.length}</Text>
                <Text style={styles.summaryText}>
                  Total Bedspaces: {rooms.reduce((s, r) => s + r.bedspace_count, 0)}
                </Text>
                <Text style={styles.summaryText}>
                  Estimated Monthly Revenue: K{rooms.reduce((s, r) => s + r.bedspace_count * r.price_per_bedspace, 0).toLocaleString()}
                </Text>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
                  <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>Create Boarding House</Text>
                      <Ionicons name="checkmark" size={20} color="#FFF" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background || '#f9fafb',
  },
  header: {
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
    color: '#FFF',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  stepDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: COLORS.primary || '#1E40AF',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  stepLine: {
    width: 60,
    height: 2,
    backgroundColor: '#d1d5db',
    marginHorizontal: 10,
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  half: {
    flex: 1,
  },
  imageScroll: {
    marginBottom: 12,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageBtn: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary || '#1E40AF',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  addImageText: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.primary || '#1E40AF',
    textAlign: 'center',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 8,
  },
  amenityChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  amenityChipActive: {
    backgroundColor: COLORS.primary || '#1E40AF',
    borderColor: COLORS.primary || '#1E40AF',
  },
  amenityText: {
    fontSize: 13,
    color: '#4b5563',
  },
  amenityTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  genderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 8,
  },
  genderChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  genderChipActive: {
    backgroundColor: COLORS.primary || '#1E40AF',
    borderColor: COLORS.primary || '#1E40AF',
  },
  genderText: {
    fontWeight: '600',
    color: '#4b5563',
    fontSize: 13,
  },
  genderTextActive: {
    color: '#FFF',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary || '#1E40AF',
    padding: 16,
    borderRadius: 12,
    marginTop: 32,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  roomForm: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  addRoomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
    gap: 6,
  },
  addRoomButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  roomCard: {
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 10,
  },
  roomCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  roomCardDetail: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: '#1E40AF10',
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary || '#1E40AF',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#4b5563',
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 40,
    marginTop: 16,
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary || '#1E40AF',
    gap: 6,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary || '#1E40AF',
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary || '#1E40AF',
    padding: 16,
    borderRadius: 12,
    gap: 6,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFF',
  },
});