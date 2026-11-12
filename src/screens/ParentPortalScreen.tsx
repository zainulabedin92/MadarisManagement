import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Linking,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, Parent, Student, Teacher, ClassItem } from '../types';
import { apiService } from '../services/api';
import {
  getQuickStudentAttendanceStats,
  getStudentId,
} from './AttendanceScreen';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, any>;
  route?: RouteProp<RootStackParamList, any>;
}

export const ParentPortalScreen: React.FC<Props> = ({ navigation, route }) => {
  const preauthToken = route?.params?.token || null;
  const preauthParent = route?.params?.parent || null;

  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(!!preauthParent);
  const [parent, setParent] = useState<Parent | null>(preauthParent);
  const [token, setToken] = useState<string | null>(preauthToken);

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Portal data
  const [children, setChildren] = useState<Student[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyChildren = useCallback(async (authToken?: string) => {
    setLoadingChildren(true);
    try {
      const res = await apiService.getMyChildren(authToken || token || undefined);
      if (res.success && Array.isArray(res.children)) {
        setChildren(res.children);
      } else {
        setChildren([]);
      }
    } catch {
      setChildren([]);
    } finally {
      setLoadingChildren(false);
      setRefreshing(false);
    }
  }, [token]);

  React.useEffect(() => {
    if (preauthParent && preauthToken) {
      fetchMyChildren(preauthToken);
    }
  }, [preauthParent, preauthToken, fetchMyChildren]);

  const handleLogin = async () => {
    if (!identifier.trim() || !pin.trim()) {
      Alert.alert('Required Fields', 'Please enter your registered Phone/CNIC and 4-digit PIN.');
      return;
    }

    setLoggingIn(true);
    try {
      const res = await apiService.parentLogin(identifier.trim(), pin.trim());
      if (res.success && res.token && (res.parent || res.user)) {
        const loggedParent: Parent = res.parent || {
          _id: res.user?._id || res.user?.id,
          name: res.user?.name || 'Parent',
          phone: res.user?.phone || identifier.trim(),
          cnic: res.user?.cnic || '',
          status: (res.user?.status as Parent['status']) || 'Active',
        };
        setToken(res.token);
        setParent(loggedParent);
        setIsLoggedIn(true);
        fetchMyChildren(res.token);
      } else {
        Alert.alert(
          'Login Failed',
          res.message || 'Invalid credentials. Please ensure your account exists in the users table.'
        );
      }
    } catch (err: any) {
      Alert.alert('Login Error', err?.message || 'Unable to connect to server.');
    } finally {
      setLoggingIn(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyChildren();
  };

  const handleLogout = () => {
    apiService.clearSession();
    setIsLoggedIn(false);
    setParent(null);
    setToken(null);
    setChildren([]);
    navigation.reset({
      index: 0,
      routes: [{ name: 'LoginPinPage' }],
    });
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

  const renderChildCard = ({ item }: { item: Student }) => {
    const classObj = typeof item.classId === 'object' ? (item.classId as ClassItem) : null;
    const teacherObj =
      classObj && typeof classObj.classTeacher === 'object'
        ? (classObj.classTeacher as Teacher)
        : null;

    const studentName = item.fullName || `${item.firstName || ''} ${item.lastName || ''}`.trim();
    const sid = getStudentId(item);
    const attStats = getQuickStudentAttendanceStats(item);

    return (
      <View style={styles.childCard}>
        {/* Child Header */}
        <View style={styles.childHeader}>
          <View style={styles.childAvatar}>
            <Text style={styles.childAvatarText}>🎓</Text>
          </View>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={styles.childNameRow}>
              <Text style={styles.childName} numberOfLines={1}>
                {studentName}
              </Text>
              <View style={styles.enrolledBadge}>
                <Text style={styles.enrolledBadgeText}>
                  Today: {attStats.todayStatus}
                </Text>
              </View>
            </View>

            <Text style={styles.rollNo}>Roll No: {item.rollNo || item.registrationNo || 'N/A'}</Text>
          </View>
        </View>

        {/* Assigned Class Section */}
        <View style={styles.classCardSection}>
          <Text style={styles.sectionSmallHeading}>ASSIGNED DARJA & CLASS</Text>
          <View style={styles.classDetailsRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.classTitle}>{classObj?.name || item.enrollmentProgram || 'Class Assigned'}</Text>
              <Text style={styles.classSub}>
                Section {classObj?.section || 'A'} • Room {classObj?.roomNumber || '101'} • {classObj?.academicYear || '2026-2027'}
              </Text>
            </View>
          </View>
        </View>

        {/* Child Attendance Report Summary Section */}
        <View style={styles.attendanceSummaryBox}>
          <View style={styles.attendanceHeaderRow}>
            <Text style={styles.sectionSmallHeading}>
              STUDENT ATTENDANCE REPORT (حاضری رپورٹ)
            </Text>
            <Text style={styles.attendanceRatePill}>
              Monthly: {attStats.monthlyPct}% • Yearly: {attStats.yearlyPct}%
            </Text>
          </View>

          <View style={styles.attendanceCountsRow}>
            <View style={styles.attCountItem}>
              <Text style={[styles.attCountVal, { color: '#15803D' }]}>
                {attStats.presentDays}
              </Text>
              <Text style={styles.attCountLabel}>Present (حاضر)</Text>
            </View>
            <View style={styles.attCountItem}>
              <Text style={[styles.attCountVal, { color: '#DC2626' }]}>
                {attStats.absentDays}
              </Text>
              <Text style={styles.attCountLabel}>Absent (غیر حاضر)</Text>
            </View>
            <View style={styles.attCountItem}>
              <Text style={[styles.attCountVal, { color: '#B45309' }]}>
                {attStats.leaveDays}
              </Text>
              <Text style={styles.attCountLabel}>Leave (رخصت)</Text>
            </View>
            <View style={styles.attCountItem}>
              <Text style={[styles.attCountVal, { color: '#0369A1' }]}>
                {attStats.totalDays}
              </Text>
              <Text style={styles.attCountLabel}>Total Days</Text>
            </View>
          </View>

          <View style={styles.attendanceBtnsRow}>
            <TouchableOpacity
              style={styles.viewMonthlyReportBtn}
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate('AttendanceScreen', {
                  initialTab: 'monthly',
                  studentId: sid,
                  studentName,
                  role: 'parent',
                  readOnly: true,
                })
              }
            >
              <Text style={styles.viewMonthlyReportBtnText}>
                📊 Monthly Report
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.viewYearlyReportBtn}
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate('AttendanceScreen', {
                  initialTab: 'yearly',
                  studentId: sid,
                  studentName,
                  role: 'parent',
                  readOnly: true,
                })
              }
            >
              <Text style={styles.viewYearlyReportBtnText}>
                📆 Yearly Report
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Class Teacher Contact Box */}
        <View style={styles.teacherContactBox}>
          <View style={{ flex: 1 }}>
            <Text style={styles.teacherContactLabel}>CLASS TEACHER (نگران استاذ)</Text>
            <Text style={styles.teacherContactName}>
              {teacherObj?.name || 'Ustad Sahib'}
            </Text>
            <Text style={styles.teacherContactRole}>{teacherObj?.role || 'Class Teacher'}</Text>
          </View>

          <View style={styles.teacherActionBtns}>
            <TouchableOpacity
              style={styles.teacherCallBtn}
              onPress={() => handleCallTeacher(teacherObj?.phone || '03001234567')}
              activeOpacity={0.7}
            >
              <Text style={styles.teacherBtnText}>📞 Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.teacherWABtn}
              onPress={() => handleWhatsAppTeacher(teacherObj?.phone || '03001234567')}
              activeOpacity={0.7}
            >
              <Text style={styles.teacherBtnText}>💬 WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
            <Text style={styles.headerTitle}>والدین پورٹل (Parent Portal)</Text>
            <Text style={styles.headerSubtitle}>Children Progress & Teacher Connect</Text>
          </View>
        </View>

        {isLoggedIn ? (
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>Log Out</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {!isLoggedIn ? (
        /* Login Screen for Parents */
        <ScrollView style={styles.loginContent} contentContainerStyle={styles.loginContainer}>
          <View style={styles.loginBanner}>
            <Text style={styles.loginBannerIcon}>👨‍👩‍👦</Text>
            <Text style={styles.loginBannerTitle}>Welcome to MMS Parent Portal</Text>
            <Text style={styles.loginBannerSubtitle}>
              Stay connected with your children's madrasa education, daily attendance, and class teachers.
            </Text>
          </View>

          <View style={styles.loginCard}>
            <Text style={styles.cardHeading}>PARENT SIGN IN (والدین لاگ ان)</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Registered Phone / CNIC</Text>
              <TextInput
                style={styles.input}
                placeholder="03001234567 or 42101-1234567-1"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                value={identifier}
                onChangeText={setIdentifier}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>4-Digit PIN (۴ ہندسی پن)</Text>
              <TextInput
                style={styles.input}
                placeholder="••••"
                placeholderTextColor="#94a3b8"
                secureTextEntry
                keyboardType="numeric"
                maxLength={4}
                value={pin}
                onChangeText={setPin}
              />
              <Text style={styles.hint}>Default 4-digit PIN was provided upon student admission</Text>
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, loggingIn && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loggingIn}
              activeOpacity={0.85}
            >
              {loggingIn ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.loginBtnText}>Sign In to Parent Portal ➔</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        /* Authenticated Parent Portal Dashboard */
        <View style={styles.portalDashboard}>
          {/* Parent Info Strip */}
          <View style={styles.parentProfileCard}>
            <View style={styles.parentProfileLeft}>
              <Text style={styles.parentWelcomeText}>Welcome,</Text>
              <Text style={styles.parentNameText}>{parent?.name || 'Parent'}</Text>
              <Text style={styles.parentContactText}>
                📱 {parent?.phone} • 🪪 {parent?.cnic}
              </Text>
            </View>
            <View style={styles.childrenCountBadge}>
              <Text style={styles.childrenCountNum}>{children.length}</Text>
              <Text style={styles.childrenCountLabel}>Children</Text>
            </View>
          </View>

          {/* Enrolled Children List */}
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderTitle}>MY ENROLLED CHILDREN (زیرِ تعلیم بچے)</Text>
            <TouchableOpacity onPress={() => fetchMyChildren()}>
              <Text style={styles.refreshBtnText}>🔄 Refresh</Text>
            </TouchableOpacity>
          </View>

          {loadingChildren ? (
            <View style={styles.loaderBox}>
              <ActivityIndicator size="large" color="#059669" />
              <Text style={styles.loaderBoxText}>Loading Enrolled Children Records...</Text>
            </View>
          ) : (
            <FlatList
              data={children}
              keyExtractor={(item, index) => item._id || item.id || `child-${index}`}
              renderItem={renderChildCard}
              contentContainerStyle={styles.childrenListContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#059669']}
                  tintColor="#059669"
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyChildrenBox}>
                  <Text style={styles.emptyChildrenIcon}>📖</Text>
                  <Text style={styles.emptyChildrenTitle}>No Children Enrolled</Text>
                  <Text style={styles.emptyChildrenDesc}>
                    No student record found linked to your CNIC ({parent?.cnic}).
                  </Text>
                </View>
              }
            />
          )}
        </View>
      )}
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
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutBtnText: {
    color: '#fee2e2',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loginContent: {
    flex: 1,
  },
  loginContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loginBanner: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  loginBannerIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  loginBannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
  },
  loginBannerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  loginCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  cardHeading: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#047857',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  demoFillBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  demoFillIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  demoFillTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#92400e',
  },
  demoFillSub: {
    fontSize: 11,
    color: '#b45309',
    marginTop: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    color: '#0f172a',
  },
  hint: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
  },
  loginBtn: {
    backgroundColor: '#059669',
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    elevation: 2,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  portalDashboard: {
    flex: 1,
  },
  parentProfileCard: {
    backgroundColor: '#064e3b',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  parentProfileLeft: {
    flex: 1,
  },
  parentWelcomeText: {
    fontSize: 12,
    color: '#a7f3d0',
  },
  parentNameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 2,
  },
  parentContactText: {
    fontSize: 12,
    color: '#e2e8f0',
    marginTop: 4,
  },
  childrenCountBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  childrenCountNum: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  childrenCountLabel: {
    color: '#a7f3d0',
    fontSize: 10,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  listHeaderTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
    letterSpacing: 0.5,
  },
  refreshBtnText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: 'bold',
  },
  childrenListContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 32,
  },
  childCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  childHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  childAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  childAvatarText: {
    fontSize: 24,
  },
  childNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  childName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    flex: 1,
  },
  enrolledBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  enrolledBadgeText: {
    color: '#065f46',
    fontSize: 10,
    fontWeight: 'bold',
  },
  rollNo: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  classCardSection: {
    marginTop: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionSmallHeading: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  classDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  classTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  classSub: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  attendanceSummaryBox: {
    marginTop: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  attendanceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attendanceRatePill: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#065F46',
  },
  attendanceCountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  attCountItem: {
    flex: 1,
    alignItems: 'center',
  },
  attCountVal: {
    fontSize: 15,
    fontWeight: '800',
  },
  attCountLabel: {
    fontSize: 9.5,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  attendanceBtnsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  viewMonthlyReportBtn: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewMonthlyReportBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  viewYearlyReportBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewYearlyReportBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  teacherContactBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teacherContactLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: 'bold',
  },
  teacherContactName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 2,
  },
  teacherContactRole: {
    fontSize: 11,
    color: '#059669',
  },
  teacherActionBtns: {
    flexDirection: 'row',
    gap: 6,
  },
  teacherCallBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  teacherWABtn: {
    backgroundColor: '#25D366',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  teacherBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  loaderBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderBoxText: {
    marginTop: 10,
    color: '#64748b',
    fontSize: 13,
  },
  emptyChildrenBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyChildrenIcon: {
    fontSize: 48,
  },
  emptyChildrenTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 12,
  },
  emptyChildrenDesc: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 32,
  },
});
