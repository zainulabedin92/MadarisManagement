import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, Teacher, ClassItem, Student } from '../types';
import { apiService } from '../services/api';
import {
  DEMO_ATTENDANCE_STUDENTS,
  getQuickStudentAttendanceStats,
  getStudentFullName,
  getStudentDarja,
  getStudentId,
} from './AttendanceScreen';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'TeacherPortalScreen'>;
  route?: RouteProp<RootStackParamList, 'TeacherPortalScreen'>;
}

const DEMO_TEACHERS: Teacher[] = [
  {
    _id: 'seed-t1',
    name: 'Qari Tariq Jameel Sahib',
    phone: '03001234567',
    email: 'qari.tariq@mms.edu',
    cnic: '42101-1122334-1',
    role: 'Hifz Teacher',
    status: 'Active',
  },
  {
    _id: 'seed-t2',
    name: 'Maulana Bilal Ahmad',
    phone: '03219876543',
    email: 'bilal.ahmad@mms.edu',
    cnic: '35201-5566778-3',
    role: 'Darse Nizami Teacher',
    status: 'Active',
  },
  {
    _id: 'seed-t4',
    name: 'Qari Saeed-ur-Rehman',
    phone: '03456677889',
    email: 'saeed.rehman@mms.edu',
    cnic: '37405-3344556-7',
    role: 'Tajweed Teacher',
    status: 'Active',
  },
  {
    _id: 'seed-t5',
    name: 'Maulana Zubair Usmani',
    phone: '03125556677',
    email: 'zubair.usmani@mms.edu',
    cnic: '42201-9988776-9',
    role: 'Nazra Teacher',
    status: 'Active',
  },
];

const DEMO_CLASSES: (ClassItem & { darjaFilter: string })[] = [
  {
    _id: 'seed-c1',
    name: 'Shoba-e-Tahfeez (Hifz) - Batch A',
    section: 'A',
    roomNumber: '101',
    academicYear: '2026-2027',
    status: 'Active',
    darjaFilter: 'Hifz-ul-Quran',
    classTeacher: DEMO_TEACHERS[0],
  },
  {
    _id: 'seed-c2',
    name: 'Shoba-e-Tahfeez (Hifz) - Batch B',
    section: 'B',
    roomNumber: '102',
    academicYear: '2026-2027',
    status: 'Active',
    darjaFilter: 'Hifz-ul-Quran',
    classTeacher: DEMO_TEACHERS[0],
  },
  {
    _id: 'seed-c3',
    name: 'Dars-e-Nizami (Sanwiya Khasa)',
    section: 'A',
    roomNumber: '201',
    academicYear: '2026-2027',
    status: 'Active',
    darjaFilter: 'Dars-e-Nizami',
    classTeacher: DEMO_TEACHERS[1],
  },
  {
    _id: 'seed-c4',
    name: 'Tajweed & Qiraat Academy',
    section: 'A',
    roomNumber: '204',
    academicYear: '2026-2027',
    status: 'Active',
    darjaFilter: 'Tajweed & Qirat',
    classTeacher: DEMO_TEACHERS[2],
  },
  {
    _id: 'seed-c5',
    name: 'Nazra Quran & Ibtidaiyya',
    section: 'C',
    roomNumber: '105',
    academicYear: '2026-2027',
    status: 'Active',
    darjaFilter: 'Nazra Quran',
    classTeacher: DEMO_TEACHERS[3],
  },
];

function inferDarjaFromClassName(className: string): string {
  const lower = className.toLowerCase();
  if (lower.includes('hifz') || lower.includes('tahfeez')) return 'Hifz-ul-Quran';
  if (lower.includes('dars') || lower.includes('sanwiya') || lower.includes('aalim'))
    return 'Dars-e-Nizami';
  if (lower.includes('tajweed') || lower.includes('qiraat')) return 'Tajweed & Qirat';
  if (lower.includes('nazra') || lower.includes('ibtidaiyya')) return 'Nazra Quran';
  return 'All Darjat';
}

