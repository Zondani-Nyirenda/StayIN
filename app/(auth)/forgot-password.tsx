// ========================================
// FILE: app/(auth)/forgot-password.tsx
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { COLORS } from '../../utils/constants';
import { validateEmail } from '../../utils/validators';
import authService from '../../services/authService';
import { Ionicons } from '@expo/vector-icons';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!validateEmail(email)) {
      setError('Please enter a valid email');
      return;
    }

    setLoading(true);
    const result = await authService.forgotPassword(email);
    setLoading(false);

    if (result.success) {
      Alert.alert(
        'Email Sent',
        'Password reset instructions have been sent to your email.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      Alert.alert('Error', result.error || 'Failed to send reset email');
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
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.gray[900]} />
        </TouchableOpacity>

        <View style={styles.iconContainer}>
          <Ionicons name="key-outline" size={64} color={COLORS.primary} />
        </View>

        <Text style={styles.title}>Forgot Password?</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we'll send you instructions to reset your
          password.
        </Text>

        <Input
          label="Email Address"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setError('');
          }}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          error={error}
          icon="mail-outline"
        />

        <Button
          title="Send Reset Link"
          onPress={handleResetPassword}
          loading={loading}
          style={styles.button}
        />

        <TouchableOpacity
          style={styles.backToLogin}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={16} color={COLORS.primary} />
          <Text style={styles.backToLoginText}>Back to Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    padding: 8,
    marginBottom: 40,
    alignSelf: 'flex-start',
  },
  iconContainer: {
    alignSelf: 'center',
    width: 120,
    height: 120,
    backgroundColor: COLORS.gray[50],
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray[600],
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  button: {
    marginTop: 16,
    marginBottom: 24,
  },
  backToLogin: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  backToLoginText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});