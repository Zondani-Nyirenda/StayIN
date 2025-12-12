// ========================================
// FILE: app/(auth)/register.tsx
// REVISED LOGIN HEADER STYLE VERSION
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
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
// Assuming you have a standard color for secondary text, if not, use a hex like '#666'
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

// Get screen height
const { height: screenHeight, width } = Dimensions.get('window');

// 1. SMALLER, FIXED HEADER HEIGHT (Closer to the login screen style)
const HEADER_HEIGHT = 180; 
// 2. MINIMAL CARD OVERLAP (Reduces the curve effect)
const CARD_OVERLAP = -20; 
// 3. Adjusted top padding for status bar/notch
const CONTENT_TOP_PADDING = 55; 

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

  // ... [Validation logic remains the same]
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
    // Added a check for empty phone number field before specific Zambian validation
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
      // Navigate to a confirmation or login screen after success
      Alert.alert('Success', 'Account created successfully! Please sign in.', [{ 
        text: 'OK', 
        onPress: () => router.push('/(auth)/login') 
      }]);
    } else {
      Alert.alert('Registration Failed', result.error || 'A network error occurred. Please try again.');
    }
  };


  // Role config
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* SMALLER LOGIN-STYLE BLUE HEADER */}
        <View style={[styles.headerBackground, { backgroundColor: COLORS.primary, height: HEADER_HEIGHT }]}>
          <View style={styles.headerContent}>
            
            {/* Back Button - Kept minimal as per best practice */}
            <TouchableOpacity style={[styles.backButton, { top: CONTENT_TOP_PADDING - 5 }]} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>

            {/* Logo and Brand centered at the bottom of the blue section */}
            <View style={styles.logoContainer}>
                <Image
                    source={require('../../assets/images/stay.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text style={styles.brandText}>StayIN</Text>
            </View>
            
          </View>

          {/* Decorative circles adjusted for smaller height */}
          <View style={[styles.circleLarge, { top: -HEADER_HEIGHT / 4, right: -40 }]} />
          <View style={[styles.circleSmall, { bottom: -10, left: -20 }]} />
        </View>

        {/* Form Card - Uses minimal overlap and includes all text content */}
        <View style={[styles.formCard, { marginTop: CARD_OVERLAP }]}>
            
            {/* NEW TEXT CONTENT - Moved from Header to Card */}
            <Text style={styles.titleCard}>Create Account</Text>
            <Text style={styles.subtitleCard}>Sign up to continue</Text>

            {/* Role Badge (Optional, but useful to keep the role context) */}
            <View style={[styles.roleBadgeCard, { borderColor: COLORS.primary + '60' }]}>
                <Ionicons name={config.icon as any} size={16} color={COLORS.primary} />
                <Text style={[styles.roleBadgeTextCard, { color: COLORS.primary }]}>Registering as {config.title}</Text>
            </View>
            <Text style={styles.roleSubtext}>{config.subtitle}</Text>
            {/* END NEW TEXT CONTENT */}

          <Input
            label="Full Name"
            value={formData.fullName}
            onChangeText={(text) => setFormData({ ...formData, fullName: text })}
            placeholder="e.g. Jane Doe"
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

          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            // Use margin to separate button from input, keeping it consistent with the login style
            style={{ backgroundColor: COLORS.primary, marginTop: 25, marginBottom: 10 }} 
          />

          <View style={styles.signinContainer}>
            <Text style={styles.signinText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={[styles.signinLink, { color: COLORS.primary }]}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20, // Reduced padding to match login screen's dense look
  },
  headerBackground: {
    // Height is set dynamically by HEADER_HEIGHT (180)
    width: '100%',
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end', // IMPORTANT: Push content to the bottom of the small header
    paddingBottom: 20, // Add padding below the logo
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    // top is set dynamically
    zIndex: 10,
    backgroundColor: 'transparent', // Make back button transparent
    padding: 10,
    borderRadius: 25, 
  },
  logoContainer: {
      alignItems: 'center',
      paddingTop: CONTENT_TOP_PADDING - 10, // Adjust to move logo up slightly
  },
  logo: {
    width: 60, // Slightly larger logo for focus
    height: 60,
    marginBottom: 0, 
  },
  brandText: {
    fontSize: 28, // Prominent brand text
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 1.2,
    marginTop: -5, // Move closer to the logo
  },
  // --- New Styles for content moved to Card ---
  titleCard: {
    fontSize: 26, 
    fontWeight: 'bold',
    color: COLORS.primary, // Use a dark text color
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitleCard: {
    fontSize: 16,
    color: COLORS.secondary || '#666',
    textAlign: 'center',
    marginBottom: 20, // Add space below title/subtitle
  },
  roleBadgeCard: {
    flexDirection: 'row',
    alignSelf: 'center', // Center the badge
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1, // Add a border for definition
    marginTop: 10,
    marginBottom: 5,
  },
  roleBadgeTextCard: {
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 8,
  },
  roleSubtext: {
      fontSize: 14,
      color: COLORS.secondary || '#666',
      textAlign: 'center',
      marginBottom: 25, // Separator space before first input
  },
  // --- End New Styles ---
  
  // Decorative circles
  circleLarge: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  circleSmall: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  formCard: {
    marginHorizontal: 24,
    // marginTop is set dynamically by CARD_OVERLAP
    backgroundColor: COLORS.white,
    borderRadius: 16, 
    paddingVertical: 30,
    paddingHorizontal: 20,
    
    // Professional shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  signinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
  signinText: {
    color: COLORS.secondary || '#666', 
    fontSize: 14,
  },
  signinLink: {
    fontWeight: '700',
    fontSize: 14,
  },
});