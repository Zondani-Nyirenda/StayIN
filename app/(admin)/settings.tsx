// ========================================
// FILE: app/(admin)/settings.tsx
// System Settings Screen
// ========================================
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';
import AdminService, { SystemSettings } from '../../services/adminService';

export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  
  // Editable values
  const [platformCommission, setPlatformCommission] = useState('');
  const [maintenanceFee, setMaintenanceFee] = useState('');
  const [applicationFee, setApplicationFee] = useState('');
  const [penaltyRate, setPenaltyRate] = useState('');
  const [taxReminderDays, setTaxReminderDays] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const systemSettings = await AdminService.getSystemSettings();
      setSettings(systemSettings);
      
      // Initialize editable fields
      setPlatformCommission(systemSettings.platform_commission.toString());
      setMaintenanceFee(systemSettings.maintenance_fee.toString());
      setApplicationFee(systemSettings.application_fee.toString());
      setPenaltyRate(systemSettings.penalty_rate.toString());
      setTaxReminderDays(systemSettings.tax_reminder_days.toString());
    } catch (error) {
      console.error('Failed to load settings:', error);
      Alert.alert('Error', 'Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const updatedSettings: Partial<SystemSettings> = {
        platform_commission: parseFloat(platformCommission),
        maintenance_fee: parseFloat(maintenanceFee),
        application_fee: parseFloat(applicationFee),
        penalty_rate: parseFloat(penaltyRate),
        tax_reminder_days: parseInt(taxReminderDays),
      };

      // Validate
      const total = updatedSettings.platform_commission! + 
                   updatedSettings.maintenance_fee! + 
                   updatedSettings.application_fee!;
      
      if (total > 100) {
        Alert.alert('Invalid', 'Total fees cannot exceed 100%');
        return;
      }

      await AdminService.updateSystemSettings(updatedSettings);
      Alert.alert('Success', 'Settings updated successfully');
      setEditMode(false);
      loadSettings();
    } catch (error) {
      Alert.alert('Error', 'Failed to update settings');
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    if (settings) {
      setPlatformCommission(settings.platform_commission.toString());
      setMaintenanceFee(settings.maintenance_fee.toString());
      setApplicationFee(settings.application_fee.toString());
      setPenaltyRate(settings.penalty_rate.toString());
      setTaxReminderDays(settings.tax_reminder_days.toString());
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const netOwnerPercentage = 100 - 
    parseFloat(platformCommission || '0') - 
    parseFloat(maintenanceFee || '0') - 
    parseFloat(applicationFee || '0');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>System Settings</Text>
        {!editMode ? (
          <TouchableOpacity onPress={() => setEditMode(true)} style={styles.editButton}>
            <Ionicons name="create-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <ScrollView style={styles.content}>
        {/* Fee Structure Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cash-outline" size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Fee Structure</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Configure platform fees and commissions. Owners will see these breakdowns.
          </Text>

          {/* Platform Commission */}
          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <Text style={styles.settingLabel}>Platform Commission</Text>
              <Text style={styles.settingSubtitle}>StayIN's revenue share</Text>
            </View>
            {editMode ? (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={platformCommission}
                  onChangeText={setPlatformCommission}
                  keyboardType="decimal-pad"
                  placeholder="0"
                />
                <Text style={styles.inputSuffix}>%</Text>
              </View>
            ) : (
              <Text style={styles.settingValue}>{settings?.platform_commission}%</Text>
            )}
          </View>

          {/* Maintenance Fee */}
          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <Text style={styles.settingLabel}>Maintenance Fund</Text>
              <Text style={styles.settingSubtitle}>Reserved for property maintenance</Text>
            </View>
            {editMode ? (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={maintenanceFee}
                  onChangeText={setMaintenanceFee}
                  keyboardType="decimal-pad"
                  placeholder="0"
                />
                <Text style={styles.inputSuffix}>%</Text>
              </View>
            ) : (
              <Text style={styles.settingValue}>{settings?.maintenance_fee}%</Text>
            )}
          </View>

          {/* Application Fee */}
          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <Text style={styles.settingLabel}>Application Processing Fee</Text>
              <Text style={styles.settingSubtitle}>Fee for processing applications</Text>
            </View>
            {editMode ? (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={applicationFee}
                  onChangeText={setApplicationFee}
                  keyboardType="decimal-pad"
                  placeholder="0"
                />
                <Text style={styles.inputSuffix}>%</Text>
              </View>
            ) : (
              <Text style={styles.settingValue}>{settings?.application_fee}%</Text>
            )}
          </View>

          {/* Net to Owner (Calculated) */}
          <View style={[styles.settingCard, styles.highlightCard]}>
            <View style={styles.settingHeader}>
              <Text style={styles.settingLabel}>Net to Property Owner</Text>
              <Text style={styles.settingSubtitle}>Amount owner receives</Text>
            </View>
            <Text style={[styles.settingValue, { color: COLORS.success }]}>
              {netOwnerPercentage.toFixed(1)}%
            </Text>
          </View>

          {/* Example Breakdown */}
          <View style={styles.exampleCard}>
            <Text style={styles.exampleTitle}>Example: K5,000 Rent Payment</Text>
            <View style={styles.exampleRow}>
              <Text style={styles.exampleLabel}>Platform Commission ({platformCommission}%)</Text>
              <Text style={styles.exampleValue}>
                K{((5000 * parseFloat(platformCommission || '0')) / 100).toFixed(2)}
              </Text>
            </View>
            <View style={styles.exampleRow}>
              <Text style={styles.exampleLabel}>Maintenance Fund ({maintenanceFee}%)</Text>
              <Text style={styles.exampleValue}>
                K{((5000 * parseFloat(maintenanceFee || '0')) / 100).toFixed(2)}
              </Text>
            </View>
            <View style={styles.exampleRow}>
              <Text style={styles.exampleLabel}>Application Fee ({applicationFee}%)</Text>
              <Text style={styles.exampleValue}>
                K{((5000 * parseFloat(applicationFee || '0')) / 100).toFixed(2)}
              </Text>
            </View>
            <View style={[styles.exampleRow, styles.exampleTotal]}>
              <Text style={styles.exampleTotalLabel}>Owner Receives</Text>
              <Text style={styles.exampleTotalValue}>
                K{((5000 * netOwnerPercentage) / 100).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="card-outline" size={24} color={COLORS.secondary} />
            <Text style={styles.sectionTitle}>Payment Settings</Text>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <Text style={styles.settingLabel}>Late Payment Penalty Rate</Text>
              <Text style={styles.settingSubtitle}>Per day overdue</Text>
            </View>
            {editMode ? (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={penaltyRate}
                  onChangeText={setPenaltyRate}
                  keyboardType="decimal-pad"
                  placeholder="0"
                />
                <Text style={styles.inputSuffix}>%</Text>
              </View>
            ) : (
              <Text style={styles.settingValue}>{settings?.penalty_rate}%/day</Text>
            )}
          </View>
        </View>

        {/* Compliance Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark-outline" size={24} color={COLORS.info} />
            <Text style={styles.sectionTitle}>Compliance & Notifications</Text>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <Text style={styles.settingLabel}>Tax Reminder Period</Text>
              <Text style={styles.settingSubtitle}>Days before tax due date</Text>
            </View>
            {editMode ? (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={taxReminderDays}
                  onChangeText={setTaxReminderDays}
                  keyboardType="number-pad"
                  placeholder="0"
                />
                <Text style={styles.inputSuffix}>days</Text>
              </View>
            ) : (
              <Text style={styles.settingValue}>{settings?.tax_reminder_days} days</Text>
            )}
          </View>
        </View>

        {/* Save/Cancel Buttons */}
        {editMode && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
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
  editButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginLeft: 8,
  },
  sectionDescription: {
    fontSize: 13,
    color: COLORS.gray[600],
    marginBottom: 16,
  },
  settingCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  highlightCard: {
    backgroundColor: COLORS.success + '10',
    borderColor: COLORS.success,
  },
  settingHeader: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  settingSubtitle: {
    fontSize: 12,
    color: COLORS.gray[600],
    marginTop: 2,
  },
  settingValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[100],
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  input: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    paddingVertical: 8,
    minWidth: 60,
    textAlign: 'right',
  },
  inputSuffix: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginLeft: 4,
  },
  exampleCard: {
    backgroundColor: COLORS.info + '10',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.info + '40',
    marginTop: 8,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 12,
  },
  exampleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  exampleLabel: {
    fontSize: 13,
    color: COLORS.gray[700],
  },
  exampleValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  exampleTotal: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[300],
  },
  exampleTotalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  exampleTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.gray[200],
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.gray[700],
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
});