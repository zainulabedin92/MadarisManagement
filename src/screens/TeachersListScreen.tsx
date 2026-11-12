import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  Linking,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Teacher } from '../types';
import { apiService } from '../services/api';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, any>;
}

const ROLES = [
  'All',
  'Hifz Teacher',
  'Nazra Teacher',
  'Darse Nizami Teacher',
  'Head Teacher',
  'Tajweed Teacher',
  'General Teacher',
];

export const TeachersListScreen: React.FC<Props> = ({ navigation }) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // 3-dots Menu & Edit Teacher State
  const [menuTeacher, setMenuTeacher] = useState<Teacher | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [editTeacher, setEditTeacher] = useState<Teacher | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCnic, setEditCnic] = useState('');
  const [editPin, setEditPin] = useState('');
  const [editRole, setEditRole] = useState('Hifz Teacher');
  const [editStatus, setEditStatus] = useState('Active');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTeachers = useCallback(async () => {
    try {
      const res = await apiService.getTeachers();
      if (res.success && Array.isArray(res.teachers)) {
        setTeachers(res.teachers);
      } else {
        setTeachers([]);
      }
    } catch {
      setTeachers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      fetchTeachers();
    });
    return unsub;
  }, [navigation, fetchTeachers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTeachers();
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Call Failed', `Cannot dial ${phone} on this device.`);
    });
  };

  const handleWhatsApp = (phone: string) => {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '92' + cleanPhone.slice(1);
    }
    const url = `whatsapp://send?phone=${cleanPhone}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('WhatsApp Unavailable', 'WhatsApp is not installed on this device.');
    });
  };

  const handleEmail = (email?: string) => {
    if (!email) return;
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert('Mail Failed', `Cannot open email client for ${email}.`);
    });
  };

  const handleOpenMenu = (teacher: Teacher) => {
    setMenuTeacher(teacher);
    setMenuVisible(true);
  };

  const handleOpenEdit = (teacher: Teacher) => {
    setMenuVisible(false);
    setEditTeacher(teacher);
    setEditName(teacher.name || '');
    setEditPhone(teacher.phone || '');
    setEditEmail(teacher.email || '');
    setEditCnic(teacher.cnic || '');
    setEditPin('');
    setEditRole(teacher.role || 'Hifz Teacher');
    setEditStatus(teacher.status || 'Active');
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editTeacher) return;
    if (!editName.trim() || !editPhone.trim()) {
      Alert.alert('Required Fields', 'Teacher Name and Phone are required.');
      return;
    }

    if (editPin.trim() && !/^\d{4}$/.test(editPin.trim())) {
      Alert.alert('Invalid PIN', 'Teacher 4-Digit Login PIN must be exactly 4 numeric digits.');
      return;
    }

    const targetId = editTeacher._id || editTeacher.id;
    if (!targetId) {
      Alert.alert('Error', 'Invalid teacher identifier.');
      return;
    }

    setActionLoading(true);
    const updatedData: Partial<Teacher> & { pin?: string; password?: string } = {
      name: editName.trim(),
      phone: editPhone.trim(),
      email: editEmail.trim() || undefined,
      cnic: editCnic.trim() || undefined,
      role: editRole,
      status: editStatus,
    };

    if (editPin.trim()) {
      updatedData.pin = editPin.trim();
      updatedData.password = editPin.trim();
    }

    try {
      const res = await apiService.updateTeacher(targetId, updatedData);
      setActionLoading(false);
      if (res.success) {
        Alert.alert('Success', 'Teacher record updated successfully.');
        setEditModalVisible(false);
        setTeachers((prev) =>
          prev.map((t) => ((t._id || t.id) === targetId ? { ...t, ...updatedData } : t))
        );
      } else {
        Alert.alert('Update Failed', res.message || 'Could not update teacher.');
      }
    } catch (err: any) {
      setActionLoading(false);
      Alert.alert('Error', err.message || 'Failed to update teacher.');
    }
  };

  const handleDeleteTeacher = (teacher: Teacher) => {
    setMenuVisible(false);
    const targetId = teacher._id || teacher.id;
    const teacherName = teacher.name || 'this teacher';

    Alert.alert(
      'Delete Faculty Member?',
      `Are you sure you want to delete "${teacherName}"? They will also be unassigned from any class.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!targetId) return;
            try {
              setActionLoading(true);
              const res = await apiService.deleteTeacher(targetId);
              setActionLoading(false);
              if (res.success) {
                Alert.alert('Deleted', `Teacher "${teacherName}" removed successfully.`);
                setTeachers((prev) => prev.filter((t) => (t._id || t.id) !== targetId));
              } else {
                Alert.alert('Delete Failed', res.message || 'Could not delete teacher.');
              }
            } catch (err: any) {
              setActionLoading(false);
              Alert.alert('Error', err.message || 'Failed to delete teacher.');
            }
          },
        },
      ]
    );
  };

  const filteredTeachers = teachers.filter((t) => {
    if (selectedRole !== 'All' && t.role !== selectedRole) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = t.name.toLowerCase().includes(q);
      const matchPhone = t.phone.toLowerCase().includes(q);
      const matchEmail = (t.email || '').toLowerCase().includes(q);
      const matchRole = (t.role || '').toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchEmail && !matchRole) return false;
    }
    return true;
  });

  const renderTeacherCard = ({ item }: { item: Teacher }) => {
    const initials = item.name
      .split(' ')
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const isActive = item.status === 'Active';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={() => {
          setSelectedTeacher(item);
          setDetailModalVisible(true);
        }}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, isActive ? styles.avatarActive : styles.avatarInactive]}>
            <Text style={styles.avatarText}>{initials || 'AS'}</Text>
          </View>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={styles.nameRow}>
              <Text style={styles.teacherName} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={[styles.statusBadge, isActive ? styles.badgeActive : styles.badgeInactive]}>
                <Text style={[styles.statusText, isActive ? styles.statusTextActive : styles.statusTextInactive]}>
                  {isActive ? '● Active' : '○ Inactive'}
                </Text>
              </View>
              {/* 3 dots menu button */}
              <TouchableOpacity
                style={styles.moreOptionsBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                onPress={() => handleOpenMenu(item)}
              >
                <Text style={styles.moreOptionsIcon}>⋮</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.roleChip}>
              <Text style={styles.roleText}>{item.role}</Text>
            </View>
          </View>
        </View>

        {/* Info Rows */}
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📞</Text>
          <Text style={styles.infoValue}>{item.phone}</Text>
          {item.cnic ? (
            <View style={styles.cnicBadge}>
              <Text style={styles.cnicText}>{item.cnic}</Text>
            </View>
          ) : null}
        </View>

        {item.email ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>✉️</Text>
            <Text style={styles.emailValue} numberOfLines={1}>
              {item.email}
            </Text>
          </View>
        ) : null}

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtnCall}
            onPress={() => handleCall(item.phone)}
            activeOpacity={0.7}
          >
            <Text style={styles.actionBtnText}>📞 Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnWhatsApp}
            onPress={() => handleWhatsApp(item.phone)}
            activeOpacity={0.7}
          >
            <Text style={styles.actionBtnText}>💬 WhatsApp</Text>
          </TouchableOpacity>

          {item.email ? (
            <TouchableOpacity
              style={styles.actionBtnEmail}
              onPress={() => handleEmail(item.email)}
              activeOpacity={0.7}
            >
              <Text style={styles.actionBtnText}>✉️ Email</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>اساتذہ کرام (Teachers)</Text>
            <Text style={styles.headerSubtitle}>Faculty Members & Muallimeen</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('TeacherAddScreen')}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+ Add Teacher</Text>
        </TouchableOpacity>
      </View>

      {/* Search & Stats Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, phone, or email..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Role Filter Chips */}
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {ROLES.map((role) => {
            const isSelected = selectedRole === role;
            return (
              <TouchableOpacity
                key={role}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setSelectedRole(role)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {role}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Total Count Strip */}
      <View style={styles.countStrip}>
        <Text style={styles.countText}>
          Showing <Text style={styles.countBold}>{filteredTeachers.length}</Text> Teachers
        </Text>
        <Text style={styles.markazTag}>Markaz-e-Noor MMS</Text>
      </View>

      {/* Teachers List */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loaderText}>Loading Faculty Members...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTeachers}
          keyExtractor={(item, index) => item._id || item.id || `t-${index}`}
          renderItem={renderTeacherCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#059669']}
              tintColor="#059669"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>👳‍♂️</Text>
              <Text style={styles.emptyTitle}>No Teachers Found</Text>
              <Text style={styles.emptyDesc}>
                {searchQuery
                  ? 'No faculty matched your search criteria.'
                  : 'No teachers registered in this role yet.'}
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('TeacherAddScreen')}
              >
                <Text style={styles.emptyBtnText}>Register New Teacher</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Teacher Detail Modal */}
      <Modal
        visible={detailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{selectedTeacher?.name}</Text>
                <Text style={styles.modalSubtitle}>{selectedTeacher?.role}</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setDetailModalVisible(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Mobile Phone</Text>
                <Text style={styles.detailVal}>{selectedTeacher?.phone}</Text>
              </View>

              {selectedTeacher?.email ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email Address</Text>
                  <Text style={styles.detailVal}>{selectedTeacher.email}</Text>
                </View>
              ) : null}

              {selectedTeacher?.cnic ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>CNIC Number</Text>
                  <Text style={styles.detailVal}>{selectedTeacher.cnic}</Text>
                </View>
              ) : null}

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Duty Status</Text>
                <Text
                  style={[
                    styles.detailVal,
                    { color: selectedTeacher?.status === 'Active' ? '#059669' : '#dc2626' },
                  ]}
                >
                  {selectedTeacher?.status || 'Active'}
                </Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalActionBtn, { backgroundColor: '#059669' }]}
                  onPress={() => selectedTeacher && handleCall(selectedTeacher.phone)}
                >
                  <Text style={styles.modalActionBtnText}>📞 Call Now</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalActionBtn, { backgroundColor: '#25D366' }]}
                  onPress={() => selectedTeacher && handleWhatsApp(selectedTeacher.phone)}
                >
                  <Text style={styles.modalActionBtnText}>💬 WhatsApp</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 3-DOTS ACTION SHEET MODAL */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.actionSheetOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.actionSheetContent}>
            <View style={styles.actionSheetHeader}>
              <View style={styles.actionSheetIndicator} />
              <Text style={styles.actionSheetTitle} numberOfLines={1}>
                {menuTeacher?.name}
              </Text>
              <Text style={styles.actionSheetSub}>
                {menuTeacher?.role} • {menuTeacher?.phone}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.actionSheetBtn}
              activeOpacity={0.7}
              onPress={() => {
                if (menuTeacher) handleOpenEdit(menuTeacher);
              }}
            >
              <Text style={styles.actionSheetBtnIcon}>✏️</Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.actionSheetBtnText}>Edit Faculty (استاذ کی معلومات تبدیل کریں)</Text>
                <Text style={styles.actionSheetBtnDesc}>Update name, phone, role, or active status</Text>
              </View>
              <Text style={styles.actionSheetArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionSheetBtn, styles.actionSheetBtnDanger]}
              activeOpacity={0.7}
              onPress={() => {
                if (menuTeacher) handleDeleteTeacher(menuTeacher);
              }}
            >
              <Text style={styles.actionSheetBtnIcon}>🗑️</Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.actionSheetBtnText, { color: '#DC2626' }]}>
                  Delete Teacher (حذف کریں)
                </Text>
                <Text style={styles.actionSheetBtnDesc}>Remove faculty member & unassign from classes</Text>
              </View>
              <Text style={[styles.actionSheetArrow, { color: '#DC2626' }]}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionSheetCancelBtn}
              activeOpacity={0.8}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={styles.actionSheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* EDIT TEACHER MODAL */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Edit Faculty Record</Text>
                <Text style={styles.modalSubtitle}>استاذ محترم کی تفصیلات میں تبدیلی</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ maxHeight: 460, paddingHorizontal: 16 }}
              contentContainerStyle={{ paddingVertical: 10 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.fieldLabel}>Teacher Full Name *</Text>
              <TextInput
                style={styles.formInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="e.g. Maulana Bilal Ahmad"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.fieldLabel}>Phone Number *</Text>
              <TextInput
                style={styles.formInput}
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
                placeholder="0300-1234567"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.fieldLabel}>Email Address</Text>
              <TextInput
                style={styles.formInput}
                value={editEmail}
                onChangeText={setEditEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="bilal@mms.edu"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.fieldLabel}>CNIC Number</Text>
              <TextInput
                style={styles.formInput}
                value={editCnic}
                onChangeText={setEditCnic}
                placeholder="42101-1122334-1"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.fieldLabel}>Reset 4-Digit Login PIN (Optional)</Text>
              <TextInput
                style={styles.formInput}
                value={editPin}
                onChangeText={(val) => setEditPin(val.replace(/\D/g, '').slice(0, 4))}
                keyboardType="numeric"
                maxLength={4}
                placeholder="New 4-digit PIN (leave empty to keep current)"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.fieldLabel}>Designated Teaching Role</Text>
              <View style={styles.rolesGrid}>
                {ROLES.filter((r) => r !== 'All').map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[styles.roleChipOption, editRole === role && styles.roleChipOptionActive]}
                    onPress={() => setEditRole(role)}
                  >
                    <Text
                      style={[
                        styles.roleChipOptionText,
                        editRole === role && styles.roleChipOptionTextActive,
                      ]}
                    >
                      {role}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Duty Status</Text>
              <View style={styles.statusToggleRow}>
                <TouchableOpacity
                  style={[styles.statusToggleBtn, editStatus === 'Active' && styles.statusToggleBtnActive]}
                  onPress={() => setEditStatus('Active')}
                >
                  <Text style={[styles.statusToggleText, editStatus === 'Active' && styles.statusToggleTextActive]}>
                    ● Active on Duty
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.statusToggleBtn, editStatus === 'Inactive' && styles.statusToggleBtnInactive]}
                  onPress={() => setEditStatus('Inactive')}
                >
                  <Text style={[styles.statusToggleText, editStatus === 'Inactive' && styles.statusToggleTextInactive]}>
                    ○ Inactive
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10, padding: 16 }}>
              <TouchableOpacity
                style={[styles.modalActionBtn, { flex: 1, backgroundColor: '#E2E8F0' }]}
                onPress={() => setEditModalVisible(false)}
                disabled={actionLoading}
              >
                <Text style={[styles.modalActionBtnText, { color: '#475569' }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalActionBtn, { flex: 2, backgroundColor: '#059669' }]}
                onPress={handleSaveEdit}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.modalActionBtnText}>💾 Save Teacher</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#064e3b',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#a7f3d0',
  },
  addBtn: {
    backgroundColor: '#d97706',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    elevation: 2,
  },
  addBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  searchContainer: {
    backgroundColor: '#064e3b',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    paddingVertical: 0,
  },
  clearIcon: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  filterWrapper: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterScroll: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: '#059669',
  },
  filterChipText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  countStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ecfdf5',
    borderBottomWidth: 1,
    borderBottomColor: '#d1fae5',
  },
  countText: {
    fontSize: 12,
    color: '#065f46',
  },
  countBold: {
    fontWeight: 'bold',
  },
  markazTag: {
    fontSize: 11,
    color: '#047857',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarActive: {
    backgroundColor: '#065f46',
  },
  avatarInactive: {
    backgroundColor: '#94a3b8',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teacherName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 6,
  },
  badgeActive: {
    backgroundColor: '#d1fae5',
  },
  badgeInactive: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusTextActive: {
    color: '#065f46',
  },
  statusTextInactive: {
    color: '#b91c1c',
  },
  roleChip: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 11,
    color: '#92400e',
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  infoIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  infoValue: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  emailValue: {
    fontSize: 12,
    color: '#64748b',
    flex: 1,
  },
  cnicBadge: {
    marginLeft: 'auto',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cnicText: {
    fontSize: 10,
    color: '#64748b',
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 8,
  },
  actionBtnCall: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionBtnWhatsApp: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionBtnEmail: {
    flex: 1,
    backgroundColor: '#64748b',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    marginTop: 10,
    color: '#64748b',
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 32,
  },
  emptyBtn: {
    marginTop: 16,
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '600',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 18,
    color: '#94a3b8',
    fontWeight: 'bold',
  },
  modalBody: {
    marginTop: 14,
  },
  detailRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  detailLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  detailVal: {
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '500',
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 10,
  },
  modalActionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalActionBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  moreOptionsBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  moreOptionsIcon: {
    fontSize: 18,
    fontWeight: '900',
    color: '#475569',
    lineHeight: 20,
  },
  actionSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  actionSheetContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 32 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  actionSheetHeader: {
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  actionSheetIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    marginBottom: 10,
  },
  actionSheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  actionSheetSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  actionSheetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  actionSheetBtnDanger: {
    borderBottomColor: '#FEE2E2',
  },
  actionSheetBtnIcon: {
    fontSize: 20,
  },
  actionSheetBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  actionSheetBtnDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  actionSheetArrow: {
    fontSize: 20,
    color: '#94A3B8',
    fontWeight: '600',
  },
  actionSheetCancelBtn: {
    marginTop: 14,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionSheetCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginTop: 8,
    marginBottom: 4,
  },
  formInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: '#0F172A',
  },
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  roleChipOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  roleChipOptionActive: {
    backgroundColor: '#059669',
    borderColor: '#047857',
  },
  roleChipOptionText: {
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '500',
  },
  roleChipOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  statusToggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  statusToggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  statusToggleBtnActive: {
    backgroundColor: '#D1FAE5',
    borderColor: '#059669',
  },
  statusToggleBtnInactive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#DC2626',
  },
  statusToggleText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  statusToggleTextActive: {
    color: '#065F46',
    fontWeight: 'bold',
  },
  statusToggleTextInactive: {
    color: '#B91C1C',
    fontWeight: 'bold',
  },
});