export const TeacherPortalScreen: React.FC<Props> = ({ navigation, route }) => {
  const preauthenticatedTeacher = route?.params?.teacher || null;

  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(!!preauthenticatedTeacher);
  const [teacher, setTeacher] = useState<Teacher | null>(preauthenticatedTeacher);

  // Login form state
  const [identifier, setIdentifier] = useState<string>('03001234567');
  const [pin, setPin] = useState<string>('1234');
  const [loggingIn, setLoggingIn] = useState<boolean>(false);

  // Data state
  const [allTeachers, setAllTeachers] = useState<Teacher[]>(DEMO_TEACHERS);
  const [allClasses, setAllClasses] = useState<(ClassItem & { darjaFilter?: string })[]>(
    DEMO_CLASSES
  );
  const [allStudents, setAllStudents] = useState<Student[]>(DEMO_ATTENDANCE_STUDENTS);
  const [selectedClass, setSelectedClass] = useState<
    (ClassItem & { darjaFilter?: string }) | null
  >(null);
  const [refreshTick, setRefreshTick] = useState<number>(0);

  const loadPortalData = useCallback(async () => {
    try {
      const [tRes, cRes, sRes] = await Promise.all([
        apiService.getTeachers().catch(() => null),
        apiService.getClasses().catch(() => null),
        apiService.getAllStudents().catch(() => null),
      ]);

      if (tRes && tRes.success && tRes.teachers && tRes.teachers.length > 0) {
        const phones = new Set(tRes.teachers.map((t) => t.phone));
        const uniqueDemo = DEMO_TEACHERS.filter((d) => !phones.has(d.phone));
        setAllTeachers([...tRes.teachers, ...uniqueDemo]);
      }

      if (cRes && cRes.success && cRes.classes && cRes.classes.length > 0) {
        const mapped = cRes.classes.map((c) => ({
          ...c,
          darjaFilter: inferDarjaFromClassName(c.name),
        }));
        setAllClasses(mapped);
      }

      if (sRes && sRes.success && sRes.students && sRes.students.length > 0) {
        const existingNames = new Set(
          sRes.students.map((s) => getStudentFullName(s).toLowerCase())
        );
        const uniqueDemo = DEMO_ATTENDANCE_STUDENTS.filter(
          (d) => !existingNames.has(getStudentFullName(d).toLowerCase())
        );
        setAllStudents([...sRes.students, ...uniqueDemo]);
      }
    } catch {
      // Fallback to demo data
    }
  }, []);

  useEffect(() => {
    loadPortalData();
  }, [loadPortalData]);

  // Refresh attendance badges when returning from AttendanceScreen
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      setRefreshTick((t) => t + 1);
    });
    return unsub;
  }, [navigation]);

  const handleTeacherLogin = () => {
    if (!identifier.trim() || !pin.trim()) {
      Alert.alert('Required Fields', 'Please enter your registered Phone/CNIC and PIN.');
      return;
    }

    setLoggingIn(true);
    setTimeout(() => {
      const cleanId = identifier.trim().replace(/\D/g, '');
      const textId = identifier.trim().toLowerCase();

      const matched =
        allTeachers.find(
          (t) =>
            t.phone.replace(/\D/g, '') === cleanId ||
            (t.cnic && t.cnic.replace(/\D/g, '') === cleanId) ||
            t.name.toLowerCase().includes(textId)
        ) || DEMO_TEACHERS[0];

      setTeacher(matched);
      setIsLoggedIn(true);
      setLoggingIn(false);
    }, 250);
  };

  const handleSelectDemoTeacher = (demoT: Teacher) => {
    setIdentifier(demoT.phone);
    setPin('1234');
    setTeacher(demoT);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setTeacher(null);
    setSelectedClass(null);
  };

  // Classes assigned to the logged-in teacher
  const assignedClasses = useMemo(() => {
    if (!teacher) return [];
    const teacherMatches = allClasses.filter((c) => {
      const ct = typeof c.classTeacher === 'object' ? c.classTeacher : null;
      if (!ct) return false;
      return (
        ct.phone === teacher.phone ||
        ct.name.toLowerCase() === teacher.name.toLowerCase()
      );
    });
    return teacherMatches.length > 0 ? teacherMatches : allClasses;
  }, [teacher, allClasses]);

  // Students belonging to `selectedClass`
  const classStudents = useMemo(() => {
    if (!selectedClass) return [];
    const darjaKey = (
      selectedClass.darjaFilter || inferDarjaFromClassName(selectedClass.name)
    ).toLowerCase();

    const matched = allStudents.filter((stu) => {
      const stuDarja = getStudentDarja(stu).toLowerCase();
      return (
        stuDarja.includes(darjaKey) ||
        darjaKey.includes(stuDarja) ||
        (darjaKey.includes('hifz') && stuDarja.includes('hifz')) ||
        (darjaKey.includes('dars') && stuDarja.includes('dars')) ||
        (darjaKey.includes('tajweed') && stuDarja.includes('tajweed')) ||
        (darjaKey.includes('nazra') && stuDarja.includes('nazra'))
      );
    });

    return matched.length > 0 ? matched : allStudents;
  }, [selectedClass, allStudents, refreshTick]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" />

      {/* TOP HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              if (selectedClass) {
                setSelectedClass(null);
              } else {
                navigation.goBack();
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {selectedClass
                ? selectedClass.name
                : 'اساتذہ پورٹل (Teacher Portal)'}
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {selectedClass
                ? `Section ${selectedClass.section} • Room ${
                    selectedClass.roomNumber || '101'
                  } • Class Attendance & Reports`
                : 'Class Attendance, Student Monthly & Yearly Reports'}
            </Text>
          </View>
        </View>

        {isLoggedIn && (
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>Log Out</Text>
          </TouchableOpacity>
        )}
      </View>

      {!isLoggedIn ? (
        /* ==========================================
           TEACHER LOGIN VIEW
           ========================================== */
        <ScrollView
          style={styles.loginScroll}
          contentContainerStyle={styles.loginContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.loginBanner}>
            <Text style={styles.loginBannerIcon}>👳‍♂️</Text>
            <Text style={styles.loginBannerTitle}>
              Welcome to MMS Teacher Console
            </Text>
            <Text style={styles.loginBannerSubtitle}>
              Sign in to enter your assigned classes, mark daily student attendance
              (Present, Absent, Leave), and inspect monthly & yearly student reports.
            </Text>
          </View>

          <View style={styles.loginCard}>
            <Text style={styles.cardHeading}>
              TEACHER SIGN IN (استاذ لاگ ان)
            </Text>

            {/* Quick 1-Tap Teacher Demo Accounts */}
            <Text style={styles.demoSelectLabel}>
              ⚡ 1-Tap Demo Teacher Login (Select Ustad):
            </Text>
            <View style={styles.demoTeachersGrid}>
              {DEMO_TEACHERS.map((dt) => (
                <TouchableOpacity
                  key={dt._id}
                  style={styles.demoTeacherBtn}
                  onPress={() => handleSelectDemoTeacher(dt)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.demoTeacherIcon}>👳‍♂️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.demoTeacherName} numberOfLines={1}>
                      {dt.name}
                    </Text>
                    <Text style={styles.demoTeacherRole}>
                      {dt.role} • {dt.phone}
                    </Text>
                  </View>
                  <Text style={styles.demoTeacherArrow}>Login →</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Registered Mobile Phone or CNIC</Text>
              <TextInput
                style={styles.input}
                placeholder="03001234567"
                placeholderTextColor="#94A3B8"
                value={identifier}
                onChangeText={setIdentifier}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>4-Digit Teacher PIN / Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••"
                placeholderTextColor="#94A3B8"
                secureTextEntry
                value={pin}
                onChangeText={setPin}
              />
            </View>

            <TouchableOpacity
              style={styles.loginBtn}
              onPress={handleTeacherLogin}
              disabled={loggingIn}
              activeOpacity={0.85}
            >
              {loggingIn ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginBtnText}>
                  Sign In to Teacher Portal ➔
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : !selectedClass ? (
        /* ==========================================
           TEACHER DASHBOARD: SELECT A CLASS TO ENTER
           ========================================== */
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.dashboardContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Teacher Profile Card */}
          <View style={styles.teacherProfileCard}>
            <View style={styles.teacherAvatarCircle}>
              <Text style={styles.teacherAvatarEmoji}>👳‍♂️</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.teacherWelcome}>Assalamu Alaikum,</Text>
              <Text style={styles.teacherNameTitle}>{teacher?.name}</Text>
              <Text style={styles.teacherRoleBadge}>
                {teacher?.role} • 📱 {teacher?.phone}
              </Text>
            </View>
            <View style={styles.assignedCountBox}>
              <Text style={styles.assignedCountNum}>
                {assignedClasses.length}
              </Text>
              <Text style={styles.assignedCountLabel}>Classes</Text>
            </View>
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              MY ASSIGNED CLASSES (میری تفویض کردہ کلاسز)
            </Text>
            <Text style={styles.sectionHint}>
              Tap a class to mark attendance & check student reports
            </Text>
          </View>

          {assignedClasses.map((cls) => {
            const darjaName =
              cls.darjaFilter || inferDarjaFromClassName(cls.name);
            return (
              <TouchableOpacity
                key={cls._id || cls.name}
                style={styles.classCard}
                activeOpacity={0.85}
                onPress={() => setSelectedClass(cls)}
              >
                <View style={styles.classCardTop}>
                  <View style={styles.classIconBox}>
                    <Text style={styles.classIconEmoji}>🏛️</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.classCardTitle}>{cls.name}</Text>
                    <Text style={styles.classCardMeta}>
                      Section {cls.section} • Room {cls.roomNumber || '101'} •{' '}
                      {darjaName}
                    </Text>
                  </View>
                  <View style={styles.enterClassBadge}>
                    <Text style={styles.enterClassBadgeText}>
                      Enter Class →
                    </Text>
                  </View>
                </View>

                <View style={styles.classQuickBtnsRow}>
                  <TouchableOpacity
                    style={styles.classQuickBtnPrimary}
                    onPress={() =>
                      navigation.navigate('AttendanceScreen', {
                        initialTab: 'mark',
                        filterDarja: darjaName,
                        className: cls.name,
                        teacherName: teacher?.name,
                        role: 'teacher',
                      })
                    }
                  >
                    <Text style={styles.classQuickBtnPrimaryText}>
                      ☑ Mark Attendance
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.classQuickBtnSecondary}
                    onPress={() =>
                      navigation.navigate('AttendanceScreen', {
                        initialTab: 'monthly',
                        filterDarja: darjaName,
                        className: cls.name,
                        teacherName: teacher?.name,
                        role: 'teacher',
                      })
                    }
                  >
                    <Text style={styles.classQuickBtnSecondaryText}>
                      📊 Monthly Report
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.classQuickBtnSecondary}
                    onPress={() =>
                      navigation.navigate('AttendanceScreen', {
                        initialTab: 'yearly',
                        filterDarja: darjaName,
                        className: cls.name,
                        teacherName: teacher?.name,
                        role: 'teacher',
                      })
                    }
                  >
                    <Text style={styles.classQuickBtnSecondaryText}>
                      📆 Yearly Report
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        /* ==========================================
           INSIDE SELECTED CLASS VIEW (کلاس روم اور طلبہ کی حاضری)
           ========================================== */
        <View style={{ flex: 1 }}>
          {/* Class Action Banner */}
          <View style={styles.insideClassBanner}>
            <View style={styles.insideClassTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.insideClassTag}>
                  ACTIVE CLASSROOM • {selectedClass.darjaFilter || inferDarjaFromClassName(selectedClass.name)}
                </Text>
                <Text style={styles.insideClassTitle}>{selectedClass.name}</Text>
                <Text style={styles.insideClassSub}>
                  Class Teacher: {teacher?.name} • {classStudents.length} Enrolled Students
                </Text>
              </View>

              <TouchableOpacity
                style={styles.switchClassBtn}
                onPress={() => setSelectedClass(null)}
              >
                <Text style={styles.switchClassBtnText}>⇄ Switch Class</Text>
              </TouchableOpacity>
            </View>

            {/* 3 Primary Class Attendance Actions */}
            <View style={styles.insideClassActionRow}>
              <TouchableOpacity
                style={styles.primaryMarkBtn}
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate('AttendanceScreen', {
                    initialTab: 'mark',
                    filterDarja:
                      selectedClass.darjaFilter ||
                      inferDarjaFromClassName(selectedClass.name),
                    className: selectedClass.name,
                    teacherName: teacher?.name,
                    role: 'teacher',
                  })
                }
              >
                <Text style={styles.primaryMarkBtnText}>
                  ☑ Mark Today's Haziri
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryReportBtn}
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate('AttendanceScreen', {
                    initialTab: 'monthly',
                    filterDarja:
                      selectedClass.darjaFilter ||
                      inferDarjaFromClassName(selectedClass.name),
                    className: selectedClass.name,
                    teacherName: teacher?.name,
                    role: 'teacher',
                  })
                }
              >
                <Text style={styles.secondaryReportBtnText}>📊 Monthly</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryReportBtn}
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate('AttendanceScreen', {
                    initialTab: 'yearly',
                    filterDarja:
                      selectedClass.darjaFilter ||
                      inferDarjaFromClassName(selectedClass.name),
                    className: selectedClass.name,
                    teacherName: teacher?.name,
                    role: 'teacher',
                  })
                }
              >
                <Text style={styles.secondaryReportBtnText}>📆 Yearly</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Class Students Roster & Individual Student Reports */}
          <View style={styles.rosterHeaderStrip}>
            <Text style={styles.rosterHeaderTitle}>
              CLASS STUDENTS & ATTENDANCE REPORTS ({classStudents.length})
            </Text>
          </View>

          <FlatList
            data={classStudents}
            keyExtractor={(item, idx) => getStudentId(item, idx)}
            contentContainerStyle={styles.rosterListContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => {
              const fullName = getStudentFullName(item);
              const sid = getStudentId(item, index);
              const stats = getQuickStudentAttendanceStats(item);

              return (
                <View style={styles.studentRosterCard}>
                  <View style={styles.studentRosterTop}>
                    <View style={styles.studentAvatar}>
                      <Text style={styles.studentAvatarText}>🎓</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <View style={styles.studentTitleRow}>
                        <Text style={styles.studentNameText}>{fullName}</Text>
                        <View
                          style={[
                            styles.todayStatusBadge,
                            stats.todayStatus === 'Present'
                              ? styles.badgePresent
                              : stats.todayStatus === 'Absent'
                              ? styles.badgeAbsent
                              : styles.badgeLeave,
                          ]}
                        >
                          <Text
                            style={[
                              styles.todayStatusText,
                              stats.todayStatus === 'Present'
                                ? { color: '#15803D' }
                                : stats.todayStatus === 'Absent'
                                ? { color: '#DC2626' }
                                : { color: '#B45309' },
                            ]}
                          >
                            Today: {stats.todayStatus}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.studentSubText}>
                        Roll: {item.rollNo || `MMS-${101 + index}`} • Walid:{' '}
                        {item.fatherName}
                      </Text>
                    </View>
                  </View>

                  {/* Quick Summary Metrics */}
                  <View style={styles.studentStatsStrip}>
                    <View style={styles.studentStatCell}>
                      <Text style={styles.studentStatLabel}>Monthly Rate</Text>
                      <Text style={styles.studentStatVal}>
                        {stats.monthlyPct}%
                      </Text>
                    </View>
                    <View style={styles.studentStatCell}>
                      <Text style={styles.studentStatLabel}>Yearly Rate</Text>
                      <Text style={styles.studentStatVal}>
                        {stats.yearlyPct}%
                      </Text>
                    </View>
                    <View style={styles.studentStatCell}>
                      <Text style={[styles.studentStatLabel, { color: '#15803D' }]}>
                        Present
                      </Text>
                      <Text style={[styles.studentStatVal, { color: '#15803D' }]}>
                        {stats.presentDays}d
                      </Text>
                    </View>
                    <View style={styles.studentStatCell}>
                      <Text style={[styles.studentStatLabel, { color: '#DC2626' }]}>
                        Absent
                      </Text>
                      <Text style={[styles.studentStatVal, { color: '#DC2626' }]}>
                        {stats.absentDays}d
                      </Text>
                    </View>
                    <View style={styles.studentStatCell}>
                      <Text style={[styles.studentStatLabel, { color: '#B45309' }]}>
                        Leave
                      </Text>
                      <Text style={[styles.studentStatVal, { color: '#B45309' }]}>
                        {stats.leaveDays}d
                      </Text>
                    </View>
                  </View>

                  {/* Check Student Monthly & Yearly Report Buttons */}
                  <View style={styles.studentReportBtnsRow}>
                    <TouchableOpacity
                      style={styles.studentReportBtnMonthly}
                      onPress={() =>
                        navigation.navigate('AttendanceScreen', {
                          initialTab: 'monthly',
                          studentId: sid,
                          studentName: fullName,
                          className: selectedClass.name,
                          teacherName: teacher?.name,
                          role: 'teacher',
                        })
                      }
                    >
                      <Text style={styles.studentReportBtnMonthlyText}>
                        📊 Monthly Report
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.studentReportBtnYearly}
                      onPress={() =>
                        navigation.navigate('AttendanceScreen', {
                          initialTab: 'yearly',
                          studentId: sid,
                          studentName: fullName,
                          className: selectedClass.name,
                          teacherName: teacher?.name,
                          role: 'teacher',
                        })
                      }
                    >
                      <Text style={styles.studentReportBtnYearlyText}>
                        📆 Yearly Report
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: '#A7F3D0',
    marginTop: 1,
  },
  logoutBtn: {
    backgroundColor: 'rgba(239,68,68,0.2)',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  logoutBtnText: {
    color: '#FEE2E2',
    fontSize: 11.5,
    fontWeight: '700',
  },
  loginScroll: {
    flex: 1,
  },
  loginContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loginBanner: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loginBannerIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  loginBannerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  loginBannerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 12,
    lineHeight: 18,
  },
  loginCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#047857',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  demoSelectLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 8,
  },
  demoTeachersGrid: {
    gap: 8,
    marginBottom: 18,
  },
  demoTeacherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 10,
    padding: 10,
  },
  demoTeacherIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  demoTeacherName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#92400E',
  },
  demoTeacherRole: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 1,
  },
  demoTeacherArrow: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 14,
    color: '#0F172A',
  },
  loginBtn: {
    backgroundColor: '#059669',
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  dashboardContent: {
    padding: 16,
    paddingBottom: 32,
  },
  teacherProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064E3B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
  },
  teacherAvatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teacherAvatarEmoji: {
    fontSize: 26,
  },
  teacherWelcome: {
    fontSize: 11.5,
    color: '#A7F3D0',
  },
  teacherNameTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 1,
  },
  teacherRoleBadge: {
    fontSize: 12,
    color: '#FDE68A',
    marginTop: 3,
    fontWeight: '600',
  },
  assignedCountBox: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  assignedCountNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  assignedCountLabel: {
    fontSize: 10,
    color: '#A7F3D0',
  },
  sectionHeaderRow: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F4433',
    letterSpacing: 0.5,
  },
  sectionHint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  classCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  classCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  classIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  classIconEmoji: {
    fontSize: 22,
  },
  classCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  classCardMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  enterClassBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginLeft: 8,
  },
  enterClassBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#065F46',
  },
  classQuickBtnsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  classQuickBtnPrimary: {
    flex: 1.3,
    backgroundColor: '#059669',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  classQuickBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  classQuickBtnSecondary: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  classQuickBtnSecondaryText: {
    color: '#1E293B',
    fontSize: 11,
    fontWeight: '700',
  },
  insideClassBanner: {
    backgroundColor: '#0F4433',
    padding: 16,
  },
  insideClassTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  insideClassTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#86EFAC',
    letterSpacing: 0.6,
  },
  insideClassTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  insideClassSub: {
    fontSize: 12,
    color: '#D1FAE5',
    marginTop: 2,
  },
  switchClassBtn: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  switchClassBtnText: {
    color: '#FDE68A',
    fontSize: 11.5,
    fontWeight: '700',
  },
  insideClassActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  primaryMarkBtn: {
    flex: 1.5,
    backgroundColor: '#10B981',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryMarkBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  secondaryReportBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryReportBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  rosterHeaderStrip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ECFDF5',
    borderBottomWidth: 1,
    borderBottomColor: '#D1FAE5',
  },
  rosterHeaderTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.5,
  },
  rosterListContent: {
    padding: 14,
    paddingBottom: 28,
  },
  studentRosterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  studentRosterTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentAvatarText: {
    fontSize: 20,
  },
  studentTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  studentSubText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  todayStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 6,
  },
  badgePresent: {
    backgroundColor: '#DCFCE7',
  },
  badgeAbsent: {
    backgroundColor: '#FEE2E2',
  },
  badgeLeave: {
    backgroundColor: '#FEF3C7',
  },
  todayStatusText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  studentStatsStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  studentStatCell: {
    alignItems: 'center',
    flex: 1,
  },
  studentStatLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  studentStatVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  studentReportBtnsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  studentReportBtnMonthly: {
    flex: 1,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#6EE7B7',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  studentReportBtnMonthlyText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#047857',
  },
  studentReportBtnYearly: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#93C5FD',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  studentReportBtnYearlyText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1D4ED8',
  },
});
