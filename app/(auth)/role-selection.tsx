// ========================================
// FILE: app/(auth)/role-selection.tsx
// ========================================
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';

const { width } = Dimensions.get('window');

export default function RoleSelectionScreen() {
  const router = useRouter();

  const roles = [
    {
      id: 'tenant',
      title: 'I want to Rent',
      subtitle: 'Find your perfect home',
      description: 'Browse listings, schedule viewings, and move in hassle-free',
      icon: 'search' as const,
      color: COLORS.primary,
    },
    {
      id: 'landlord',
      title: 'I have Property',
      subtitle: 'List and manage properties',
      description: 'Post listings, screen tenants, and manage rent payments',
      icon: 'business' as const,
      color: COLORS.primary,
    },
  ];

  const handleRoleSelect = (role: string) => {
    router.push({
      pathname: '/(auth)/register',
      params: { role },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Background */}
      <View style={styles.headerBackground}>
        <View style={styles.decorativeCircles}>
          <View style={[styles.circle, styles.circleBlue]} />
          <View style={[styles.circle, styles.circleGreen]} />
          <View style={[styles.circle, styles.circleOrange]} />
        </View>
      </View>

      {/* Header Content */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>

        {/* Logo */}
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

        <Text style={styles.title}>Join StayIN</Text>
        <Text style={styles.subtitle}>Choose how you want to use StayIN</Text>
      </View>

      {/* Role Cards */}
      <View style={styles.rolesContainer}>
        {roles.map((role, index) => (
          <TouchableOpacity
            key={role.id}
            style={[
              styles.roleCard,
              { 
                borderColor: role.color,
                marginTop: index === 0 ? 0 : 16,
              }
            ]}
            onPress={() => handleRoleSelect(role.id)}
            activeOpacity={0.7}
          >
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: role.color }]}>
                <Ionicons name={role.icon} size={28} color={COLORS.white} />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.roleTitle}>{role.title}</Text>
                <Text style={[styles.roleSubtitle, { color: role.color }]}>
                  {role.subtitle}
                </Text>
              </View>
            </View>

            {/* Card Description */}
            <Text style={styles.roleDescription}>{role.description}</Text>

            {/* Arrow Button */}
            <View style={styles.arrowContainer}>
              <View style={[styles.arrow, { backgroundColor: role.color }]}>
                <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
              </View>
            </View>

            {/* Card Decoration */}
            <View style={[styles.cardDecoration, { backgroundColor: role.color + '10' }]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Features */}
      {/* <View style={styles.featuresContainer}>
        <Text style={styles.featuresTitle}>Why Choose StayIN?</Text>
        <View style={styles.featuresGrid}>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: COLORS.primary + '15' }]}>
              <Ionicons name="shield-checkmark" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.featureText}>Secure{'\n'}payments</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: COLORS.secondary + '15' }]}>
              <Ionicons name="trending-up" size={22} color={COLORS.secondary} />
            </View>
            <Text style={styles.featureText}>Easy{'\n'}management</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: COLORS.accent + '15' }]}>
              <Ionicons name="notifications" size={22} color={COLORS.accent} />
            </View>
            <Text style={styles.featureText}>Real-time{'\n'}alerts</Text>
          </View>
        </View>
      </View> */}

      {/* Already have account */}
      <View style={styles.loginContainer}>
        <Text style={styles.loginText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.loginLink}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
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
  decorativeCircles: {
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
    left: -20,
  },
  circleOrange: {
    width: 100,
    height: 100,
    backgroundColor: COLORS.accent,
    top: 150,
    right: 30,
  },
  header: {
    alignItems: 'center',
    marginTop: -160,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 0,
    padding: 8,
    zIndex: 10,
  },
  logoContainer: {
    marginBottom: 10,
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  brandName: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 2,
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
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray[700],
    opacity: 0.9,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  rolesContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  roleCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 3,
  },
  roleSubtitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  roleDescription: {
    fontSize: 13,
    color: COLORS.gray[600],
    lineHeight: 19,
    marginBottom: 12,
  },
  arrowContainer: {
    alignItems: 'flex-end',
  },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDecoration: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    bottom: -30,
    right: -30,
    opacity: 0.5,
  },
  featuresContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.gray[900],
    marginBottom: 16,
    textAlign: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 11,
    color: COLORS.gray[700],
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 15,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 4,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    marginHorizontal: 20,
  },
  loginText: {
    color: COLORS.gray[600],
    fontSize: 14,
  },
  loginLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});