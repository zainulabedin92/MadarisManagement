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
  Platform,
  Linking,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, Student } from '../types';
import { apiService } from '../services/api';

type StudentsListScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'StudentsListScreen'
>;

type StudentsListScreenRouteProp = RouteProp<
  RootStackParamList,
  'StudentsListScreen'
>;

interface Props {
  navigation: StudentsListScreenNavigationProp;
  route?: StudentsListScreenRouteProp;
}

// Predefined Darjat Filter Options
export const DARJAT_LIST = [
  { id: 'all', title: 'All Darjat', urdu: 'تمام درجات', icon: '🏛️' },
  { id: 'hifz', title: 'Hifz-ul-Quran', urdu: 'حفظ القرآن', icon: '📖' },
  { id: 'dars', title: 'Dars-e-Nizami', urdu: 'درس نظامی', icon: '📚' },
  { id: 'nazra', title: 'Nazra Quran', urdu: 'ناظرہ قرآن', icon: '✨' },
  { id: 'tajweed', title: 'Tajweed & Qirat', urdu: 'تجوید و قراءت', icon: '🎙️' },
  { id: 'aalim', title: 'Aalim Course', urdu: 'عالم کورس', icon: '🎓' },
  { id: 'combo', title: 'Hifz & School Combo', urdu: 'حفظ و اسکول', icon: '🎒' },
];

const getStudentDisplayName = (student: Student | null | undefined): string => {
  if (!student) return '';
  const combined = `${student.firstName || ''} ${student.lastName || ''}`.trim();
  return combined || student.fullName?.trim() || 'Student';
};

const getStudentProgram = (student: Student | null | undefined): string => {
  if (!student) return '';
  if (student.enrollmentProgram?.trim()) return student.enrollmentProgram.trim();
  if (student.classId && typeof student.classId === 'object' && student.classId.name) {
    return student.classId.name;
  }
  return '';
};

const getStudentCnic = (student: Student | null | undefined): string => {
  if (!student) return '';
  return student.cnic?.trim() || student.bFormNo?.trim() || '';
};

