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

const INITIAL_DEMO_TEACHERS: Teacher[] = [
  {
    _id: 'seed-t1',
    name: 'Qari Tariq Jameel Sahib',
    phone: '03001234567',
    email: 'qari.tariq@mms.edu',
    cnic: '42101-1122334-1',
    role: 'Hifz Teacher',
    status: 'Active',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'seed-t2',
    name: 'Maulana Bilal Ahmad',
    phone: '03219876543',
    email: 'bilal.ahmad@mms.edu',
    cnic: '35201-5566778-3',
    role: 'Darse Nizami Teacher',
    status: 'Active',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'seed-t3',
    name: 'Sheikh Abdul Wahab',
    phone: '03334445566',
    email: 'wahab.sheikh@mms.edu',
    cnic: '61101-7788990-5',
    role: 'Head Teacher',
    status: 'Active',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'seed-t4',
    name: 'Qari Saeed-ur-Rehman',
    phone: '03456677889',
    email: 'saeed.rehman@mms.edu',
    cnic: '37405-3344556-7',
    role: 'Tajweed Teacher',
    status: 'Active',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'seed-t5',
    name: 'Maulana Zubair Usmani',
    phone: '03125556677',
    email: 'zubair.usmani@mms.edu',
    cnic: '42201-9988776-9',
    role: 'Nazra Teacher',
    status: 'Active',
    createdAt: new Date().toISOString(),
  },
];

export const TeachersListScreen: React.FC<Props> = ({ navigation }) => {
  const [teachers, setTeachers] = useState<Teacher[]>(INITIAL_DEMO_TEACHERS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const fetchTeachers = useCallback(async () => {
    try {
      const res = await apiService.getTeachers();
      if (res.success && res.teachers && res.teachers.length > 0) {
        // Merge with seed demos ensuring uniqueness by phone
        const phones = new Set(res.teachers.map((t) => t.phone));
        const uniqueDemo = INITIAL_DEMO_TEACHERS.filter((d) => !phones.has(d.phone));
        setTeachers([...res.teachers, ...uniqueDemo]);
      } else {
        setTeachers(INITIAL_DEMO_TEACHERS);
      }
    } catch {
      setTeachers(INITIAL_DEMO_TEACHERS);
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
});
