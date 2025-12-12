// ========================================
// FILE: app/(auth)/login.tsx
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
import { useRouter } from 'expo-router';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { COLORS } from '../../utils/constants';
import { validateEmail, validatePassword } from '../../utils/validators';
import authService from '../../services/authService';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = { email: '', password: '' };
    let isValid = true;

    if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email';
      isValid = false;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      newErrors.password = passwordValidation.message || '';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    const result = await authService.login(email, password);
    setLoading(false);

    if (result.success && result.userData) {
      // Navigation handled by AuthContext
    } else {
      Alert.alert('Login Failed', result.error || 'Please check your credentials');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Gradient Header Background */}
        <View style={styles.headerBackground}>
          <View style={styles.gradientOverlay}>
            {/* Decorative circles */}
            <View style={[styles.circle, styles.circleBlue]} />
            <View style={[styles.circle, styles.circleGreen]} />
            <View style={[styles.circle, styles.circleOrange]} />
          </View>
        </View>

        {/* Header with Logo */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/images/stay.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          
          <View style={styles.brandContainer}>
            <Text style={styles.brandName}>
              <Text style={styles.brandStay}>Stay</Text>
              <Text style={styles.brandIn}>IN</Text>
            </Text>
            <Text style={styles.tagline}>Rent Smarter | Secure | with Ease</Text>
          </View>
        </View>

        {/* Welcome Text Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <Input
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
            icon="mail-outline"
          />

          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            isPassword
            error={errors.password}
            icon="lock-closed-outline"
          />

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => router.push('/forgot-password')}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginButton}
          />

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Sign Up Link */}
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/role-selection')}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer Features */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: COLORS.primary + '15' }]}>
              <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.featureText}>Secure</Text>
          </View>
          
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: COLORS.secondary + '15' }]}>
              <Ionicons name="flash" size={20} color={COLORS.secondary} />
            </View>
            <Text style={styles.featureText}>Fast</Text>
          </View>
          
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: COLORS.accent + '15' }]}>
              <Ionicons name="checkmark-done" size={20} color={COLORS.accent} />
            </View>
            <Text style={styles.featureText}>Easy</Text>
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
    paddingBottom: 30,
  },
  headerBackground: {
    height: 200,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  gradientOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 102, 204, 0.95)',
  },
  circle: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.15,
  },
  circleBlue: {
    width: 180,
    height: 180,
    backgroundColor: COLORS.white,
    top: -50,
    right: -40,
  },
  circleGreen: {
    width: 140,
    height: 140,
    backgroundColor: COLORS.secondary,
    top: 80,
    right: 40,
  },
  circleOrange: {
    width: 100,
    height: 100,
    backgroundColor: COLORS.accent,
    top: 150,
    left: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: -150,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  logoContainer: {
    marginBottom: 5,
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  brandContainer: {
    alignItems: 'center',
  },
  brandName: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  brandStay: {
    color: COLORS.white,
  },
  brandIn: {
    color: COLORS.secondary,
  },
  tagline: {
    fontSize: 11,
    color: COLORS.white,
    opacity: 0.9,
    letterSpacing: 0.3,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.gray[600],
  },
  formCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    marginTop: -4,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  loginButton: {
    marginBottom: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.gray[300],
  },
  dividerText: {
    marginHorizontal: 12,
    color: COLORS.gray[500],
    fontSize: 13,
    fontWeight: '500',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    color: COLORS.gray[600],
    fontSize: 14,
  },
  signupLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 30,
    marginTop: 4,
  },
  featureItem: {
    alignItems: 'center',
  },
  featureIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  featureText: {
    fontSize: 11,
    color: COLORS.gray[700],
    fontWeight: '600',
  },
});