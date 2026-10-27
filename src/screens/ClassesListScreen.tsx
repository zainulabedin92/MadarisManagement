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
import { RootStackParamList, ClassItem, Teacher } from '../types';
import { apiService } from '../services/api';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, any>;
}

const INITIAL_DEMO_CLASSES: ClassItem[] = [
  {
    _id: 'seed-c1',
    name: 'Shoba-e-Tahfeez (Hifz) - Batch A',
    section: 'A',
    roomNumber: '101',
    academicYear: '2026-2027',
    status: 'Active',
    classTeacher: {
      name: 'Qari Tariq Jameel Sahib',
      phone: '03001234567',
      role: 'Hifz Teacher',
      status: 'Active',
    },
  },
  {
    _id: 'seed-c2',
    name: 'Shoba-e-Tahfeez (Hifz) - Batch B',
    section: 'B',
    roomNumber: '102',
    academicYear: '2026-2027',
    status: 'Active',
    classTeacher: {
      name: 'Qari Saeed-ur-Rehman',
      phone: '03456677889',
      role: 'Tajweed Teacher',
      status: 'Active',
    },
  },
  {
    _id: 'seed-c3',
    name: 'Dars-e-Nizami (Sanwiya Khasa)',
    section: 'A',
    roomNumber: '201',
    academicYear: '2026-2027',
    status: 'Active',
    classTeacher: {
      name: 'Maulana Bilal Ahmad',
      phone: '03219876543',
      role: 'Darse Nizami Teacher',
      status: 'Active',
    },
  },
  {
    _id: 'seed-c4',
    name: 'Tajweed & Qiraat Academy',
    section: 'A',
    roomNumber: '204',
    academicYear: '2026-2027',
    status: 'Active',
    classTeacher: {
      name: 'Qari Saeed-ur-Rehman',
      phone: '03456677889',
      role: 'Tajweed Teacher',
      status: 'Active',
    },
  },
  {
    _id: 'seed-c5',
    name: 'Nazra Quran & Ibtidaiyya',
    section: 'C',
    roomNumber: '105',
    academicYear: '2026-2027',
    status: 'Active',
    classTeacher: {
      name: 'Maulana Zubair Usmani',
      phone: '03125556677',
      role: 'Nazra Teacher',
      status: 'Active',
    },
  },
];

