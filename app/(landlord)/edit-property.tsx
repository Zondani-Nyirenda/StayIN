// ========================================
// FILE: app/(landlord)/edit-property.tsx
// Edit Existing Property
// ========================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker } from 'react-native-maps';
import { COLORS } from '../../utils/constants';
import { useAuth } from '../../contexts/AuthContext';
import LandlordService from '../../services/landlordService';
import DatabaseService from '../../services/database';

const PROPERTY_TYPES = ['residential', 'student_boarding', 'commercial'] as const;
const AMENITIES = [
  'WiFi',
  'Parking',
  'Pool',
  'Gym',
  'Security',
  'Garden',
  'Backup Power',
  'Borehole',
  'Furnished',
  'Air Conditioning',
];

export default function EditPropertyScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    property_type: 'residential' as typeof PROPERTY_TYPES[number],
    title: '',
    description: '',
    address: '',
    city: '',
    bedrooms: 1,
    bathrooms: 1,
    max_occupancy: 1,
    price_per_month: '',
    deposit_amount: '',
    amenities: [] as string[],
    images: [] as string[],
    latitude: -15.3875,
    longitude: 28.3228,
  });

  // Load property data on mount
  useEffect(() => {
    if (!id || !user?.id) return;

    const loadProperty = async () => {
      try {
        const db = DatabaseService.getDatabase(); // Import at top if needed
        const property = await db.getFirstAsync<any>(
          `SELECT * FROM properties WHERE id = ? AND owner_id = ?`,
          [Number(id), user.id]
        );

        if (!property) {
          Alert.alert('Error', 'Property not found or access denied');
          router.back();
          return;
        }

        setForm({
          property_type: property.property_type,
          title: property.title,
          description: property.description || '',
          address: property.address,
          city: property.city,
          bedrooms: property.bedrooms || 1,
          bathrooms: property.bathrooms || 1,
          max_occupancy: property.max_occupancy || 1,
          price_per_month: String(property.price_per_month),
          deposit_amount: property.deposit_amount ? String(property.deposit_amount) : '',
          amenities: property.amenities ? JSON.parse(property.amenities) : [],
          images: property.images ? JSON.parse(property.images) : [],
          latitude: property.latitude || -15.3875,
          longitude: property.longitude || 28.3228,
        });
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Failed to load property');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    loadProperty();
  }, [id, user?.id]);

  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow access to photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newImages = result.assets.map((asset) => asset.uri);
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...newImages].slice(0, 10),
      }));
    }
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const toggleAmenity = (amenity: string) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.address || !form.price_per_month) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      await LandlordService.updateProperty(Number(id), user!.id, {
        ...form,
        price_per_month: Number(form.price_per_month),
        deposit_amount: form.deposit_amount ? Number(form.deposit_amount) : 0,
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        max_occupancy: Number(form.max_occupancy),
      });

      Alert.alert('Success', 'Property updated successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update property');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading property...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Property</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.form}>
        {/* Property Type */}
        <Text style={styles.label}>Property Type *</Text>
        <View style={styles.typeRow}>
          {PROPERTY_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeChip,
                form.property_type === type && styles.typeChipActive,
              ]}
              onPress={() => setForm({ ...form, property_type: type })}
            >
              <Text
                style={[
                  styles.typeText,
                  form.property_type === type && styles.typeTextActive,
                ]}
              >
                {type.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Basic Info */}
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          value={form.title}
          onChangeText={(text) => setForm({ ...form, title: text })}
          placeholder="e.g. Modern 3-Bedroom House in Roma"
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.description}
          onChangeText={(text) => setForm({ ...form, description: text })}
          multiline
          numberOfLines={4}
          placeholder="Describe the property..."
        />

        <Text style={styles.label}>Address *</Text>
        <TextInput
          style={styles.input}
          value={form.address}
          onChangeText={(text) => setForm({ ...form, address: text })}
          placeholder="Street address"
        />

        <Text style={styles.label}>City *</Text>
        <TextInput
          style={styles.input}
          value={form.city}
          onChangeText={(text) => setForm({ ...form, city: text })}
          placeholder="e.g. Lusaka"
        />

        {/* Numbers */}
        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>Bedrooms</Text>
            <TextInput
              style={styles.input}
              value={String(form.bedrooms)}
              onChangeText={(text) => setForm({ ...form, bedrooms: Number(text) || 0 })}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>Bathrooms</Text>
            <TextInput
              style={styles.input}
              value={String(form.bathrooms)}
              onChangeText={(text) => setForm({ ...form, bathrooms: Number(text) || 0 })}
              keyboardType="numeric"
            />
          </View>
        </View>

        <Text style={styles.label}>Max Occupancy</Text>
        <TextInput
          style={styles.input}
          value={String(form.max_occupancy)}
          onChangeText={(text) => setForm({ ...form, max_occupancy: Number(text) || 1 })}
          keyboardType="numeric"
        />

        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>Monthly Rent (K) *</Text>
            <TextInput
              style={styles.input}
              value={form.price_per_month}
              onChangeText={(text) => setForm({ ...form, price_per_month: text })}
              keyboardType="numeric"
              placeholder="e.g. 5000"
            />
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>Deposit (K)</Text>
            <TextInput
              style={styles.input}
              value={form.deposit_amount}
              onChangeText={(text) => setForm({ ...form, deposit_amount: text })}
              keyboardType="numeric"
              placeholder="Optional"
            />
          </View>
        </View>

        {/* Amenities */}
        <Text style={styles.label}>Amenities</Text>
        <View style={styles.amenitiesGrid}>
          {AMENITIES.map((amenity) => (
            <TouchableOpacity
              key={amenity}
              style={[
                styles.amenityChip,
                form.amenities.includes(amenity) && styles.amenityChipActive,
              ]}
              onPress={() => toggleAmenity(amenity)}
            >
              <Text
                style={[
                  styles.amenityText,
                  form.amenities.includes(amenity) && styles.amenityTextActive,
                ]}
              >
                {amenity}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Images */}
        <Text style={styles.label}>Photos (up to 10)</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImages}>
          <Ionicons name="camera" size={32} color={COLORS.primary} />
          <Text style={styles.imagePickerText}>Tap to add more photos</Text>
        </TouchableOpacity>

        <View style={styles.imageGrid}>
          {form.images.map((uri, index) => (
            <View key={index} style={styles.imageContainer}>
              <Image source={{ uri }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.removeImage}
                onPress={() => removeImage(index)}
              >
                <Ionicons name="close" size={18} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Map */}
        <Text style={styles.label}>Location on Map</Text>
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            region={{
              latitude: form.latitude,
              longitude: form.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            onPress={(e) => {
              const { latitude, longitude } = e.nativeEvent.coordinate;
              setForm({ ...form, latitude, longitude });
            }}
          >
            <Marker coordinate={{ latitude: form.latitude, longitude: form.longitude }} />
          </MapView>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, saving && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.submitText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { justifyContent: 'center', alignItems: 'center', flex: 1 },
  loadingText: { marginTop: 12, fontSize: 16, color: COLORS.gray[600] },
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
  form: { padding: 16 },
  label: { fontSize: 15, fontWeight: '600', color: COLORS.gray[800], marginTop: 16, marginBottom: 8 },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  typeRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.gray[100],
    borderWidth: 1,
    borderColor: COLORS.gray[300],
  },
  typeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeText: { fontWeight: '600', color: COLORS.gray[700] },
  typeTextActive: { color: COLORS.white },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.gray[100],
    borderWidth: 1,
    borderColor: COLORS.gray[300],
  },
  amenityChipActive: { backgroundColor: COLORS.primary + '20', borderColor: COLORS.primary },
  amenityText: { fontSize: 13, color: COLORS.gray[700] },
  amenityTextActive: { color: COLORS.primary, fontWeight: '600' },
  imagePicker: {
    height: 120,
    backgroundColor: COLORS.gray[100],
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.gray[300],
    borderStyle: 'dashed',
  },
  imagePickerText: { marginTop: 8, color: COLORS.primary, fontWeight: '600' },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  imageContainer: { position: 'relative' },
  previewImage: { width: 100, height: 100, borderRadius: 8 },
  removeImage: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.error + 'cc',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapContainer: { height: 300, borderRadius: 12, overflow: 'hidden', marginVertical: 16 },
  map: { flex: 1 },
  submitButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  submitButtonDisabled: { opacity: 0.7 },
  submitText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
});