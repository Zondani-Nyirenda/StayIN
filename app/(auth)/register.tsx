// ========================================
// FILE: app/(auth)/register.tsx
// OPTIMIZED VERSION - ALL CONTENT FITS ON SCREEN
// ========================================
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Input } from '../../components/ui/Input'; 
import { Button } from '../../components/ui/Button';
import { COLORS } from '../../utils/constants';
import {
  validateEmail,
  validatePassword,
  validatePhoneNumber,
  validateFullName,
} from '../../utils/validators';
import authService from '../../services/authService';
import { Ionicons } from '@expo/vector-icons';

const { height: screenHeight } = Dimensions.get('window');

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const role = (params.role as 'tenant' | 'landlord') || 'tenant';

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = { fullName: '', email: '', phoneNumber: '', password: '', confirmPassword: '' };
    let isValid = true;

    if (!validateFullName(formData.fullName)) {
      newErrors.fullName = 'Please enter your full name';
      isValid = false;
    }
    if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
      isValid = false;
    }
    if (!formData.phoneNumber) {
        newErrors.phoneNumber = 'Please enter your phone number';
        isValid = false;
    } else if (!validatePhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid Zambian phone number';
      isValid = false;
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.valid) {
      newErrors.password = passwordValidation.message || '';
      isValid = false;
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    const result = await authService.register({
      email: formData.email,
      password: formData.password,
      fullName: formData.fullName,
      phoneNumber: formData.phoneNumber,
      role,
    });
    setLoading(false);

    if (result.success) {
      Alert.alert('Success', 'Account created successfully! Please sign in.', [{ 
        text: 'OK', 
        onPress: () => router.push('/(auth)/login') 
      }]);
    } else {
      Alert.alert('Registration Failed', result.error || 'A network error occurred. Please try again.');
    }
  };

  const config = {
    color: COLORS.primary, 
    icon: role === 'tenant' ? 'home-outline' : 'business-outline', 
    title: role === 'tenant' ? 'Tenant' : 'Property Owner',
    subtitle: role === 'tenant' ? 'Find your perfect home' : 'Manage your properties efficiently',
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0} 
    >
      {/* Use View instead of ScrollView since everything fits */}
      <View style={styles.contentContainer}>
        {/* Main Content - Compact layout */}
        <View style={styles.content}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to continue</Text>

          <View style={[styles.roleBadge, { borderColor: COLORS.primary + '40' }]}>
            <Ionicons name={config.icon as any} size={16} color={COLORS.primary} />
            <Text style={[styles.roleBadgeText, { color: COLORS.primary }]}>
              Registering as {config.title}
            </Text>
          </View>

          {/* Input Fields - Compact spacing */}
          <View style={styles.inputsContainer}>
            <Input
              label="Full Name"
              value={formData.fullName}
              onChangeText={(text) => setFormData({ ...formData, fullName: text })}
              placeholder="e.g. boyd nyirenda"
              error={errors.fullName}
              icon="person-outline"
            />
            <Input
              label="Email Address"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              icon="mail-outline" 
            />
            <Input
              label="Phone Number"
              value={formData.phoneNumber}
              onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
              placeholder="+260 or 09xxxxxxxx"
              keyboardType="phone-pad"
              error={errors.phoneNumber}
              icon="call-outline"
            />
            <Input
              label="Password"
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              placeholder="Create a strong password"
              isPassword
              error={errors.password}
              icon="lock-closed-outline"
            />
            <Input
              label="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
              placeholder="Confirm your password"
              isPassword
              error={errors.confirmPassword}
              icon="lock-closed-outline"
            />
          </View>

          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            style={styles.createButton}
          />

          <View style={styles.signinContainer}>
            <Text style={styles.signinText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.signinLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  content: {
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 22, // Reduced from 24
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 6, // Reduced from 8
  },
  subtitle: {
    fontSize: 13, // Reduced from 14
    color: COLORS.gray[600],
    textAlign: 'center',
    marginBottom: 12, // Reduced from 16
  },
  roleBadge: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    paddingVertical: 4, // Reduced from 6
    paddingHorizontal: 10, // Reduced from 12
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 6, // Reduced from 8
  },
  roleBadgeText: {
    fontWeight: '600',
    fontSize: 11, // Reduced from 12
    marginLeft: 4, // Reduced from 6
  },
  inputsContainer: {
    gap: 10, // Reduced from 16 - much more compact
    marginBottom: 8, // Added to reduce space below inputs
  },
  createButton: {
    backgroundColor: COLORS.primary,
    marginTop: 16, // Reduced from 24
    marginBottom: 12, // Reduced from 16
  },
  signinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 12, // Reduced from 16
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    marginTop: 8, // Added to reduce space
  },
  signinText: {
    color: COLORS.gray[600],
    fontSize: 13, // Reduced from 14
  },
  signinLink: {
    color: COLORS.primary,
    fontSize: 13, // Reduced from 14
    fontWeight: '700',
    marginLeft: 4,
  },
});