export const ClassesListScreen: React.FC<Props> = ({ navigation }) => {
  const [classes, setClasses] = useState<ClassItem[]>(INITIAL_DEMO_CLASSES);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await apiService.getClasses();
      if (res.success && res.classes && res.classes.length > 0) {
        setClasses(res.classes);
      } else {
        setClasses(INITIAL_DEMO_CLASSES);
      }
    } catch {
      setClasses(INITIAL_DEMO_CLASSES);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      fetchClasses();
    });
    return unsub;
  }, [navigation, fetchClasses]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchClasses();
  };

  const handleCallTeacher = (phone?: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Call Failed', `Cannot dial ${phone} on this device.`);
    });
  };

  const handleWhatsAppTeacher = (phone?: string) => {
    if (!phone) return;
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '92' + cleanPhone.slice(1);
    }
    const url = `whatsapp://send?phone=${cleanPhone}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('WhatsApp Unavailable', 'WhatsApp is not installed on this device.');
    });
  };

  const filteredClasses = classes.filter((c) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = c.name.toLowerCase().includes(q);
      const matchSection = (c.section || '').toLowerCase().includes(q);
      const matchRoom = (c.roomNumber || '').toLowerCase().includes(q);
      const teacherObj = typeof c.classTeacher === 'object' ? c.classTeacher : null;
      const matchTeacher = teacherObj ? teacherObj.name.toLowerCase().includes(q) : false;
      if (!matchName && !matchSection && !matchRoom && !matchTeacher) return false;
    }
    return true;
  });

  const renderClassCard = ({ item }: { item: ClassItem }) => {
    const teacher = typeof item.classTeacher === 'object' ? (item.classTeacher as Teacher) : null;
    const isActive = item.status === 'Active';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={() => {
          setSelectedClass(item);
          setDetailModalVisible(true);
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.classIconCircle}>
            <Text style={styles.classIcon}>🏛️</Text>
          </View>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={styles.titleRow}>
              <Text style={styles.className} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={[styles.statusBadge, isActive ? styles.badgeActive : styles.badgeInactive]}>
                <Text style={[styles.statusText, isActive ? styles.statusTextActive : styles.statusTextInactive]}>
                  {isActive ? '● Active' : '○ Inactive'}
                </Text>
              </View>
            </View>

            <View style={styles.pillsRow}>
              <View style={styles.pill}>
                <Text style={styles.pillText}>Section {item.section}</Text>
              </View>
              {item.roomNumber ? (
                <View style={styles.pill}>
                  <Text style={styles.pillText}>🚪 Room {item.roomNumber}</Text>
                </View>
              ) : null}
              <View style={styles.pillYear}>
                <Text style={styles.pillYearText}>📅 {item.academicYear}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Teacher Info Box */}
        <View style={styles.teacherBox}>
          <View style={styles.teacherInfoLeft}>
            <Text style={styles.teacherLabel}>CLASS TEACHER (نگران استاذ)</Text>
            <Text style={styles.teacherName} numberOfLines={1}>
              {teacher?.name || 'No Teacher Assigned'}
            </Text>
            {teacher?.role ? <Text style={styles.teacherRole}>{teacher.role}</Text> : null}
          </View>

          {teacher?.phone ? (
            <View style={styles.teacherActions}>
              <TouchableOpacity
                style={styles.iconBtnCall}
                onPress={() => handleCallTeacher(teacher.phone)}
                activeOpacity={0.7}
              >
                <Text style={styles.iconBtnText}>📞 Call</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtnWA}
                onPress={() => handleWhatsAppTeacher(teacher.phone)}
                activeOpacity={0.7}
              >
                <Text style={styles.iconBtnText}>💬 Chat</Text>
              </TouchableOpacity>
            </View>
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
            <Text style={styles.headerTitle}>درجات و شعبہ جات (Classes)</Text>
            <Text style={styles.headerSubtitle}>Active Sections & Classrooms</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('ClassAddScreen')}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+ Create Class</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by class name, section, or teacher..."
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

      {/* Count Strip */}
      <View style={styles.countStrip}>
        <Text style={styles.countText}>
          Total Active Sections: <Text style={styles.countBold}>{filteredClasses.length}</Text>
        </Text>
        <Text style={styles.yearTag}>Academic Year: 2026-2027</Text>
      </View>

      {/* Classes List */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loaderText}>Loading Classes & Darjat...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredClasses}
          keyExtractor={(item, index) => item._id || item.id || `c-${index}`}
          renderItem={renderClassCard}
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
              <Text style={styles.emptyIcon}>🏛️</Text>
              <Text style={styles.emptyTitle}>No Classes Found</Text>
              <Text style={styles.emptyDesc}>
                {searchQuery
                  ? 'No class matched your search criteria.'
                  : 'No classes have been created yet.'}
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('ClassAddScreen')}
              >
                <Text style={styles.emptyBtnText}>Create New Class</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Class Detail Modal */}
      <Modal
        visible={detailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{selectedClass?.name}</Text>
                <Text style={styles.modalSubtitle}>
                  Section {selectedClass?.section} • Room {selectedClass?.roomNumber || 'N/A'}
                </Text>
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
                <Text style={styles.detailLabel}>Academic Year</Text>
                <Text style={styles.detailVal}>{selectedClass?.academicYear}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Class Status</Text>
                <Text
                  style={[
                    styles.detailVal,
                    { color: selectedClass?.status === 'Active' ? '#059669' : '#dc2626' },
                  ]}
                >
                  {selectedClass?.status || 'Active'}
                </Text>
              </View>

              {typeof selectedClass?.classTeacher === 'object' && selectedClass?.classTeacher ? (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Assigned Class Teacher</Text>
                    <Text style={styles.detailVal}>
                      {(selectedClass.classTeacher as Teacher).name}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Teacher Contact</Text>
                    <Text style={styles.detailVal}>
                      {(selectedClass.classTeacher as Teacher).phone}
                    </Text>
                  </View>
                </>
              ) : null}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalDoneBtn, { backgroundColor: '#059669', marginBottom: 10 }]}
                  onPress={() => {
                    const cls = selectedClass;
                    setDetailModalVisible(false);
                    if (cls) {
                      const teacherName =
                        typeof cls.classTeacher === 'object' && cls.classTeacher
                          ? (cls.classTeacher as Teacher).name
                          : undefined;
                      navigation.navigate('AttendanceScreen', {
                        initialTab: 'mark',
                        filterDarja: cls.name,
                        className: `${cls.name} (Sec ${cls.section})`,
                        teacherName,
                        role: 'superadmin',
                        readOnly: false,
                      });
                    }
                  }}
                >
                  <Text style={styles.modalDoneBtnText}>☑ Class Attendance & Reports (Monthly / Yearly)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalDoneBtn}
                  onPress={() => setDetailModalVisible(false)}
                >
                  <Text style={styles.modalDoneBtnText}>Close</Text>
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
  yearTag: {
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
    alignItems: 'flex-start',
  },
  classIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  classIcon: {
    fontSize: 22,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  className: {
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
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  pill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  pillYear: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillYearText: {
    fontSize: 11,
    color: '#92400e',
    fontWeight: '600',
  },
  teacherBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teacherInfoLeft: {
    flex: 1,
  },
  teacherLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  teacherName: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: 'bold',
    marginTop: 2,
  },
  teacherRole: {
    fontSize: 11,
    color: '#059669',
    marginTop: 1,
  },
  teacherActions: {
    flexDirection: 'row',
    gap: 6,
  },
  iconBtnCall: {
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  iconBtnWA: {
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  iconBtnText: {
    color: '#ffffff',
    fontSize: 11,
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
    marginTop: 20,
    marginBottom: 10,
  },
  modalDoneBtn: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalDoneBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