export const StudentsListScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const initialDarja = route?.params?.filterDarja || 'All Darjat';

  // Preserve existing session role ('teacher' | 'student' | 'parent' | 'superadmin'); only default if unset
  if (!apiService.getSessionRole()) {
    apiService.setSessionRole('superadmin');
  }
  const isStudentSession = apiService.isStudent();

  // Filters & Search
  const [selectedDarja, setSelectedDarja] = useState<string>(initialDarja);
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Data & Loading
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Student Detail Modal
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Student 3-dots Menu & Edit Modal
  const [menuStudent, setMenuStudent] = useState<Student | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);

  // Edit form state
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editFatherName, setEditFatherName] = useState('');
  const [editRollNo, setEditRollNo] = useState('');
  const [editCnic, setEditCnic] = useState('');
  const [editGuardianMobile, setEditGuardianMobile] = useState('');
  const [editGuardianEmail, setEditGuardianEmail] = useState('');
  const [editEnrollmentProgram, setEditEnrollmentProgram] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editStatus, setEditStatus] = useState('approved');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch Students from backend
  const fetchStudents = useCallback(async () => {
    try {
      if (apiService.isStudent()) {
        const meRes = await apiService.getMyProfile().catch(() => null);
        const ownStudent = meRes?.student || apiService.getCurrentStudent();
        setStudents(ownStudent ? [ownStudent] : []);
        return;
      }
      const res = await apiService.getAllStudents();
      if (res.success && Array.isArray(res.students)) {
        setStudents(res.students);
      } else {
        setStudents([]);
      }
    } catch {
      setStudents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Refresh automatically when returning from RegisterPage
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchStudents();
    });
    return unsubscribe;
  }, [navigation, fetchStudents]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStudents();
  };

  // Filtered Students Computation
  const filteredStudents = students.filter((student) => {
    // 1. Darja Filter
    if (selectedDarja !== 'All Darjat' && selectedDarja !== 'all') {
      const prog = getStudentProgram(student).toLowerCase();
      const filterKey = selectedDarja.toLowerCase();
      // Match key words (e.g., 'hifz', 'dars', 'nazra', 'tajweed', 'aalim')
      const matchesDarja =
        prog.includes(filterKey) ||
        (filterKey.includes('hifz') && prog.includes('hifz')) ||
        (filterKey.includes('dars') && prog.includes('dars')) ||
        (filterKey.includes('nazra') && prog.includes('nazra')) ||
        (filterKey.includes('tajweed') && prog.includes('tajweed')) ||
        (filterKey.includes('aalim') && prog.includes('aalim')) ||
        (filterKey.includes('combo') && prog.includes('combo'));

      if (!matchesDarja) return false;
    }

    // 2. Status Filter
    if (statusFilter !== 'all') {
      const normalizedStatus = student.status?.toLowerCase() || '';
      if (statusFilter === 'approved') {
        if (normalizedStatus !== 'approved' && normalizedStatus !== 'enrolled') {
          return false;
        }
      } else if (normalizedStatus !== statusFilter) {
        return false;
      }
    }

    // 3. Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      const fullName = getStudentDisplayName(student).toLowerCase();
      const father = (student.fatherName || '').toLowerCase();
      const cnic = getStudentCnic(student).toLowerCase();
      const mobile = (student.guardianMobile || '').toLowerCase();
      const city = (student.city || '').toLowerCase();

      const matchesSearch =
        fullName.includes(query) ||
        father.includes(query) ||
        cnic.includes(query) ||
        mobile.includes(query) ||
        city.includes(query);

      if (!matchesSearch) return false;
    }

    return true;
  });

  // Calculate count for each Darja chip
  const getDarjaCount = (darjaTitle: string) => {
    if (darjaTitle === 'All Darjat') return students.length;
    const filterKey = darjaTitle.toLowerCase();
    return students.filter((s) => {
      const prog = getStudentProgram(s).toLowerCase();
      return (
        prog.includes(filterKey) ||
        (filterKey.includes('hifz') && prog.includes('hifz')) ||
        (filterKey.includes('dars') && prog.includes('dars')) ||
        (filterKey.includes('nazra') && prog.includes('nazra')) ||
        (filterKey.includes('tajweed') && prog.includes('tajweed')) ||
        (filterKey.includes('aalim') && prog.includes('aalim')) ||
        (filterKey.includes('combo') && prog.includes('combo'))
      );
    }).length;
  };

  const handleOpenStudentDetail = (student: Student) => {
    setSelectedStudent(student);
    setDetailModalVisible(true);
  };

  const handleOpenMenu = (student: Student) => {
    setMenuStudent(student);
    setMenuVisible(true);
  };

  const handleOpenEdit = (student: Student) => {
    setMenuVisible(false);
    setEditStudent(student);
    const fullParts = (student.fullName || '').trim().split(/\s+/).filter(Boolean);
    setEditFirstName(student.firstName || fullParts[0] || '');
    setEditLastName(student.lastName || fullParts.slice(1).join(' ') || '');
    setEditFatherName(student.fatherName || '');
    setEditRollNo(student.rollNo || '');
    setEditCnic(getStudentCnic(student));
    setEditGuardianMobile(student.guardianMobile || '');
    setEditGuardianEmail(student.guardianEmail || '');
    setEditEnrollmentProgram(getStudentProgram(student) || 'Hifz-ul-Quran');
    setEditCity(student.city || '');
    setEditStatus(student.status || 'approved');
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editStudent) return;
    if (!editFirstName.trim() || !editFatherName.trim()) {
      Alert.alert('Required Fields', 'First Name and Father Name are required.');
      return;
    }

    const targetId = editStudent._id || editStudent.id;
    if (!targetId) {
      Alert.alert('Error', 'Invalid student identifier.');
      return;
    }

    setActionLoading(true);
    const updatedData: Partial<Student> = {
      firstName: editFirstName.trim(),
      lastName: editLastName.trim(),
      fullName: `${editFirstName.trim()} ${editLastName.trim()}`.trim(),
      fatherName: editFatherName.trim(),
      rollNo: editRollNo.trim() || undefined,
      cnic: editCnic.trim() || undefined,
      guardianMobile: editGuardianMobile.trim() || undefined,
      guardianEmail: editGuardianEmail.trim() || undefined,
      enrollmentProgram: editEnrollmentProgram.trim() || undefined,
      city: editCity.trim() || undefined,
      status: editStatus,
    };

    try {
      const res = await apiService.updateStudent(targetId, updatedData);
      setActionLoading(false);
      if (res.success) {
        Alert.alert('Success', 'Student record updated successfully.');
        setEditModalVisible(false);
        // Update local state
        setStudents((prev) =>
          prev.map((s) => {
            const sId = s._id || s.id;
            if (sId === targetId) {
              return { ...s, ...updatedData };
            }
            return s;
          })
        );
      } else {
        Alert.alert('Update Failed', res.message || 'Could not update student.');
      }
    } catch (err: any) {
      setActionLoading(false);
      Alert.alert('Error', err.message || 'Failed to update student.');
    }
  };

  const handleDeleteStudent = (student: Student) => {
    setMenuVisible(false);
    const targetId = student._id || student.id;
    const studentName = getStudentDisplayName(student) || 'this student';

    Alert.alert(
      'Delete Student Record?',
      `Are you sure you want to permanently delete "${studentName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!targetId) return;
            try {
              setActionLoading(true);
              const res = await apiService.deleteStudent(targetId);
              setActionLoading(false);
              if (res.success) {
                Alert.alert('Deleted', `Student "${studentName}" deleted successfully.`);
                setStudents((prev) => prev.filter((s) => (s._id || s.id) !== targetId));
              } else {
                Alert.alert('Delete Failed', res.message || 'Could not delete student.');
              }
            } catch (err: any) {
              setActionLoading(false);
              Alert.alert('Error', err.message || 'Failed to delete student.');
            }
          },
        },
      ]
    );
  };

  const handleCallGuardian = (mobile?: string) => {
    if (!mobile) return;
    Linking.openURL(`tel:${mobile}`).catch(() => {
      Alert.alert('Call Failed', `Cannot dial ${mobile} on this device.`);
    });
  };

  const renderStudentCard = ({ item }: { item: Student }) => {
    const normalizedStatus = item.status?.toLowerCase() || '';
    const isApproved = normalizedStatus === 'approved' || normalizedStatus === 'enrolled';
    const displayName = getStudentDisplayName(item);
    const nameParts = displayName.split(/\s+/).filter(Boolean);
    const initials = `${nameParts[0]?.[0] || 'M'}${nameParts[1]?.[0] || 'T'}`.toUpperCase();
    const displayCnic = getStudentCnic(item);
    const displayProgram = getStudentProgram(item);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={() => handleOpenStudentDetail(item)}
      >
        <View style={styles.cardHeader}>
          {/* Avatar with Initials */}
          <View style={[styles.avatarCircle, isApproved ? styles.avatarApproved : styles.avatarPending]}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>

          {/* Student Info */}
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={styles.nameRow}>
              <Text style={styles.studentName} numberOfLines={1}>
                {displayName}
              </Text>
              <View style={[styles.statusBadge, isApproved ? styles.statusBadgeApproved : styles.statusBadgePending]}>
                <Text style={[styles.statusBadgeText, isApproved ? styles.statusTextApproved : styles.statusTextPending]}>
                  {isApproved ? '● Active' : '⏳ Pending'}
                </Text>
              </View>
              {/* 3-dots Menu Button (hidden for students) */}
              {!isStudentSession && (
                <TouchableOpacity
                  style={styles.moreOptionsBtn}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  onPress={() => handleOpenMenu(item)}
                >
                  <Text style={styles.moreOptionsIcon}>⋮</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.fatherName} numberOfLines={1}>
              Walid: {item.fatherName || 'Not specified'}
            </Text>
          </View>
        </View>

        {/* Badges Row: Darja & CNIC */}
        <View style={styles.badgesRow}>
          <View style={styles.darjaBadge}>
            <Text style={styles.darjaBadgeIcon}>📖</Text>
            <Text style={styles.darjaBadgeText} numberOfLines={1}>
              {displayProgram || 'General Madaris'}
            </Text>
          </View>

          {displayCnic ? (
            <View style={styles.cnicBadge}>
              <Text style={styles.cnicBadgeText}>{displayCnic}</Text>
            </View>
          ) : null}
        </View>

        {/* Footer: City & Phone with Call Action */}
        <View style={styles.cardFooter}>
          <View style={styles.locationContainer}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.locationText}>{item.city || 'Pakistan'}</Text>
          </View>

          <TouchableOpacity
            style={styles.callBtn}
            activeOpacity={0.7}
            onPress={() => handleCallGuardian(item.guardianMobile)}
          >
            <Text style={styles.callBtnIcon}>📞</Text>
            <Text style={styles.callBtnText}>{item.guardianMobile}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" />
      {/* Top Navigation Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.headerBackText}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerMainTitle}>
            {isStudentSession ? 'میری معلومات • My Profile' : 'طلبہ ڈائریکٹری • Students'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isStudentSession
              ? 'Your Personal Student Record'
              : `${filteredStudents.length} Talaba Registered`}
          </Text>
        </View>

        {/* Header Add Student Button */}
        {!isStudentSession && (
          <TouchableOpacity
            style={styles.headerAddBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('RegisterPage')}
          >
            <Text style={styles.headerAddBtnText}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, father, CNIC, or mobile..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Darjat Filter Chips (Horizontal Scroll) */}
      <View style={styles.filterSection}>
        <View style={styles.filterSectionHeader}>
          <Text style={styles.filterSectionTitle}>FILTER BY DARJAT (درجات کے لحاظ سے):</Text>
          {selectedDarja !== 'All Darjat' && (
            <TouchableOpacity onPress={() => setSelectedDarja('All Darjat')}>
              <Text style={styles.resetFilterText}>Clear Filter</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {DARJAT_LIST.map((darja) => {
            const isActive =
              selectedDarja === darja.title ||
              (selectedDarja === 'All Darjat' && darja.id === 'all');
            const count = getDarjaCount(darja.title);

            return (
              <TouchableOpacity
                key={darja.id}
                style={[styles.darjaChip, isActive && styles.darjaChipActive]}
                activeOpacity={0.8}
                onPress={() => setSelectedDarja(darja.title)}
              >
                <Text style={styles.darjaChipIcon}>{darja.icon}</Text>
                <View style={{ marginLeft: 6 }}>
                  <Text style={[styles.darjaChipTitle, isActive && styles.darjaChipTitleActive]}>
                    {darja.title}
                  </Text>
                  <Text style={[styles.darjaChipUrdu, isActive && styles.darjaChipUrduActive]}>
                    {darja.urdu} ({count})
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Status Segment Filter (All / Active / Pending) */}
      <View style={styles.statusSegmentContainer}>
        <TouchableOpacity
          style={[styles.statusSegmentBtn, statusFilter === 'all' && styles.statusSegmentBtnActive]}
          onPress={() => setStatusFilter('all')}
        >
          <Text style={[styles.statusSegmentText, statusFilter === 'all' && styles.statusSegmentTextActive]}>
            All Talaba ({students.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statusSegmentBtn, statusFilter === 'approved' && styles.statusSegmentBtnActive]}
          onPress={() => setStatusFilter('approved')}
        >
          <Text style={[styles.statusSegmentText, statusFilter === 'approved' && styles.statusSegmentTextActive]}>
            Active / Approved ({students.filter((s) => s.status?.toLowerCase() === 'approved' || s.status?.toLowerCase() === 'enrolled').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statusSegmentBtn, statusFilter === 'pending' && styles.statusSegmentBtnActive]}
          onPress={() => setStatusFilter('pending')}
        >
          <Text style={[styles.statusSegmentText, statusFilter === 'pending' && styles.statusSegmentTextActive]}>
            Pending ({students.filter((s) => s.status === 'pending').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Student List View */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0F4433" />
          <Text style={styles.loadingText}>Loading Talaba directory...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={(item, index) => item._id || item.id || item.cnic || String(index)}
          renderItem={renderStudentCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#0F4433', '#059669']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>No Students Found</Text>
              <Text style={styles.emptySubtitle}>
                No student records found in Darja "{selectedDarja}" matching your search criteria.
              </Text>
              {!isStudentSession && (
                <TouchableOpacity
                  style={styles.emptyAddBtn}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('RegisterPage')}
                >
                  <Text style={styles.emptyAddBtnText}>+ Add Student in this Darja</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Floating Action Button (FAB) to Add New Student */}
      {!isStudentSession && (
        <TouchableOpacity
          style={[styles.fabBtn, { bottom: Math.max(insets.bottom, 8) + 16 }]}
          activeOpacity={0.88}
          onPress={() => navigation.navigate('RegisterPage')}
        >
          <View style={styles.fabInner}>
            <Text style={styles.fabIcon}>➕</Text>
            <Text style={styles.fabText}>Add New Student</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Student Profile Detail Modal */}
      <Modal
        visible={detailModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom + 12, 20) }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalAvatarCircle}>
                  <Text style={styles.modalAvatarText}>
                    {getStudentDisplayName(selectedStudent)?.[0]?.toUpperCase() || 'M'}
                  </Text>
                </View>
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.modalStudentName}>
                    {getStudentDisplayName(selectedStudent)}
                  </Text>
                  <Text style={styles.modalStudentRole}>
                    Talib-e-Ilm • {getStudentProgram(selectedStudent) || 'General Madaris'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setDetailModalVisible(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Modal Details Scroll */}
            <ScrollView
              style={{ maxHeight: 420 }}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionHeading}>PERSONAL & ADMISSION INFO</Text>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Full Name</Text>
                  <Text style={styles.detailVal}>
                    {getStudentDisplayName(selectedStudent)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Father's Name</Text>
                  <Text style={styles.detailVal}>
                    {selectedStudent?.fatherName || 'N/A'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>CNIC / B-Form</Text>
                  <Text style={styles.detailVal}>{getStudentCnic(selectedStudent) || 'N/A'}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Darja / Program</Text>
                  <Text style={[styles.detailVal, { color: '#0F4433', fontWeight: '700' }]}>
                    {getStudentProgram(selectedStudent) || 'N/A'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Approval Status</Text>
                  <View style={[styles.statusBadge, (selectedStudent?.status?.toLowerCase() === 'approved' || selectedStudent?.status?.toLowerCase() === 'enrolled') ? styles.statusBadgeApproved : styles.statusBadgePending]}>
                    <Text style={[styles.statusBadgeText, (selectedStudent?.status?.toLowerCase() === 'approved' || selectedStudent?.status?.toLowerCase() === 'enrolled') ? styles.statusTextApproved : styles.statusTextPending]}>
                      {selectedStudent?.status?.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.detailSectionHeading, { marginTop: 16 }]}>
                  CONTACT & RESIDENCE
                </Text>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Guardian Mobile</Text>
                  <TouchableOpacity
                    onPress={() => selectedStudent && handleCallGuardian(selectedStudent.guardianMobile)}
                  >
                    <Text style={[styles.detailVal, { color: '#059669', textDecorationLine: 'underline' }]}>
                      📞 {selectedStudent?.guardianMobile}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Guardian Email</Text>
                  <Text style={styles.detailVal}>
                    {selectedStudent?.guardianEmail || 'N/A'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>City</Text>
                  <Text style={styles.detailVal}>{selectedStudent?.city || 'N/A'}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Permanent Address</Text>
                  <Text style={[styles.detailVal, { flex: 1, textAlign: 'right' }]}>
                    {selectedStudent?.address || 'N/A'}
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* Attendance Report Quick Buttons */}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <TouchableOpacity
                style={[styles.modalActionBtn, { flex: 1, marginTop: 0, backgroundColor: '#059669' }]}
                activeOpacity={0.85}
                onPress={() => {
                  const st = selectedStudent;
                  setDetailModalVisible(false);
                  if (st) {
                    const stId = st._id || st.id || getStudentCnic(st);
                    const stName = getStudentDisplayName(st);
                    navigation.navigate('AttendanceScreen', {
                      initialTab: 'monthly',
                      filterDarja: getStudentProgram(st) || 'All',
                      studentId: stId,
                      studentName: stName,
                      role: 'superadmin',
                      readOnly: false,
                    });
                  }
                }}
              >
                <Text style={styles.modalActionBtnText}>📊 Monthly Report</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalActionBtn, { flex: 1, marginTop: 0, backgroundColor: '#1E40AF' }]}
                activeOpacity={0.85}
                onPress={() => {
                  const st = selectedStudent;
                  setDetailModalVisible(false);
                  if (st) {
                    const stId = st._id || st.id || getStudentCnic(st);
                    const stName = getStudentDisplayName(st);
                    navigation.navigate('AttendanceScreen', {
                      initialTab: 'yearly',
                      filterDarja: getStudentProgram(st) || 'All',
                      studentId: stId,
                      studentName: stName,
                      role: 'superadmin',
                      readOnly: false,
                    });
                  }
                }}
              >
                <Text style={styles.modalActionBtnText}>📆 Yearly Report</Text>
              </TouchableOpacity>
            </View>

            {/* Modal Bottom Action Button */}
            <TouchableOpacity
              style={[styles.modalActionBtn, { marginTop: 8 }]}
              activeOpacity={0.85}
              onPress={() => setDetailModalVisible(false)}
            >
              <Text style={styles.modalActionBtnText}>Close Record</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 3-DOTS ACTION SHEET MODAL (Edit / Delete) */}
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
                {getStudentDisplayName(menuStudent)}
              </Text>
              <Text style={styles.actionSheetSub}>
                Roll No: {menuStudent?.rollNo || 'N/A'} • {getStudentProgram(menuStudent) || 'General Madaris'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.actionSheetBtn}
              activeOpacity={0.7}
              onPress={() => {
                if (menuStudent) handleOpenEdit(menuStudent);
              }}
            >
              <Text style={styles.actionSheetBtnIcon}>✏️</Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.actionSheetBtnText}>Edit Student (ترمیم کریں)</Text>
                <Text style={styles.actionSheetBtnDesc}>Modify personal, admission, or contact details</Text>
              </View>
              <Text style={styles.actionSheetArrow}>›</Text>
            </TouchableOpacity>

            {apiService.getSessionRole() !== 'teacher' && (
              <TouchableOpacity
                style={[styles.actionSheetBtn, styles.actionSheetBtnDanger]}
                activeOpacity={0.7}
                onPress={() => {
                  if (menuStudent) handleDeleteStudent(menuStudent);
                }}
              >
                <Text style={styles.actionSheetBtnIcon}>🗑️</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.actionSheetBtnText, { color: '#DC2626' }]}>
                    Delete Student (حذف کریں)
                  </Text>
                  <Text style={styles.actionSheetBtnDesc}>Permanently remove student record from MMS</Text>
                </View>
                <Text style={[styles.actionSheetArrow, { color: '#DC2626' }]}>›</Text>
              </TouchableOpacity>
            )}

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

      {/* EDIT STUDENT MODAL */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%', paddingBottom: Math.max(insets.bottom + 12, 20) }]}>
            {/* Edit Header */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalStudentName}>Edit Student Record</Text>
                <Text style={styles.modalStudentRole}>طالب علم کی معلومات تبدیل کریں</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ maxHeight: 460 }}
              contentContainerStyle={{ paddingVertical: 10 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.formSectionLabel}>PERSONAL INFO</Text>

              <Text style={styles.fieldLabel}>First Name *</Text>
              <TextInput
                style={styles.formInput}
                value={editFirstName}
                onChangeText={setEditFirstName}
                placeholder="e.g. Muhammad"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.fieldLabel}>Last Name</Text>
              <TextInput
                style={styles.formInput}
                value={editLastName}
                onChangeText={setEditLastName}
                placeholder="e.g. Huzaifa"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.fieldLabel}>Father Name *</Text>
              <TextInput
                style={styles.formInput}
                value={editFatherName}
                onChangeText={setEditFatherName}
                placeholder="e.g. Abdul Rehman"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.fieldLabel}>Roll Number</Text>
              <TextInput
                style={styles.formInput}
                value={editRollNo}
                onChangeText={setEditRollNo}
                placeholder="e.g. MMS-101"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.fieldLabel}>CNIC / B-Form</Text>
              <TextInput
                style={styles.formInput}
                value={editCnic}
                onChangeText={setEditCnic}
                placeholder="e.g. 42101-1234567-1"
                placeholderTextColor="#94A3B8"
              />

              <Text style={[styles.formSectionLabel, { marginTop: 14 }]}>ACADEMIC & STATUS</Text>

              <Text style={styles.fieldLabel}>Darja / Program</Text>
              <TextInput
                style={styles.formInput}
                value={editEnrollmentProgram}
                onChangeText={setEditEnrollmentProgram}
                placeholder="e.g. Hifz-ul-Quran"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.fieldLabel}>Status</Text>
              <View style={styles.editStatusRow}>
                {['approved', 'pending', 'Enrolled'].map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[
                      styles.editStatusChip,
                      editStatus.toLowerCase() === st.toLowerCase() && styles.editStatusChipActive,
                    ]}
                    onPress={() => setEditStatus(st)}
                  >
                    <Text
                      style={[
                        styles.editStatusChipText,
                        editStatus.toLowerCase() === st.toLowerCase() && styles.editStatusChipTextActive,
                      ]}
                    >
                      {st}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.formSectionLabel, { marginTop: 14 }]}>CONTACT & ADDRESS</Text>

              <Text style={styles.fieldLabel}>Guardian Mobile</Text>
              <TextInput
                style={styles.formInput}
                value={editGuardianMobile}
                onChangeText={setEditGuardianMobile}
                keyboardType="phone-pad"
                placeholder="e.g. 03001234567"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.fieldLabel}>Guardian Email</Text>
              <TextInput
                style={styles.formInput}
                value={editGuardianEmail}
                onChangeText={setEditGuardianEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="e.g. parent@example.com"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.fieldLabel}>City</Text>
              <TextInput
                style={styles.formInput}
                value={editCity}
                onChangeText={setEditCity}
                placeholder="e.g. Karachi"
                placeholderTextColor="#94A3B8"
              />
            </ScrollView>

            {/* Save Buttons */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <TouchableOpacity
                style={[styles.modalActionBtn, { flex: 1, marginTop: 0, backgroundColor: '#E2E8F0' }]}
                activeOpacity={0.8}
                onPress={() => setEditModalVisible(false)}
                disabled={actionLoading}
              >
                <Text style={[styles.modalActionBtnText, { color: '#475569' }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalActionBtn, { flex: 2, marginTop: 0, backgroundColor: '#0F4433' }]}
                activeOpacity={0.85}
                onPress={handleSaveEdit}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalActionBtnText}>💾 Save Changes</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 14 : 6,
    paddingBottom: 14,
    backgroundColor: '#0F4433',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  headerBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBackText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerMainTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: '#86EFAC',
    marginTop: 1,
    fontWeight: '600',
  },
  headerAddBtn: {
    backgroundColor: '#059669',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  headerAddBtnText: {
    fontSize: 12.5,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#0F172A',
    paddingVertical: 0,
  },
  clearSearchText: {
    fontSize: 14,
    color: '#94A3B8',
    padding: 4,
    fontWeight: '700',
  },
  filterSection: {
    marginTop: 6,
  },
  filterSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  filterSectionTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  resetFilterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  chipsScroll: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  darjaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  darjaChipActive: {
    backgroundColor: '#0F4433',
    borderColor: '#D4AF37',
  },
  darjaChipIcon: {
    fontSize: 16,
  },
  darjaChipTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  darjaChipTitleActive: {
    color: '#FFFFFF',
  },
  darjaChipUrdu: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  darjaChipUrduActive: {
    color: '#86EFAC',
    fontWeight: '600',
  },
  statusSegmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 3,
  },
  statusSegmentBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusSegmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  statusSegmentText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  statusSegmentTextActive: {
    color: '#0F4433',
    fontWeight: '800',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 95,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
    shadowColor: '#0F4433',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarApproved: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
  },
  avatarPending: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#FCD34D',
  },
  avatarInitials: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F4433',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  studentName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginRight: 8,
  },
  fatherName: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusBadgeApproved: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgePending: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusTextApproved: {
    color: '#15803D',
  },
  statusTextPending: {
    color: '#B45309',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  darjaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    flexShrink: 1,
  },
  darjaBadgeIcon: {
    fontSize: 11,
    marginRight: 4,
  },
  darjaBadgeText: {
    fontSize: 11,
    color: '#0F4433',
    fontWeight: '700',
  },
  cnicBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  cnicBadgeText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  locationText: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  callBtnIcon: {
    fontSize: 11,
    marginRight: 4,
  },
  callBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 42,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  emptyAddBtn: {
    marginTop: 16,
    backgroundColor: '#0F4433',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  emptyAddBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  fabBtn: {
    position: 'absolute',
    bottom: 22,
    right: 18,
    backgroundColor: '#0F4433',
    borderRadius: 28,
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowColor: '#0F4433',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
  },
  fabInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fabIcon: {
    fontSize: 15,
    marginRight: 6,
  },
  fabText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '82%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 14,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0F4433',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAvatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalStudentName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalStudentRole: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  detailSection: {
    paddingVertical: 4,
  },
  detailSectionHeading: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  detailLabel: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '500',
  },
  detailVal: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700',
  },
  modalActionBtn: {
    backgroundColor: '#0F4433',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  modalActionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
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
  formSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.6,
    marginBottom: 6,
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
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: '#0F172A',
  },
  editStatusRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  editStatusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  editStatusChipActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#059669',
  },
  editStatusChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  editStatusChipTextActive: {
    color: '#047857',
    fontWeight: '800',
  },
});
