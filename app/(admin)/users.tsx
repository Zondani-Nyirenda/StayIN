// ========================================
// FILE: app/(admin)/users.tsx
// User Management Screen
// ========================================
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';
import AdminService, { User } from '../../services/adminService';

export default function UsersScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadUsers = async () => {
    try {
      const allUsers = await AdminService.getAllUsers();
      setUsers(allUsers);
      setFilteredUsers(allUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [selectedRole, searchQuery, users]);

  const filterUsers = () => {
    let filtered = users;

    // Filter by role
    if (selectedRole !== 'all') {
      filtered = filtered.filter(u => u.role === selectedRole);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u => 
        u.full_name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.phone_number?.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  };

  const handleStatusChange = async (userId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    Alert.alert(
      'Change Status',
      `Change user status to ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await AdminService.updateUserStatus(userId, newStatus as any);
              await loadUsers();
              Alert.alert('Success', 'User status updated');
            } catch (error) {
              Alert.alert('Error', 'Failed to update status');
            }
          }
        }
      ]
    );
  };

  const handleKYCVerification = async (userId: number, isVerified: boolean) => {
    Alert.alert(
      'KYC Verification',
      `${isVerified ? 'Remove' : 'Approve'} KYC verification?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await AdminService.verifyUserKYC(userId, !isVerified);
              await loadUsers();
              Alert.alert('Success', 'KYC status updated');
            } catch (error) {
              Alert.alert('Error', 'Failed to update KYC status');
            }
          }
        }
      ]
    );
  };

  const handleDeleteUser = (userId: number, userName: string) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${userName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await AdminService.deleteUser(userId);
              await loadUsers();
              Alert.alert('Success', 'User deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete user');
            }
          }
        }
      ]
    );
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return COLORS.error;
      case 'landlord': return COLORS.primary;
      case 'tenant': return COLORS.success;
      default: return COLORS.gray[500];
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return 'shield-checkmark';
      case 'landlord': return 'business';
      case 'tenant': return 'person';
      default: return 'person-circle';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Management</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.gray[400]} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, or phone..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Role Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {['all', 'tenant', 'landlord', 'admin'].map(role => (
          <TouchableOpacity
            key={role}
            style={[
              styles.filterChip,
              selectedRole === role && styles.filterChipActive
            ]}
            onPress={() => setSelectedRole(role)}
          >
            <Text style={[
              styles.filterChipText,
              selectedRole === role && styles.filterChipTextActive
            ]}>
              {role.charAt(0).toUpperCase() + role.slice(1)} {role === 'all' ? `(${users.length})` : `(${users.filter(u => u.role === role).length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Users List */}
      <ScrollView style={styles.content}>
        {filteredUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={COLORS.gray[300]} />
            <Text style={styles.emptyStateText}>No users found</Text>
          </View>
        ) : (
          filteredUsers.map(user => (
            <View key={user.id} style={styles.userCard}>
              {/* User Info */}
              <View style={styles.userHeader}>
                <View style={[styles.userAvatar, { backgroundColor: getRoleColor(user.role) + '20' }]}>
                  <Ionicons name={getRoleIcon(user.role) as any} size={24} color={getRoleColor(user.role)} />
                </View>
                <View style={styles.userInfo}>
                  <View style={styles.userNameRow}>
                    <Text style={styles.userName}>{user.full_name}</Text>
                    {user.kyc_verified === 1 && (
                      <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                    )}
                  </View>
                  <Text style={styles.userEmail}>{user.email}</Text>
                  {user.phone_number && (
                    <Text style={styles.userPhone}>{user.phone_number}</Text>
                  )}
                </View>
              </View>

              {/* Badges */}
              <View style={styles.badgeRow}>
                <View style={[styles.badge, { backgroundColor: getRoleColor(user.role) + '15' }]}>
                  <Text style={[styles.badgeText, { color: getRoleColor(user.role) }]}>
                    {user.role}
                  </Text>
                </View>
                <View style={[
                  styles.badge,
                  { backgroundColor: user.status === 'active' ? COLORS.success + '15' : COLORS.gray[200] }
                ]}>
                  <Text style={[
                    styles.badgeText,
                    { color: user.status === 'active' ? COLORS.success : COLORS.gray[600] }
                  ]}>
                    {user.status}
                  </Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleStatusChange(user.id, user.status)}
                >
                  <Ionicons 
                    name={user.status === 'active' ? 'pause-circle-outline' : 'play-circle-outline'} 
                    size={20} 
                    color={COLORS.info} 
                  />
                  <Text style={styles.actionButtonText}>
                    {user.status === 'active' ? 'Deactivate' : 'Activate'}
                  </Text>
                </TouchableOpacity>

                {user.role === 'landlord' && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleKYCVerification(user.id, user.kyc_verified === 1)}
                  >
                    <Ionicons 
                      name={user.kyc_verified === 1 ? 'close-circle-outline' : 'checkmark-circle-outline'} 
                      size={20} 
                      color={user.kyc_verified === 1 ? COLORS.warning : COLORS.success} 
                    />
                    <Text style={styles.actionButtonText}>
                      {user.kyc_verified === 1 ? 'Revoke KYC' : 'Verify KYC'}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteUser(user.id, user.full_name)}
                >
                  <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                  <Text style={[styles.actionButtonText, { color: COLORS.error }]}>Delete</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.joinDate}>
                Joined: {new Date(user.created_at).toLocaleDateString()}
              </Text>
            </View>
          ))
        )}
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.gray[900],
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray[600],
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray[500],
  },
  userCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.gray[600],
    marginTop: 2,
  },
  userPhone: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.gray[100],
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  joinDate: {
    fontSize: 11,
    color: COLORS.gray[500],
    marginTop: 4,
  },
});