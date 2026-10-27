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

// Fallback demo students in case backend has few records or is offline
const INITIAL_DEMO_STUDENTS: Student[] = [
  {
    _id: 'seed-1',
    firstName: 'Muhammad',
    lastName: 'Huzaifa',
    fatherName: 'Hafiz Muhammad Tariq',
    cnic: '42101-1234567-1',
    guardianMobile: '03001234567',
    guardianEmail: 'tariq.mms@example.com',
    enrollmentProgram: 'Hifz-ul-Quran',
    city: 'Karachi',
    address: 'Sector 5-A, North Nazimabad, Karachi',
    status: 'approved',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    _id: 'seed-2',
    firstName: 'Abdul',
    lastName: 'Rehman',
    fatherName: 'Maulana Shabbir Ahmad',
    cnic: '35201-9876543-3',
    guardianMobile: '03217654321',
    guardianEmail: 'shabbir.ahmad@example.com',
    enrollmentProgram: 'Dars-e-Nizami',
    city: 'Lahore',
    address: 'Darul Uloom Town, Raiwind Road, Lahore',
    status: 'approved',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    _id: 'seed-3',
    firstName: 'Hamza',
    lastName: 'Farooq',
    fatherName: 'Farooq Azam',
    cnic: '61101-5544332-5',
    guardianMobile: '03335554433',
    guardianEmail: 'farooq.azam@example.com',
    enrollmentProgram: 'Nazra Quran',
    city: 'Islamabad',
    address: 'Street 14, G-9/2, Islamabad',
    status: 'approved',
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
  {
    _id: 'seed-4',
    firstName: 'Usman',
    lastName: 'Ghani',
    fatherName: 'Qari Noor Muhammad',
    cnic: '37405-8877665-7',
    guardianMobile: '03456677889',
    guardianEmail: 'noor.qari@example.com',
    enrollmentProgram: 'Tajweed & Qirat',
    city: 'Rawalpindi',
    address: 'Near Jamia Masjid Noor, Saddar, Rawalpindi',
    status: 'approved',
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
  },
  {
    _id: 'seed-5',
    firstName: 'Zubair',
    lastName: 'Ahmad',
    fatherName: 'Muhammad Akram',
    cnic: '38403-1122334-9',
    guardianMobile: '03124455667',
    guardianEmail: 'akram.zubair@example.com',
    enrollmentProgram: 'Aalim Course',
    city: 'Multan',
    address: 'Mohallah Qasim Bela, Multan',
    status: 'pending',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    _id: 'seed-6',
    firstName: 'Talha',
    lastName: 'Bilal',
    fatherName: 'Bilal Hussain',
    cnic: '42201-7788990-1',
    guardianMobile: '03023344556',
    guardianEmail: 'bilal.h@example.com',
    enrollmentProgram: 'Hifz & School Combo',
    city: 'Peshawar',
    address: 'Kohat Road, Peshawar Cantt',
    status: 'approved',
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
  {
    _id: 'seed-7',
    firstName: 'Saad',
    lastName: 'Abdullah',
    fatherName: 'Abdullah Jan',
    cnic: '54400-3344556-3',
    guardianMobile: '03367788990',
    guardianEmail: 'jan.saad@example.com',
    enrollmentProgram: 'Hifz-ul-Quran',
    city: 'Quetta',
    address: 'Brewery Road, Quetta',
    status: 'pending',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    _id: 'seed-8',
    firstName: 'Anas',
    lastName: 'Muneer',
    fatherName: 'Muneer Ahmad',
    cnic: '34101-9988776-5',
    guardianMobile: '03086655443',
    guardianEmail: 'muneer.anas@example.com',
    enrollmentProgram: 'Dars-e-Nizami',
    city: 'Gujranwala',
    address: 'Satellite Town, Gujranwala',
    status: 'approved',
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
];

export const StudentsListScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const initialDarja = route?.params?.filterDarja || 'All Darjat';

  // Filters & Search
  const [selectedDarja, setSelectedDarja] = useState<string>(initialDarja);
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Data & Loading
  const [students, setStudents] = useState<Student[]>(INITIAL_DEMO_STUDENTS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Student Detail Modal
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Fetch Students from backend
  const fetchStudents = useCallback(async () => {
    try {
      const res = await apiService.getAllStudents();
      if (res.success && res.students && res.students.length > 0) {
        // Merge real backend students with demo seeds, removing duplicate CNICs
        const existingCnics = new Set(res.students.map((s) => s.cnic?.trim()));
        const uniqueDemo = INITIAL_DEMO_STUDENTS.filter(
          (s) => !existingCnics.has(s.cnic?.trim())
        );
        setStudents([...res.students, ...uniqueDemo]);
      } else {
        setStudents(INITIAL_DEMO_STUDENTS);
      }
    } catch (err) {
      // Fallback silently to initial demo records
      setStudents(INITIAL_DEMO_STUDENTS);
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
      const prog = student.enrollmentProgram?.toLowerCase() || '';
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
      if (student.status?.toLowerCase() !== statusFilter) {
        return false;
      }
    }

    // 3. Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      const father = (student.fatherName || '').toLowerCase();
      const cnic = (student.cnic || '').toLowerCase();
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
      const prog = (s.enrollmentProgram || '').toLowerCase();
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

  const handleCallGuardian = (mobile?: string) => {
    if (!mobile) return;
    Linking.openURL(`tel:${mobile}`).catch(() => {
      Alert.alert('Call Failed', `Cannot dial ${mobile} on this device.`);
    });
  };

  const renderStudentCard = ({ item }: { item: Student }) => {
    const isApproved = item.status === 'approved';
    const initials = `${item.firstName?.[0] || 'M'}${item.lastName?.[0] || 'T'}`.toUpperCase();

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
                {item.firstName} {item.lastName}
              </Text>
              <View style={[styles.statusBadge, isApproved ? styles.statusBadgeApproved : styles.statusBadgePending]}>
                <Text style={[styles.statusBadgeText, isApproved ? styles.statusTextApproved : styles.statusTextPending]}>
                  {isApproved ? '● Active' : '⏳ Pending'}
                </Text>
              </View>
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
              {item.enrollmentProgram || 'General Madaris'}
            </Text>
          </View>

          <View style={styles.cnicBadge}>
            <Text style={styles.cnicBadgeText}>{item.cnic}</Text>
          </View>
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
          <Text style={styles.headerMainTitle}>طلبہ ڈائریکٹری • Students</Text>
          <Text style={styles.headerSubtitle}>
            {filteredStudents.length} Talaba Registered
          </Text>
        </View>

        {/* Header Add Student Button */}
        <TouchableOpacity
          style={styles.headerAddBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('RegisterPage')}
        >
          <Text style={styles.headerAddBtnText}>+ Add</Text>
        </TouchableOpacity>
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
            Active / Approved ({students.filter((s) => s.status === 'approved').length})
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
              <TouchableOpacity
                style={styles.emptyAddBtn}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('RegisterPage')}
              >
                <Text style={styles.emptyAddBtnText}>+ Add Student in this Darja</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Floating Action Button (FAB) to Add New Student */}
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
                    {selectedStudent?.firstName?.[0] || 'M'}
                  </Text>
                </View>
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.modalStudentName}>
                    {selectedStudent?.firstName} {selectedStudent?.lastName}
                  </Text>
                  <Text style={styles.modalStudentRole}>
                    Talib-e-Ilm • {selectedStudent?.enrollmentProgram}
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
                    {selectedStudent?.firstName} {selectedStudent?.lastName}
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
                  <Text style={styles.detailVal}>{selectedStudent?.cnic}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Darja / Program</Text>
                  <Text style={[styles.detailVal, { color: '#0F4433', fontWeight: '700' }]}>
                    {selectedStudent?.enrollmentProgram}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Approval Status</Text>
                  <View style={[styles.statusBadge, selectedStudent?.status === 'approved' ? styles.statusBadgeApproved : styles.statusBadgePending]}>
                    <Text style={[styles.statusBadgeText, selectedStudent?.status === 'approved' ? styles.statusTextApproved : styles.statusTextPending]}>
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
                    const stId = st._id || st.id || st.cnic;
                    const stName = `${st.firstName || ''} ${st.lastName || ''}`.trim() || 'Student';
                    navigation.navigate('AttendanceScreen', {
                      initialTab: 'monthly',
                      filterDarja: st.enrollmentProgram || 'All',
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
                    const stId = st._id || st.id || st.cnic;
                    const stName = `${st.firstName || ''} ${st.lastName || ''}`.trim() || 'Student';
                    navigation.navigate('AttendanceScreen', {
                      initialTab: 'yearly',
                      filterDarja: st.enrollmentProgram || 'All',
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
});
