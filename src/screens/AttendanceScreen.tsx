import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import {
  RootStackParamList,
  Student,
  AttendanceStatus,
  AttendanceRecord,
  DailyAttendanceSummary,
  StudentMonthlyReport,
  StudentYearlyReport,
  MonthlyBreakdownItem,
} from '../types';
import { apiService } from '../services/api';
import { DARJAT_LIST } from './StudentsListScreen';

type AttendanceScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AttendanceScreen'
>;

type AttendanceScreenRouteProp = RouteProp<
  RootStackParamList,
  'AttendanceScreen'
>;

interface Props {
  navigation: AttendanceScreenNavigationProp;
  route?: AttendanceScreenRouteProp;
}

// Fallback demo students so Attendance works out-of-the-box offline or online
export const DEMO_ATTENDANCE_STUDENTS: Student[] = [
  {
    _id: 'att-stu-1',
    rollNo: 'MMS-101',
    firstName: 'Muhammad',
    lastName: 'Huzaifa',
    fullName: 'Muhammad Huzaifa',
    fatherName: 'Abdul Rehman',
    cnic: '42101-1234567-1',
    guardianMobile: '03001234567',
    enrollmentProgram: 'Hifz-ul-Quran',
    city: 'Karachi',
    status: 'approved',
  },
  {
    _id: 'att-stu-2',
    rollNo: 'MMS-102',
    firstName: 'Abdullah',
    lastName: 'Rehman',
    fullName: 'Abdullah Rehman',
    fatherName: 'Abdul Rehman',
    cnic: '42101-7654321-2',
    guardianMobile: '03001234567',
    enrollmentProgram: 'Hifz-ul-Quran',
    city: 'Karachi',
    status: 'approved',
  },
  {
    _id: 'att-stu-3',
    rollNo: 'MMS-103',
    firstName: 'Hamza',
    lastName: 'Farooq',
    fullName: 'Hamza Farooq',
    fatherName: 'Haji Farooq Azam',
    cnic: '35201-9988776-3',
    guardianMobile: '03214455667',
    enrollmentProgram: 'Dars-e-Nizami',
    city: 'Lahore',
    status: 'approved',
  },
  {
    _id: 'att-stu-4',
    rollNo: 'MMS-104',
    firstName: 'Usman',
    lastName: 'Ghani',
    fullName: 'Usman Ghani',
    fatherName: 'Muhammad Rizwan',
    cnic: '61101-3344556-5',
    guardianMobile: '03335557788',
    enrollmentProgram: 'Tajweed & Qirat',
    city: 'Islamabad',
    status: 'approved',
  },
  {
    _id: 'att-stu-5',
    rollNo: 'MMS-105',
    firstName: 'Zubair',
    lastName: 'Ahmad',
    fullName: 'Zubair Ahmad',
    fatherName: 'Muhammad Akram',
    cnic: '38403-1122334-9',
    guardianMobile: '03124455667',
    enrollmentProgram: 'Aalim Course',
    city: 'Multan',
    status: 'approved',
  },
  {
    _id: 'att-stu-6',
    rollNo: 'MMS-106',
    firstName: 'Talha',
    lastName: 'Bilal',
    fullName: 'Talha Bilal',
    fatherName: 'Bilal Hussain',
    cnic: '42201-7788990-1',
    guardianMobile: '03023344556',
    enrollmentProgram: 'Hifz & School Combo',
    city: 'Peshawar',
    status: 'approved',
  },
  {
    _id: 'att-stu-7',
    rollNo: 'MMS-107',
    firstName: 'Saad',
    lastName: 'Abdullah',
    fullName: 'Saad Abdullah',
    fatherName: 'Abdullah Jan',
    cnic: '54400-3344556-3',
    guardianMobile: '03367788990',
    enrollmentProgram: 'Hifz-ul-Quran',
    city: 'Quetta',
    status: 'approved',
  },
  {
    _id: 'att-stu-8',
    rollNo: 'MMS-108',
    firstName: 'Anas',
    lastName: 'Irfan',
    fullName: 'Anas Irfan',
    fatherName: 'Dr. Irfanullah',
    cnic: '17301-4455667-9',
    guardianMobile: '03459988776',
    enrollmentProgram: 'Nazra Quran',
    city: 'Peshawar',
    status: 'approved',
  },
];

const QUICK_REMARK_PRESETS = [
  'On Time / Regular',
  'Sick Leave (بیماری)',
  'Family Emergency (ضروری کام)',
  'Out of City (سفر)',
  'Approved by Ustad / Nazim',
  'Uninformed Absence',
];

// Format Date to YYYY-MM-DD in local time
export function formatDateKey(dateObj: Date): string {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Format YYYY-MM-DD to readable label
export function formatReadableDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const dateObj = new Date(y, m - 1, d);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${days[dateObj.getDay()]}, ${String(d).padStart(2, '0')} ${months[m - 1]} ${y}`;
}

// Format YYYY-MM to readable Month Year
export function formatMonthLabel(monthStr: string): string {
  const [y, m] = monthStr.split('-').map(Number);
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  if (!y || !m) return monthStr;
  return `${months[m - 1]} ${y}`;
}

export function formatShortMonthLabel(monthStr: string): string {
  const [y, m] = monthStr.split('-').map(Number);
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  if (!y || !m) return monthStr;
  return `${months[m - 1]} ${y}`;
}

export function getStudentId(s: Student, idx = 0): string {
  return s._id || s.id || s.cnic || s.bFormNo || `stu-${idx}`;
}

export function getStudentFullName(s: Student): string {
  if (s.fullName && s.fullName.trim()) return s.fullName.trim();
  return `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Talib-e-Ilm';
}

export function getStudentDarja(s: Student): string {
  if (s.enrollmentProgram && s.enrollmentProgram.trim()) {
    return s.enrollmentProgram.trim();
  }
  if (s.classId && typeof s.classId === 'object' && s.classId.name) {
    return s.classId.name;
  }
  return 'Hifz-ul-Quran';
}

// Persistent in-memory store across screen navigations
// Map of date (YYYY-MM-DD) -> Map of studentId -> AttendanceRecord
export const ATTENDANCE_STORE: Record<string, Record<string, AttendanceRecord>> = {};
let IS_STORE_SEEDED = false;

export function ensureSeededStore(studentList: Student[]) {
  const combined = [...studentList];
  const existingNames = new Set(combined.map((s) => getStudentFullName(s).toLowerCase()));
  DEMO_ATTENDANCE_STUDENTS.forEach((d) => {
    if (!existingNames.has(getStudentFullName(d).toLowerCase())) {
      combined.push(d);
    }
  });

  const today = new Date();

  // Seed dates across the current year (last 180 days, sampling working days) so both Monthly and Yearly reports have rich data
  const daysToSeed = IS_STORE_SEEDED ? 15 : 150;

  for (let offset = 0; offset <= daysToSeed; offset++) {
    // Seed every day for the past 35 days, and 8 representative working days per month for earlier months in the year
    if (offset > 35 && offset % 3 !== 0) continue;

    const dt = new Date(today);
    dt.setDate(today.getDate() - offset);
    // Skip Fridays (Jumu'ah holiday in Madaris) except today
    if (offset > 0 && dt.getDay() === 5) continue;

    const dateKey = formatDateKey(dt);
    if (!ATTENDANCE_STORE[dateKey]) {
      ATTENDANCE_STORE[dateKey] = {};
    }

    combined.forEach((stu, idx) => {
      const sid = getStudentId(stu, idx);
      if (ATTENDANCE_STORE[dateKey][sid]) return;

      const hash = (offset * 13 + idx * 7) % 20;
      let status: AttendanceStatus = 'Present';
      let remarks = '';

      if (hash === 1 || hash === 14) {
        status = 'Absent';
        remarks = hash === 1 ? 'Uninformed Absence' : 'Sick / Fever';
      } else if (hash === 5 || hash === 11) {
        status = 'Leave';
        remarks = hash === 5 ? 'Sick Leave (بیماری)' : 'Family Emergency (ضروری کام)';
      }

      ATTENDANCE_STORE[dateKey][sid] = {
        id: `${dateKey}-${sid}`,
        studentId: sid,
        studentName: getStudentFullName(stu),
        fatherName: stu.fatherName,
        rollNo: stu.rollNo || `MMS-${101 + idx}`,
        darja: getStudentDarja(stu),
        guardianMobile: stu.guardianMobile,
        date: dateKey,
        status,
        remarks,
        markedBy: 'Class Teacher (Ustad)',
        updatedAt: dt.toISOString(),
      };
    });
  }

  IS_STORE_SEEDED = true;
}

/**
 * Helper used by ParentPortalScreen and TeacherPortalScreen to quickly get a student's live attendance stats
 */
export function getQuickStudentAttendanceStats(student: Student): {
  todayStatus: AttendanceStatus;
  monthlyPct: number;
  yearlyPct: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  totalDays: number;
} {
  ensureSeededStore([student]);
  const todayKey = formatDateKey(new Date());
  const currentMonth = todayKey.slice(0, 7);
  const currentYear = todayKey.slice(0, 4);
  const targetName = getStudentFullName(student).toLowerCase();
  const targetId = getStudentId(student);

  let todayStatus: AttendanceStatus = 'Present';
  let monthPresent = 0;
  let monthTotal = 0;
  let yearPresent = 0;
  let yearAbsent = 0;
  let yearLeave = 0;

  Object.keys(ATTENDANCE_STORE).forEach((dateKey) => {
    const dayMap = ATTENDANCE_STORE[dateKey] || {};
    const rec =
      dayMap[targetId] ||
      Object.values(dayMap).find((r) => r.studentName.toLowerCase() === targetName);
    if (!rec) return;

    if (dateKey === todayKey) {
      todayStatus = rec.status;
    }
    if (dateKey.startsWith(currentMonth)) {
      monthTotal++;
      if (rec.status === 'Present') monthPresent++;
    }
    if (dateKey.startsWith(currentYear)) {
      if (rec.status === 'Present') yearPresent++;
      else if (rec.status === 'Absent') yearAbsent++;
      else if (rec.status === 'Leave') yearLeave++;
    }
  });

  const yearTotal = yearPresent + yearAbsent + yearLeave;
  return {
    todayStatus,
    monthlyPct: monthTotal > 0 ? Math.round((monthPresent / monthTotal) * 100) : 92,
    yearlyPct: yearTotal > 0 ? Math.round((yearPresent / yearTotal) * 100) : 91,
    presentDays: yearPresent,
    absentDays: yearAbsent,
    leaveDays: yearLeave,
    totalDays: yearTotal,
  };
}

export const AttendanceScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const role = route?.params?.role || 'superadmin';
  const isReadOnly = route?.params?.readOnly === true || role === 'parent';
  const initialDarja = route?.params?.filterDarja || 'All Darjat';
  const classContextName = route?.params?.className;
  const teacherContextName = route?.params?.teacherName;
  const lockedStudentName = route?.params?.studentName;
  const lockedStudentId = route?.params?.studentId;

  const defaultTab = isReadOnly
    ? route?.params?.initialTab === 'yearly' || route?.params?.initialTab === 'history'
      ? route.params.initialTab
      : 'monthly'
    : route?.params?.initialTab || 'mark';

  // Active Top Tab: 'mark' | 'history' | 'monthly' | 'yearly'
  const [activeTab, setActiveTab] = useState<'mark' | 'history' | 'monthly' | 'yearly'>(
    defaultTab
  );

  // Students list
  const [students, setStudents] = useState<Student[]>(DEMO_ATTENDANCE_STUDENTS);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Shared Filters
  const [selectedDarja, setSelectedDarja] = useState<string>(initialDarja);
  const [searchQuery, setSearchQuery] = useState<string>(lockedStudentName || '');
  const [studentFocusFilter, setStudentFocusFilter] = useState<string | null>(
    lockedStudentName || null
  );

  // Tab 1 (Mark Attendance) state
  const todayKey = useMemo(() => formatDateKey(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);
  const [dailyDraft, setDailyDraft] = useState<
    Record<string, { status: AttendanceStatus; remarks: string }>
  >({});

  // Remark Editor Modal state
  const [remarkModalStudent, setRemarkModalStudent] = useState<Student | null>(null);
  const [tempRemark, setTempRemark] = useState<string>('');

  // Tab 2 (History) state
  const [historyViewMode, setHistoryViewMode] = useState<'sessions' | 'records'>(
    lockedStudentName ? 'records' : 'sessions'
  );
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'All' | AttendanceStatus>('All');

  // Tab 3 (Monthly Report) & Tab 4 (Yearly Report) state
  const currentMonthKey = useMemo(() => todayKey.slice(0, 7), [todayKey]);
  const currentYearKey = useMemo(() => todayKey.slice(0, 4), [todayKey]);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);
  const [selectedYear, setSelectedYear] = useState<string>(currentYearKey);

  // Student Detail Modal (supports toggling between Monthly & Yearly inside modal!)
  const [detailModalStudentId, setDetailModalStudentId] = useState<string | null>(null);
  const [detailModalMode, setDetailModalMode] = useState<'monthly' | 'yearly'>('monthly');

  // Store version counter to trigger re-computation after saves
  const [storeVersion, setStoreVersion] = useState<number>(0);

  // Load students & seed attendance store
  const loadStudentsAndAttendance = useCallback(async () => {
    setLoading(true);
    let mergedStudents = [...DEMO_ATTENDANCE_STUDENTS];
    try {
      const res = await apiService.getAllStudents();
      if (res.success && res.students && res.students.length > 0) {
        const existingNames = new Set(
          res.students.map((s) => getStudentFullName(s).toLowerCase())
        );
        const uniqueDemo = DEMO_ATTENDANCE_STUDENTS.filter(
          (d) => !existingNames.has(getStudentFullName(d).toLowerCase())
        );
        mergedStudents = [...res.students, ...uniqueDemo];
      }
    } catch {
      // Offline fallback to DEMO_ATTENDANCE_STUDENTS
    }

    ensureSeededStore(mergedStudents);
    setStudents(mergedStudents);
    setLoading(false);
    setStoreVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    loadStudentsAndAttendance();
  }, [loadStudentsAndAttendance]);

  // Synchronize `dailyDraft` whenever `selectedDate` or `students` changes
  useEffect(() => {
    const existingForDate = ATTENDANCE_STORE[selectedDate] || {};
    const nextDraft: Record<string, { status: AttendanceStatus; remarks: string }> = {};

    students.forEach((stu, idx) => {
      const sid = getStudentId(stu, idx);
      const saved =
        existingForDate[sid] ||
        Object.values(existingForDate).find(
          (r) => r.studentName.toLowerCase() === getStudentFullName(stu).toLowerCase()
        );
      nextDraft[sid] = {
        status: saved ? saved.status : 'Present',
        remarks: saved?.remarks || '',
      };
    });

    setDailyDraft(nextDraft);
  }, [selectedDate, students, storeVersion]);

  // Helper to match Darja filter
  const matchesDarjaFilter = useCallback(
    (darjaValue: string) => {
      if (selectedDarja === 'All Darjat' || selectedDarja === 'all') return true;
      const prog = (darjaValue || '').toLowerCase();
      const filterKey = selectedDarja.toLowerCase();
      return (
        prog.includes(filterKey) ||
        filterKey.includes(prog) ||
        (filterKey.includes('hifz') && prog.includes('hifz')) ||
        (filterKey.includes('tahfeez') && prog.includes('hifz')) ||
        (filterKey.includes('dars') && prog.includes('dars')) ||
        (filterKey.includes('nazra') && prog.includes('nazra')) ||
        (filterKey.includes('tajweed') && prog.includes('tajweed')) ||
        (filterKey.includes('aalim') && prog.includes('aalim')) ||
        (filterKey.includes('combo') && prog.includes('combo'))
      );
    },
    [selectedDarja]
  );

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((stu, idx) => {
      const sid = getStudentId(stu, idx);
      const fullName = getStudentFullName(stu);

      if (studentFocusFilter) {
        const matchFocus =
          fullName.toLowerCase() === studentFocusFilter.toLowerCase() ||
          (lockedStudentId && sid === lockedStudentId);
        if (!matchFocus) return false;
      }

      const darja = getStudentDarja(stu);
      if (!matchesDarjaFilter(darja)) return false;

      if (searchQuery.trim() && !studentFocusFilter) {
        const q = searchQuery.trim().toLowerCase();
        const name = fullName.toLowerCase();
        const father = (stu.fatherName || '').toLowerCase();
        const roll = (stu.rollNo || '').toLowerCase();
        const cnic = (stu.cnic || '').toLowerCase();
        if (!name.includes(q) && !father.includes(q) && !roll.includes(q) && !cnic.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [students, matchesDarjaFilter, searchQuery, studentFocusFilter, lockedStudentId]);

  // Step date backward or forward
  const handleShiftDate = (daysDelta: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + daysDelta);
    const nextKey = formatDateKey(dt);
    if (nextKey > todayKey) {
      Alert.alert('Future Date', 'Cannot mark attendance for a future date.');
      return;
    }
    setSelectedDate(nextKey);
  };

  // Update a single student's status in dailyDraft
  const handleSetStatus = (studentId: string, status: AttendanceStatus) => {
    setDailyDraft((prev) => ({
      ...prev,
      [studentId]: {
        status,
        remarks: prev[studentId]?.remarks || '',
      },
    }));
  };

  // Bulk mark all filtered students
  const handleBulkMark = (status: AttendanceStatus) => {
    setDailyDraft((prev) => {
      const updated = { ...prev };
      filteredStudents.forEach((stu, idx) => {
        const sid = getStudentId(stu, idx);
        updated[sid] = {
          status,
          remarks: prev[sid]?.remarks || '',
        };
      });
      return updated;
    });
  };

  // Save remark for a student
  const handleSaveRemark = () => {
    if (!remarkModalStudent) return;
    const sid = getStudentId(remarkModalStudent);
    setDailyDraft((prev) => ({
      ...prev,
      [sid]: {
        status: prev[sid]?.status || 'Present',
        remarks: tempRemark.trim(),
      },
    }));
    setRemarkModalStudent(null);
  };

  // Save daily attendance to store + backend
  const handleSaveAttendance = async () => {
    setSaving(true);
    const nowIso = new Date().toISOString();

    if (!ATTENDANCE_STORE[selectedDate]) {
      ATTENDANCE_STORE[selectedDate] = {};
    }

    const recordsToSave: AttendanceRecord[] = [];
    const markerName = teacherContextName || (role === 'teacher' ? 'Class Teacher' : 'SuperAdmin / Nazim');

    filteredStudents.forEach((stu, idx) => {
      const sid = getStudentId(stu, idx);
      const entry = dailyDraft[sid] || { status: 'Present', remarks: '' };
      const record: AttendanceRecord = {
        id: `${selectedDate}-${sid}`,
        studentId: sid,
        studentName: getStudentFullName(stu),
        fatherName: stu.fatherName,
        rollNo: stu.rollNo || `MMS-${101 + idx}`,
        darja: getStudentDarja(stu),
        guardianMobile: stu.guardianMobile,
        date: selectedDate,
        status: entry.status,
        remarks: entry.remarks,
        markedBy: markerName,
        updatedAt: nowIso,
      };
      ATTENDANCE_STORE[selectedDate][sid] = record;
      recordsToSave.push(record);
    });

    try {
      await apiService.saveAttendance({
        date: selectedDate,
        darja: classContextName || selectedDarja,
        records: recordsToSave,
      });
    } catch {
      // Stored locally in ATTENDANCE_STORE even when backend is unreachable
    }

    setSaving(false);
    setStoreVersion((v) => v + 1);

    const presentCount = filteredStudents.filter(
      (s, i) => (dailyDraft[getStudentId(s, i)]?.status || 'Present') === 'Present'
    ).length;
    const absentCount = filteredStudents.filter(
      (s, i) => dailyDraft[getStudentId(s, i)]?.status === 'Absent'
    ).length;
    const leaveCount = filteredStudents.filter(
      (s, i) => dailyDraft[getStudentId(s, i)]?.status === 'Leave'
    ).length;

    Alert.alert(
      'Haziri Saved ✅ (حاضری محفوظ ہو گئی)',
      `Date: ${formatReadableDate(selectedDate)}\nClass/Darja: ${classContextName || selectedDarja}\nMarked By: ${markerName}\n\n• Present (حاضر): ${presentCount}\n• Absent (غیر حاضر): ${absentCount}\n• Leave (رخصت): ${leaveCount}`,
      [
        { text: 'Stay Here', style: 'cancel' },
        {
          text: 'Monthly Report 📊',
          onPress: () => setActiveTab('monthly'),
        },
        {
          text: 'Yearly Report 📆',
          onPress: () => setActiveTab('yearly'),
        },
      ]
    );
  };

  // Current day live summary metrics (for Mark tab)
  const markSummary = useMemo(() => {
    let present = 0;
    let absent = 0;
    let leave = 0;

    filteredStudents.forEach((stu, idx) => {
      const sid = getStudentId(stu, idx);
      const st = dailyDraft[sid]?.status || 'Present';
      if (st === 'Present') present++;
      else if (st === 'Absent') absent++;
      else if (st === 'Leave') leave++;
    });

    const total = filteredStudents.length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, leave, percentage };
  }, [filteredStudents, dailyDraft]);

  // ==========================================
  // COMPUTED HISTORY DATA (TAB 2)
  // ==========================================
  const dailySessionsHistory = useMemo((): DailyAttendanceSummary[] => {
    const dates = Object.keys(ATTENDANCE_STORE).sort((a, b) => (a < b ? 1 : -1));
    return dates
      .map((dateKey) => {
        const mapForDate = ATTENDANCE_STORE[dateKey] || {};
        const records = Object.values(mapForDate).filter((r) => {
          if (studentFocusFilter) {
            return r.studentName.toLowerCase() === studentFocusFilter.toLowerCase();
          }
          return matchesDarjaFilter(r.darja);
        });
        const total = records.length;
        const present = records.filter((r) => r.status === 'Present').length;
        const absent = records.filter((r) => r.status === 'Absent').length;
        const leave = records.filter((r) => r.status === 'Leave').length;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

        return {
          date: dateKey,
          darja: classContextName || selectedDarja,
          total,
          present,
          absent,
          leave,
          percentage,
        };
      })
      .filter((s) => s.total > 0);
  }, [matchesDarjaFilter, selectedDarja, classContextName, studentFocusFilter, storeVersion]);

  const flattenedHistoryRecords = useMemo((): AttendanceRecord[] => {
    const dates = Object.keys(ATTENDANCE_STORE).sort((a, b) => (a < b ? 1 : -1));
    const list: AttendanceRecord[] = [];

    dates.forEach((dateKey) => {
      const mapForDate = ATTENDANCE_STORE[dateKey] || {};
      Object.values(mapForDate).forEach((rec) => {
        if (studentFocusFilter) {
          if (rec.studentName.toLowerCase() !== studentFocusFilter.toLowerCase()) return;
        } else if (!matchesDarjaFilter(rec.darja)) {
          return;
        }
        if (historyStatusFilter !== 'All' && rec.status !== historyStatusFilter) return;
        if (searchQuery.trim() && !studentFocusFilter) {
          const q = searchQuery.trim().toLowerCase();
          const matchName = rec.studentName.toLowerCase().includes(q);
          const matchRoll = (rec.rollNo || '').toLowerCase().includes(q);
          const matchDate = rec.date.includes(q);
          if (!matchName && !matchRoll && !matchDate) return;
        }
        list.push(rec);
      });
    });

    return list;
  }, [matchesDarjaFilter, historyStatusFilter, searchQuery, studentFocusFilter, storeVersion]);

  // ==========================================
  // COMPUTED MONTHLY REPORT DATA (TAB 3)
  // ==========================================
  const handleShiftMonth = (deltaMonths: number) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const dt = new Date(y, m - 1 + deltaMonths, 1);
    const nextMonth = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
    if (nextMonth > currentMonthKey) return;
    setSelectedMonth(nextMonth);
  };

  const monthlyReportData = useMemo(() => {
    const matchingDates = Object.keys(ATTENDANCE_STORE)
      .filter((d) => d.startsWith(selectedMonth))
      .sort((a, b) => (a < b ? 1 : -1));

    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLeave = 0;

    const studentReports: StudentMonthlyReport[] = filteredStudents.map((stu, idx) => {
      const sid = getStudentId(stu, idx);
      const stuNameLower = getStudentFullName(stu).toLowerCase();
      const records: AttendanceRecord[] = [];
      let presentDays = 0;
      let absentDays = 0;
      let leaveDays = 0;

      matchingDates.forEach((dateKey) => {
        const dayMap = ATTENDANCE_STORE[dateKey] || {};
        const rec =
          dayMap[sid] ||
          Object.values(dayMap).find((r) => r.studentName.toLowerCase() === stuNameLower);
        if (rec) {
          records.push(rec);
          if (rec.status === 'Present') presentDays++;
          else if (rec.status === 'Absent') absentDays++;
          else if (rec.status === 'Leave') leaveDays++;
        }
      });

      totalPresent += presentDays;
      totalAbsent += absentDays;
      totalLeave += leaveDays;

      const totalDays = records.length;
      const attendancePercentage =
        totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

      return {
        studentId: sid,
        studentName: getStudentFullName(stu),
        fatherName: stu.fatherName,
        rollNo: stu.rollNo || `MMS-${101 + idx}`,
        darja: getStudentDarja(stu),
        guardianMobile: stu.guardianMobile,
        totalDays,
        presentDays,
        absentDays,
        leaveDays,
        attendancePercentage,
        records,
      };
    });

    const grandTotalEntries = totalPresent + totalAbsent + totalLeave;
    const overallPercentage =
      grandTotalEntries > 0 ? Math.round((totalPresent / grandTotalEntries) * 100) : 0;

    // Darja-wise breakdown for the month
    const darjaBreakdown = DARJAT_LIST.filter((d) => d.id !== 'all').map((darjaObj) => {
      const key = darjaObj.title.toLowerCase();
      let dPresent = 0;
      let dTotal = 0;

      matchingDates.forEach((dateKey) => {
        const dayMap = ATTENDANCE_STORE[dateKey] || {};
        Object.values(dayMap).forEach((rec) => {
          const prog = rec.darja.toLowerCase();
          if (
            prog.includes(key) ||
            (key.includes('hifz') && prog.includes('hifz')) ||
            (key.includes('dars') && prog.includes('dars')) ||
            (key.includes('nazra') && prog.includes('nazra')) ||
            (key.includes('tajweed') && prog.includes('tajweed')) ||
            (key.includes('aalim') && prog.includes('aalim'))
          ) {
            dTotal++;
            if (rec.status === 'Present') dPresent++;
          }
        });
      });

      const pct = dTotal > 0 ? Math.round((dPresent / dTotal) * 100) : 95;
      return {
        id: darjaObj.id,
        title: darjaObj.title,
        urdu: darjaObj.urdu,
        icon: darjaObj.icon,
        present: dPresent,
        total: dTotal,
        percentage: pct,
      };
    });

    return {
      workingDaysCount: matchingDates.length,
      totalPresent,
      totalAbsent,
      totalLeave,
      overallPercentage,
      studentReports,
      darjaBreakdown,
    };
  }, [selectedMonth, filteredStudents, storeVersion]);

  // ==========================================
  // COMPUTED YEARLY REPORT DATA (TAB 4)
  // ==========================================
  const handleShiftYear = (deltaYears: number) => {
    const nextYr = String(Number(selectedYear) + deltaYears);
    if (nextYr > currentYearKey) return;
    setSelectedYear(nextYr);
  };

  const yearlyReportData = useMemo(() => {
    const matchingDates = Object.keys(ATTENDANCE_STORE)
      .filter((d) => d.startsWith(selectedYear))
      .sort((a, b) => (a < b ? 1 : -1));

    // Unique months in this year
    const monthsSet = new Set<string>();
    matchingDates.forEach((d) => monthsSet.add(d.slice(0, 7)));
    const monthsList = Array.from(monthsSet).sort((a, b) => (a < b ? 1 : -1));

    let yearPresent = 0;
    let yearAbsent = 0;
    let yearLeave = 0;

    const studentYearlyReports: StudentYearlyReport[] = filteredStudents.map((stu, idx) => {
      const sid = getStudentId(stu, idx);
      const stuNameLower = getStudentFullName(stu).toLowerCase();
      let presentDays = 0;
      let absentDays = 0;
      let leaveDays = 0;

      const monthlyMap: Record<
        string,
        { present: number; absent: number; leave: number; total: number }
      > = {};

      monthsList.forEach((mKey) => {
        monthlyMap[mKey] = { present: 0, absent: 0, leave: 0, total: 0 };
      });

      matchingDates.forEach((dateKey) => {
        const mKey = dateKey.slice(0, 7);
        const dayMap = ATTENDANCE_STORE[dateKey] || {};
        const rec =
          dayMap[sid] ||
          Object.values(dayMap).find((r) => r.studentName.toLowerCase() === stuNameLower);
        if (rec) {
          if (!monthlyMap[mKey]) {
            monthlyMap[mKey] = { present: 0, absent: 0, leave: 0, total: 0 };
          }
          monthlyMap[mKey].total++;
          if (rec.status === 'Present') {
            presentDays++;
            monthlyMap[mKey].present++;
          } else if (rec.status === 'Absent') {
            absentDays++;
            monthlyMap[mKey].absent++;
          } else if (rec.status === 'Leave') {
            leaveDays++;
            monthlyMap[mKey].leave++;
          }
        }
      });

      yearPresent += presentDays;
      yearAbsent += absentDays;
      yearLeave += leaveDays;

      const totalDays = presentDays + absentDays + leaveDays;
      const attendancePercentage =
        totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

      const monthlyBreakdown: MonthlyBreakdownItem[] = monthsList.map((mKey) => {
        const mStats = monthlyMap[mKey] || { present: 0, absent: 0, leave: 0, total: 0 };
        return {
          monthKey: mKey,
          monthLabel: formatShortMonthLabel(mKey),
          totalDays: mStats.total,
          presentDays: mStats.present,
          absentDays: mStats.absent,
          leaveDays: mStats.leave,
          percentage:
            mStats.total > 0 ? Math.round((mStats.present / mStats.total) * 100) : 0,
        };
      });

      return {
        studentId: sid,
        studentName: getStudentFullName(stu),
        fatherName: stu.fatherName,
        rollNo: stu.rollNo || `MMS-${101 + idx}`,
        darja: getStudentDarja(stu),
        guardianMobile: stu.guardianMobile,
        year: selectedYear,
        totalDays,
        presentDays,
        absentDays,
        leaveDays,
        attendancePercentage,
        monthlyBreakdown,
      };
    });

    // Overall month-by-month summary for the class/darja
    const classMonthlyOverview: MonthlyBreakdownItem[] = monthsList.map((mKey) => {
      const mDates = matchingDates.filter((d) => d.startsWith(mKey));
      let mP = 0;
      let mA = 0;
      let mL = 0;

      mDates.forEach((dKey) => {
        const dayMap = ATTENDANCE_STORE[dKey] || {};
        filteredStudents.forEach((stu, idx) => {
          const sid = getStudentId(stu, idx);
          const stuNameLower = getStudentFullName(stu).toLowerCase();
          const rec =
            dayMap[sid] ||
            Object.values(dayMap).find((r) => r.studentName.toLowerCase() === stuNameLower);
          if (rec) {
            if (rec.status === 'Present') mP++;
            else if (rec.status === 'Absent') mA++;
            else if (rec.status === 'Leave') mL++;
          }
        });
      });

      const mTot = mP + mA + mL;
      return {
        monthKey: mKey,
        monthLabel: formatShortMonthLabel(mKey),
        totalDays: mDates.length,
        presentDays: mP,
        absentDays: mA,
        leaveDays: mL,
        percentage: mTot > 0 ? Math.round((mP / mTot) * 100) : 0,
      };
    });

    const grandTotal = yearPresent + yearAbsent + yearLeave;
    const overallYearlyPercentage =
      grandTotal > 0 ? Math.round((yearPresent / grandTotal) * 100) : 0;

    return {
      workingDaysCount: matchingDates.length,
      yearPresent,
      yearAbsent,
      yearLeave,
      overallYearlyPercentage,
      classMonthlyOverview,
      studentYearlyReports,
    };
  }, [selectedYear, filteredStudents, storeVersion]);

  // Active student reports for detail modal
  const activeModalMonthlyReport = useMemo(() => {
    if (!detailModalStudentId) return null;
    return (
      monthlyReportData.studentReports.find((r) => r.studentId === detailModalStudentId) ||
      null
    );
  }, [detailModalStudentId, monthlyReportData]);

  const activeModalYearlyReport = useMemo(() => {
    if (!detailModalStudentId) return null;
    return (
      yearlyReportData.studentYearlyReports.find(
        (r) => r.studentId === detailModalStudentId
      ) || null
    );
  }, [detailModalStudentId, yearlyReportData]);

  // Call or WhatsApp Guardian helper
  const handleCallGuardian = (phone?: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Call Failed', `Cannot dial ${phone} on this device.`);
    });
  };

  const handleWhatsAppGuardian = (phone?: string, studentName?: string) => {
    if (!phone) return;
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '92' + clean.slice(1);
    const msg = encodeURIComponent(
      `Assalamu Alaikum, this is an attendance report update from Jamia Darul Uloom (MMS) regarding Talib-e-Ilm ${studentName || ''}.`
    );
    Linking.openURL(`whatsapp://send?phone=${clean}&text=${msg}`).catch(() => {
      Alert.alert('WhatsApp Unavailable', 'WhatsApp is not installed on this device.');
    });
  };

  // ==========================================
  // RENDERERS
  // ==========================================
  const renderMarkStudentItem = ({ item, index }: { item: Student; index: number }) => {
    const sid = getStudentId(item, index);
    const current = dailyDraft[sid] || { status: 'Present', remarks: '' };
    const status = current.status;
    const fullName = getStudentFullName(item);
    const darja = getStudentDarja(item);
    const rollNo = item.rollNo || `MMS-${101 + index}`;

    return (
      <View style={styles.studentCard}>
        <View style={styles.studentTopRow}>
          <View
            style={[
              styles.avatarCircle,
              status === 'Present'
                ? styles.avatarPresent
                : status === 'Absent'
                ? styles.avatarAbsent
                : styles.avatarLeave,
            ]}
          >
            <Text style={styles.avatarText}>
              {fullName
                .split(' ')
                .map((w) => w[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </Text>
          </View>

          <View style={{ flex: 1, marginLeft: 10 }}>
            <View style={styles.nameHeaderRow}>
              <Text style={styles.studentNameText} numberOfLines={1}>
                {fullName}
              </Text>
              <View style={styles.rollBadge}>
                <Text style={styles.rollBadgeText}>{rollNo}</Text>
              </View>
            </View>
            <Text style={styles.fatherText} numberOfLines={1}>
              Walid: {item.fatherName} • {darja}
            </Text>
          </View>
        </View>

        {/* 3 Status Buttons: Present, Absent, Leave */}
        <View style={styles.statusButtonsRow}>
          <TouchableOpacity
            style={[
              styles.statusChoiceBtn,
              status === 'Present' && styles.statusChoicePresentActive,
            ]}
            activeOpacity={0.75}
            onPress={() => handleSetStatus(sid, 'Present')}
          >
            <Text
              style={[
                styles.statusChoiceText,
                status === 'Present' && styles.statusChoiceTextActive,
              ]}
            >
              ✓ Present (حاضر)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statusChoiceBtn,
              status === 'Absent' && styles.statusChoiceAbsentActive,
            ]}
            activeOpacity={0.75}
            onPress={() => handleSetStatus(sid, 'Absent')}
          >
            <Text
              style={[
                styles.statusChoiceText,
                status === 'Absent' && styles.statusChoiceTextActive,
              ]}
            >
              ✕ Absent (غیر حاضر)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statusChoiceBtn,
              status === 'Leave' && styles.statusChoiceLeaveActive,
            ]}
            activeOpacity={0.75}
            onPress={() => handleSetStatus(sid, 'Leave')}
          >
            <Text
              style={[
                styles.statusChoiceText,
                status === 'Leave' && styles.statusChoiceTextActive,
              ]}
            >
              🕒 Leave (رخصت)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Remarks / Reason Row + Report Quick View */}
        <View style={styles.cardBottomMeta}>
          <TouchableOpacity
            style={styles.remarkTriggerBtn}
            onPress={() => {
              setRemarkModalStudent(item);
              setTempRemark(current.remarks || '');
            }}
          >
            <Text style={styles.remarkTriggerText} numberOfLines={1}>
              {current.remarks
                ? `📝 Note: ${current.remarks}`
                : '+ Add Note / Leave Reason'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.miniReportBtn}
            onPress={() => {
              setDetailModalStudentId(sid);
              setDetailModalMode('monthly');
            }}
          >
            <Text style={styles.miniReportBtnText}>📊 Monthly / Yearly Report</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" />

      {/* TOP HEADER */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {isReadOnly
              ? 'طالب علم حاضری رپورٹ • Attendance Report'
              : classContextName
              ? `${classContextName}`
              : 'حاضری رجسٹر • Attendance'}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {isReadOnly
              ? `Parent View • ${studentFocusFilter || 'Student Report'}`
              : teacherContextName
              ? `Ustad: ${teacherContextName} • Mark & View Reports`
              : 'Daily Haziri, History, Monthly & Yearly Reports'}
          </Text>
        </View>

        <View style={styles.headerRightBadge}>
          <Text style={styles.headerRightBadgeText}>
            {role === 'teacher' ? 'USTAD' : role === 'parent' ? 'PARENT' : 'ADMIN'}
          </Text>
        </View>
      </View>

      {/* MAIN MODE TABS */}
      <View style={styles.modeTabsBar}>
        {!isReadOnly && (
          <TouchableOpacity
            style={[styles.modeTabBtn, activeTab === 'mark' && styles.modeTabBtnActive]}
            onPress={() => setActiveTab('mark')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.modeTabText,
                activeTab === 'mark' && styles.modeTabTextActive,
              ]}
            >
              ☑ Mark
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.modeTabBtn, activeTab === 'monthly' && styles.modeTabBtnActive]}
          onPress={() => setActiveTab('monthly')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.modeTabText,
              activeTab === 'monthly' && styles.modeTabTextActive,
            ]}
          >
            📊 Monthly
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeTabBtn, activeTab === 'yearly' && styles.modeTabBtnActive]}
          onPress={() => setActiveTab('yearly')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.modeTabText,
              activeTab === 'yearly' && styles.modeTabTextActive,
            ]}
          >
            📆 Yearly
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeTabBtn, activeTab === 'history' && styles.modeTabBtnActive]}
          onPress={() => setActiveTab('history')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.modeTabText,
              activeTab === 'history' && styles.modeTabTextActive,
            ]}
          >
            📜 History
          </Text>
        </TouchableOpacity>
      </View>

      {/* FOCUSED STUDENT BANNER (When viewing a single student's report) */}
      {studentFocusFilter ? (
        <View style={styles.studentFocusBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.studentFocusLabel}>VIEWING ATTENDANCE REPORT FOR:</Text>
            <Text style={styles.studentFocusName}>🎓 {studentFocusFilter}</Text>
          </View>
          {!isReadOnly && (
            <TouchableOpacity
              style={styles.clearStudentFocusBtn}
              onPress={() => {
                setStudentFocusFilter(null);
                setSearchQuery('');
              }}
            >
              <Text style={styles.clearStudentFocusText}>Show All Students ✕</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        /* DARJA FILTER CHIPS (When viewing class / all students) */
        <View style={styles.darjaFilterWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.darjaScrollContent}
          >
            {DARJAT_LIST.map((darja) => {
              const isSelected =
                selectedDarja === darja.title ||
                (selectedDarja === 'All Darjat' && darja.id === 'all');
              return (
                <TouchableOpacity
                  key={darja.id}
                  style={[styles.darjaChip, isSelected && styles.darjaChipActive]}
                  onPress={() => setSelectedDarja(darja.title)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.darjaChipIcon}>{darja.icon}</Text>
                  <Text
                    style={[
                      styles.darjaChipText,
                      isSelected && styles.darjaChipTextActive,
                    ]}
                  >
                    {darja.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {loading ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color="#0F4433" />
          <Text style={styles.loaderText}>Loading Attendance Register...</Text>
        </View>
      ) : activeTab === 'mark' && !isReadOnly ? (
        /* ==========================================
           TAB 1: MARK DAILY ATTENDANCE
           ========================================== */
        <View style={{ flex: 1 }}>
          {/* Date Selector Strip */}
          <View style={styles.dateSelectorBar}>
            <TouchableOpacity
              style={styles.dateArrowBtn}
              onPress={() => handleShiftDate(-1)}
            >
              <Text style={styles.dateArrowText}>◀ Prev</Text>
            </TouchableOpacity>

            <View style={styles.dateCenterBox}>
              <View style={styles.dateRowCenter}>
                <Text style={styles.dateMainLabel}>
                  📅 {formatReadableDate(selectedDate)}
                </Text>
                {selectedDate === todayKey && (
                  <View style={styles.todayBadge}>
                    <Text style={styles.todayBadgeText}>TODAY</Text>
                  </View>
                )}
              </View>
              <Text style={styles.dateSubLabel}>Date Code: {selectedDate}</Text>
            </View>

            {selectedDate !== todayKey ? (
              <TouchableOpacity
                style={styles.jumpTodayBtn}
                onPress={() => setSelectedDate(todayKey)}
              >
                <Text style={styles.jumpTodayBtnText}>Today ➔</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.dateArrowBtn, { opacity: 0.4 }]}
                disabled
              >
                <Text style={styles.dateArrowText}>Next ▶</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Live Attendance Summary Strip */}
          <View style={styles.liveStatsRow}>
            <View style={[styles.statPill, { backgroundColor: '#F1F5F9' }]}>
              <Text style={styles.statPillNum}>{markSummary.total}</Text>
              <Text style={styles.statPillLabel}>Total</Text>
            </View>

            <View style={[styles.statPill, { backgroundColor: '#DCFCE7' }]}>
              <Text style={[styles.statPillNum, { color: '#15803D' }]}>
                {markSummary.present}
              </Text>
              <Text style={[styles.statPillLabel, { color: '#15803D' }]}>
                Present ({markSummary.percentage}%)
              </Text>
            </View>

            <View style={[styles.statPill, { backgroundColor: '#FEE2E2' }]}>
              <Text style={[styles.statPillNum, { color: '#DC2626' }]}>
                {markSummary.absent}
              </Text>
              <Text style={[styles.statPillLabel, { color: '#DC2626' }]}>
                Absent
              </Text>
            </View>

            <View style={[styles.statPill, { backgroundColor: '#FEF3C7' }]}>
              <Text style={[styles.statPillNum, { color: '#B45309' }]}>
                {markSummary.leave}
              </Text>
              <Text style={[styles.statPillLabel, { color: '#B45309' }]}>
                Leave
              </Text>
            </View>
          </View>

          {/* Search & Bulk Actions Row */}
          <View style={styles.controlsBar}>
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search student name or roll no..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearSearchIcon}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.bulkBtnsRow}>
              <Text style={styles.bulkLabel}>Quick Mark All:</Text>
              <TouchableOpacity
                style={styles.bulkPresentBtn}
                onPress={() => handleBulkMark('Present')}
              >
                <Text style={styles.bulkPresentText}>✓ All Present</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.bulkAbsentBtn}
                onPress={() => handleBulkMark('Absent')}
              >
                <Text style={styles.bulkAbsentText}>✕ All Absent</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.bulkLeaveBtn}
                onPress={() => handleBulkMark('Leave')}
              >
                <Text style={styles.bulkLeaveText}>🕒 All Leave</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Student Attendance Roster */}
          <FlatList
            data={filteredStudents}
            keyExtractor={(item, idx) => getStudentId(item, idx)}
            renderItem={renderMarkStudentItem}
            contentContainerStyle={styles.markListContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>📋</Text>
                <Text style={styles.emptyTitle}>No Students in this Filter</Text>
                <Text style={styles.emptySub}>
                  Try selecting "All Darjat" or clearing the search box.
                </Text>
              </View>
            }
          />

          {/* Bottom Save Bar */}
          <View style={styles.saveFooterBar}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.saveFooterTitle}>
                {formatReadableDate(selectedDate)}
              </Text>
              <Text style={styles.saveFooterSub}>
                P: {markSummary.present} • A: {markSummary.absent} • L:{' '}
                {markSummary.leave} ({markSummary.percentage}%)
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSaveAttendance}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>💾 Save Haziri</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : activeTab === 'history' ? (
        /* ==========================================
           TAB 2: ATTENDANCE HISTORY
           ========================================== */
        <View style={{ flex: 1 }}>
          {/* Sub-toggle: Daily Sessions vs Student Records */}
          <View style={styles.historySubHeader}>
            {!studentFocusFilter && (
              <View style={styles.historySegmentBox}>
                <TouchableOpacity
                  style={[
                    styles.historySegmentBtn,
                    historyViewMode === 'sessions' && styles.historySegmentBtnActive,
                  ]}
                  onPress={() => setHistoryViewMode('sessions')}
                >
                  <Text
                    style={[
                      styles.historySegmentText,
                      historyViewMode === 'sessions' &&
                        styles.historySegmentTextActive,
                    ]}
                  >
                    📅 Date-wise Summary ({dailySessionsHistory.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.historySegmentBtn,
                    historyViewMode === 'records' && styles.historySegmentBtnActive,
                  ]}
                  onPress={() => setHistoryViewMode('records')}
                >
                  <Text
                    style={[
                      styles.historySegmentText,
                      historyViewMode === 'records' &&
                        styles.historySegmentTextActive,
                    ]}
                  >
                    👤 Student Logs ({flattenedHistoryRecords.length})
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {(historyViewMode === 'records' || !!studentFocusFilter) && (
              <>
                {!studentFocusFilter && (
                  <View style={[styles.searchBox, { marginTop: 8 }]}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Filter history by student, roll no, or YYYY-MM-DD..."
                      placeholderTextColor="#94A3B8"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Text style={styles.clearSearchIcon}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                <View style={styles.statusFilterPillsRow}>
                  {(['All', 'Present', 'Absent', 'Leave'] as const).map((st) => {
                    const active = historyStatusFilter === st;
                    return (
                      <TouchableOpacity
                        key={st}
                        style={[
                          styles.statusFilterChip,
                          active && styles.statusFilterChipActive,
                        ]}
                        onPress={() => setHistoryStatusFilter(st)}
                      >
                        <Text
                          style={[
                            styles.statusFilterChipText,
                            active && styles.statusFilterChipTextActive,
                          ]}
                        >
                          {st === 'All'
                            ? 'All Statuses'
                            : st === 'Present'
                            ? '● Present'
                            : st === 'Absent'
                            ? '● Absent'
                            : '● Leave'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
          </View>

          {historyViewMode === 'sessions' && !studentFocusFilter ? (
            <FlatList
              data={dailySessionsHistory}
              keyExtractor={(item) => item.date}
              contentContainerStyle={styles.historyListContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.sessionHistoryCard}>
                  <View style={styles.sessionCardHeader}>
                    <View>
                      <Text style={styles.sessionDateTitle}>
                        📅 {formatReadableDate(item.date)}
                      </Text>
                      <Text style={styles.sessionDarjaSub}>
                        {item.darja} • {item.total} Talaba Marked
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.sessionPctBadge,
                        item.percentage >= 85
                          ? styles.pctGood
                          : item.percentage >= 75
                          ? styles.pctWarn
                          : styles.pctLow,
                      ]}
                    >
                      <Text style={styles.sessionPctText}>
                        {item.percentage}% Present
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.sessionProgressTrack}>
                    <View
                      style={[
                        styles.sessionProgressFill,
                        { width: `${item.percentage}%` },
                      ]}
                    />
                  </View>

                  {/* Breakdown Counts + Edit Action */}
                  <View style={styles.sessionFooterRow}>
                    <View style={styles.sessionCountsGroup}>
                      <Text style={styles.sessionCountPresent}>
                        ✓ Present: {item.present}
                      </Text>
                      <Text style={styles.sessionCountAbsent}>
                        ✕ Absent: {item.absent}
                      </Text>
                      <Text style={styles.sessionCountLeave}>
                        🕒 Leave: {item.leave}
                      </Text>
                    </View>

                    {!isReadOnly && (
                      <TouchableOpacity
                        style={styles.sessionEditBtn}
                        onPress={() => {
                          setSelectedDate(item.date);
                          setActiveTab('mark');
                        }}
                      >
                        <Text style={styles.sessionEditBtnText}>
                          Inspect / Edit →
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            />
          ) : (
            <FlatList
              data={flattenedHistoryRecords}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.historyListContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.recordLogCard}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.recordLogHeader}>
                      <Text style={styles.recordStudentName}>
                        {item.studentName}
                      </Text>
                      <Text style={styles.recordRollNo}>({item.rollNo})</Text>
                    </View>
                    <Text style={styles.recordMetaText}>
                      📅 {formatReadableDate(item.date)} • 📖 {item.darja}
                    </Text>
                    {item.remarks ? (
                      <Text style={styles.recordRemarkText}>
                        📝 {item.remarks}
                      </Text>
                    ) : null}
                  </View>

                  <View
                    style={[
                      styles.recordStatusPill,
                      item.status === 'Present'
                        ? styles.pillPresent
                        : item.status === 'Absent'
                        ? styles.pillAbsent
                        : styles.pillLeave,
                    ]}
                  >
                    <Text
                      style={[
                        styles.recordStatusPillText,
                        item.status === 'Present'
                          ? { color: '#15803D' }
                          : item.status === 'Absent'
                          ? { color: '#DC2626' }
                          : { color: '#B45309' },
                      ]}
                    >
                      {item.status === 'Present'
                        ? 'Present • حاضر'
                        : item.status === 'Absent'
                        ? 'Absent • غیر حاضر'
                        : 'Leave • رخصت'}
                    </Text>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      ) : activeTab === 'monthly' ? (
        /* ==========================================
           TAB 3: MONTHLY REPORTS
           ========================================== */
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.monthlyScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Month Selector Bar */}
          <View style={styles.monthPickerCard}>
            <TouchableOpacity
              style={styles.dateArrowBtn}
              onPress={() => handleShiftMonth(-1)}
            >
              <Text style={styles.dateArrowText}>◀ Prev</Text>
            </TouchableOpacity>

            <View style={{ alignItems: 'center' }}>
              <Text style={styles.monthMainTitle}>
                🗓️ {formatMonthLabel(selectedMonth)}
              </Text>
              <Text style={styles.monthSubTitle}>
                {monthlyReportData.workingDaysCount} Working Days Recorded
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.dateArrowBtn,
                selectedMonth >= currentMonthKey && { opacity: 0.4 },
              ]}
              disabled={selectedMonth >= currentMonthKey}
              onPress={() => handleShiftMonth(1)}
            >
              <Text style={styles.dateArrowText}>Next ▶</Text>
            </TouchableOpacity>
          </View>

          {/* Monthly Executive Overview Card */}
          <View style={styles.monthlyHeroCard}>
            <View style={styles.monthlyHeroTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.monthlyHeroTag}>
                  MONTHLY ATTENDANCE REPORT (ماہانہ رپورٹ)
                </Text>
                <Text style={styles.monthlyHeroBigPct}>
                  {monthlyReportData.overallPercentage}%
                </Text>
                <Text style={styles.monthlyHeroSub}>
                  {studentFocusFilter
                    ? `${studentFocusFilter} • ${formatMonthLabel(selectedMonth)}`
                    : `Average across ${classContextName || selectedDarja}`}
                </Text>
              </View>

              <View style={styles.monthlyHeroRightBox}>
                <Text style={styles.monthlyHeroDaysNum}>
                  {monthlyReportData.workingDaysCount}
                </Text>
                <Text style={styles.monthlyHeroDaysLabel}>Working Days</Text>
              </View>
            </View>

            <View style={styles.monthlyHeroDivider} />

            <View style={styles.monthlyTotalsRow}>
              <View style={styles.monthlyTotalItem}>
                <Text style={styles.monthlyTotalValPresent}>
                  {monthlyReportData.totalPresent}
                </Text>
                <Text style={styles.monthlyTotalLabel}>Present (حاضر)</Text>
              </View>

              <View style={styles.monthlyTotalItem}>
                <Text style={styles.monthlyTotalValAbsent}>
                  {monthlyReportData.totalAbsent}
                </Text>
                <Text style={styles.monthlyTotalLabel}>Absent (غیر حاضر)</Text>
              </View>

              <View style={styles.monthlyTotalItem}>
                <Text style={styles.monthlyTotalValLeave}>
                  {monthlyReportData.totalLeave}
                </Text>
                <Text style={styles.monthlyTotalLabel}>Leave (رخصت)</Text>
              </View>
            </View>
          </View>

          {/* Darja-wise Monthly Breakdown (only when viewing all Darjaat) */}
          {!studentFocusFilter && selectedDarja === 'All Darjat' && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionCardTitle}>
                🏛️ Darja-wise Monthly Attendance Rate
              </Text>
              <Text style={styles.sectionCardSub}>
                Departmental performance for {formatMonthLabel(selectedMonth)}
              </Text>

              {monthlyReportData.darjaBreakdown.map((d) => (
                <View key={d.id} style={styles.darjaReportRow}>
                  <View style={styles.darjaReportHeader}>
                    <Text style={styles.darjaReportName}>
                      {d.icon} {d.title} ({d.urdu})
                    </Text>
                    <Text style={styles.darjaReportPct}>{d.percentage}%</Text>
                  </View>
                  <View style={styles.darjaBarTrack}>
                    <View
                      style={[
                        styles.darjaBarFill,
                        {
                          width: `${d.percentage}%`,
                          backgroundColor:
                            d.percentage >= 85
                              ? '#059669'
                              : d.percentage >= 75
                              ? '#D97706'
                              : '#DC2626',
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Student-wise Monthly Report List */}
          <View style={styles.sectionHeaderBetween}>
            <View>
              <Text style={styles.sectionMainHeading}>
                🎓 {studentFocusFilter ? 'Monthly Breakdown & Daily Log' : 'Student-wise Monthly Report'}
              </Text>
              <Text style={styles.sectionSubHeading}>
                Tap a student card to view Day-by-Day Monthly & Yearly breakdown
              </Text>
            </View>
          </View>

          {monthlyReportData.studentReports.map((rep) => {
            const isGood = rep.attendancePercentage >= 85;
            const isWarn =
              rep.attendancePercentage >= 75 && rep.attendancePercentage < 85;

            return (
              <View key={rep.studentId}>
                <TouchableOpacity
                  style={styles.studentMonthlyCard}
                  activeOpacity={0.8}
                  onPress={() => {
                    setDetailModalStudentId(rep.studentId);
                    setDetailModalMode('monthly');
                  }}
                >
                  <View style={styles.studentMonthlyTop}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.nameHeaderRow}>
                        <Text style={styles.studentNameText}>{rep.studentName}</Text>
                        <View style={styles.rollBadge}>
                          <Text style={styles.rollBadgeText}>{rep.rollNo}</Text>
                        </View>
                      </View>
                      <Text style={styles.fatherText}>
                        Walid: {rep.fatherName} • {rep.darja}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.monthlyPctCircle,
                        isGood
                          ? styles.pctGood
                          : isWarn
                          ? styles.pctWarn
                          : styles.pctLow,
                      ]}
                    >
                      <Text style={styles.monthlyPctCircleText}>
                        {rep.attendancePercentage}%
                      </Text>
                    </View>
                  </View>

                  <View style={styles.monthlyMiniCountsRow}>
                    <View style={styles.miniStatBox}>
                      <Text style={styles.miniStatLabel}>Working Days</Text>
                      <Text style={styles.miniStatVal}>{rep.totalDays}</Text>
                    </View>
                    <View style={styles.miniStatBox}>
                      <Text style={[styles.miniStatLabel, { color: '#15803D' }]}>
                        Present (P)
                      </Text>
                      <Text style={[styles.miniStatVal, { color: '#15803D' }]}>
                        {rep.presentDays}
                      </Text>
                    </View>
                    <View style={styles.miniStatBox}>
                      <Text style={[styles.miniStatLabel, { color: '#DC2626' }]}>
                        Absent (A)
                      </Text>
                      <Text style={[styles.miniStatVal, { color: '#DC2626' }]}>
                        {rep.absentDays}
                      </Text>
                    </View>
                    <View style={styles.miniStatBox}>
                      <Text style={[styles.miniStatLabel, { color: '#B45309' }]}>
                        Leave (L)
                      </Text>
                      <Text style={[styles.miniStatVal, { color: '#B45309' }]}>
                        {rep.leaveDays}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardTapFooter}>
                    <Text style={styles.cardTapFooterText}>
                      View Full Monthly & Yearly Report →
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* If viewing a single focused student (e.g. Parent Portal), render their day-by-day log inline as well */}
                {studentFocusFilter && rep.records.length > 0 && (
                  <View style={styles.inlineLogCard}>
                    <Text style={styles.inlineLogHeading}>
                      📅 DAY-BY-DAY LOG ({formatMonthLabel(selectedMonth)})
                    </Text>
                    {rep.records.map((rec) => (
                      <View key={rec.id} style={styles.modalLogRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.modalLogDate}>
                            {formatReadableDate(rec.date)}
                          </Text>
                          {rec.remarks ? (
                            <Text style={styles.modalLogRemark}>
                              📝 {rec.remarks}
                            </Text>
                          ) : null}
                        </View>
                        <View
                          style={[
                            styles.recordStatusPill,
                            rec.status === 'Present'
                              ? styles.pillPresent
                              : rec.status === 'Absent'
                              ? styles.pillAbsent
                              : styles.pillLeave,
                          ]}
                        >
                          <Text
                            style={[
                              styles.recordStatusPillText,
                              rec.status === 'Present'
                                ? { color: '#15803D' }
                                : rec.status === 'Absent'
                                ? { color: '#DC2626' }
                                : { color: '#B45309' },
                            ]}
                          >
                            {rec.status}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      ) : (
        /* ==========================================
           TAB 4: YEARLY REPORTS (سالانہ حاضری رپورٹ)
           ========================================== */
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.monthlyScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Year Selector Bar */}
          <View style={styles.monthPickerCard}>
            <TouchableOpacity
              style={styles.dateArrowBtn}
              onPress={() => handleShiftYear(-1)}
            >
              <Text style={styles.dateArrowText}>◀ {Number(selectedYear) - 1}</Text>
            </TouchableOpacity>

            <View style={{ alignItems: 'center' }}>
              <Text style={styles.monthMainTitle}>
                📆 Academic Year {selectedYear}
              </Text>
              <Text style={styles.monthSubTitle}>
                {yearlyReportData.workingDaysCount} Total Working Days in {selectedYear}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.dateArrowBtn,
                selectedYear >= currentYearKey && { opacity: 0.4 },
              ]}
              disabled={selectedYear >= currentYearKey}
              onPress={() => handleShiftYear(1)}
            >
              <Text style={styles.dateArrowText}>{Number(selectedYear) + 1} ▶</Text>
            </TouchableOpacity>
          </View>

          {/* Yearly Executive Hero Card */}
          <View style={[styles.monthlyHeroCard, { backgroundColor: '#1E293B' }]}>
            <View style={styles.monthlyHeroTop}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.monthlyHeroTag, { color: '#FDE68A' }]}>
                  ANNUAL ATTENDANCE REPORT (سالانہ رپورٹ)
                </Text>
                <Text style={styles.monthlyHeroBigPct}>
                  {yearlyReportData.overallYearlyPercentage}%
                </Text>
                <Text style={styles.monthlyHeroSub}>
                  {studentFocusFilter
                    ? `${studentFocusFilter} • Year ${selectedYear}`
                    : `Annual Attendance across ${classContextName || selectedDarja}`}
                </Text>
              </View>

              <View style={styles.monthlyHeroRightBox}>
                <Text style={styles.monthlyHeroDaysNum}>
                  {yearlyReportData.workingDaysCount}
                </Text>
                <Text style={styles.monthlyHeroDaysLabel}>Annual Days</Text>
              </View>
            </View>

            <View style={styles.monthlyHeroDivider} />

            <View style={styles.monthlyTotalsRow}>
              <View style={styles.monthlyTotalItem}>
                <Text style={styles.monthlyTotalValPresent}>
                  {yearlyReportData.yearPresent}
                </Text>
                <Text style={styles.monthlyTotalLabel}>Annual Present</Text>
              </View>

              <View style={styles.monthlyTotalItem}>
                <Text style={styles.monthlyTotalValAbsent}>
                  {yearlyReportData.yearAbsent}
                </Text>
                <Text style={styles.monthlyTotalLabel}>Annual Absent</Text>
              </View>

              <View style={styles.monthlyTotalItem}>
                <Text style={styles.monthlyTotalValLeave}>
                  {yearlyReportData.yearLeave}
                </Text>
                <Text style={styles.monthlyTotalLabel}>Annual Leave</Text>
              </View>
            </View>
          </View>

          {/* Month-by-Month Yearly Progression Card */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionCardTitle}>
              📊 Month-by-Month Breakdown ({selectedYear})
            </Text>
            <Text style={styles.sectionCardSub}>
              Monthly attendance trend across the academic year
            </Text>

            {yearlyReportData.classMonthlyOverview.map((mItem) => (
              <TouchableOpacity
                key={mItem.monthKey}
                style={styles.darjaReportRow}
                activeOpacity={0.75}
                onPress={() => {
                  setSelectedMonth(mItem.monthKey);
                  setActiveTab('monthly');
                }}
              >
                <View style={styles.darjaReportHeader}>
                  <Text style={styles.darjaReportName}>
                    🗓️ {mItem.monthLabel} ({mItem.totalDays} days)
                  </Text>
                  <Text style={styles.darjaReportPct}>
                    P: {mItem.presentDays} • A: {mItem.absentDays} • L:{' '}
                    {mItem.leaveDays} ({mItem.percentage}%)
                  </Text>
                </View>
                <View style={styles.darjaBarTrack}>
                  <View
                    style={[
                      styles.darjaBarFill,
                      {
                        width: `${mItem.percentage}%`,
                        backgroundColor:
                          mItem.percentage >= 85
                            ? '#059669'
                            : mItem.percentage >= 75
                            ? '#D97706'
                            : '#DC2626',
                      },
                    ]}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Student-wise Annual Report Cards */}
          <View style={styles.sectionHeaderBetween}>
            <View>
              <Text style={styles.sectionMainHeading}>
                🎓 Student-wise Annual Report ({selectedYear})
              </Text>
              <Text style={styles.sectionSubHeading}>
                Tap any student to inspect their 12-month yearly attendance card
              </Text>
            </View>
          </View>

          {yearlyReportData.studentYearlyReports.map((rep) => {
            const isGood = rep.attendancePercentage >= 85;
            const isWarn =
              rep.attendancePercentage >= 75 && rep.attendancePercentage < 85;

            return (
              <TouchableOpacity
                key={rep.studentId}
                style={styles.studentMonthlyCard}
                activeOpacity={0.8}
                onPress={() => {
                  setDetailModalStudentId(rep.studentId);
                  setDetailModalMode('yearly');
                }}
              >
                <View style={styles.studentMonthlyTop}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameHeaderRow}>
                      <Text style={styles.studentNameText}>{rep.studentName}</Text>
                      <View style={styles.rollBadge}>
                        <Text style={styles.rollBadgeText}>{rep.rollNo}</Text>
                      </View>
                    </View>
                    <Text style={styles.fatherText}>
                      Walid: {rep.fatherName} • {rep.darja}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.monthlyPctCircle,
                      isGood
                        ? styles.pctGood
                        : isWarn
                        ? styles.pctWarn
                        : styles.pctLow,
                    ]}
                  >
                    <Text style={styles.monthlyPctCircleText}>
                      {rep.attendancePercentage}%
                    </Text>
                  </View>
                </View>

                <View style={styles.monthlyMiniCountsRow}>
                  <View style={styles.miniStatBox}>
                    <Text style={styles.miniStatLabel}>Annual Days</Text>
                    <Text style={styles.miniStatVal}>{rep.totalDays}</Text>
                  </View>
                  <View style={styles.miniStatBox}>
                    <Text style={[styles.miniStatLabel, { color: '#15803D' }]}>
                      Present (P)
                    </Text>
                    <Text style={[styles.miniStatVal, { color: '#15803D' }]}>
                      {rep.presentDays}
                    </Text>
                  </View>
                  <View style={styles.miniStatBox}>
                    <Text style={[styles.miniStatLabel, { color: '#DC2626' }]}>
                      Absent (A)
                    </Text>
                    <Text style={[styles.miniStatVal, { color: '#DC2626' }]}>
                      {rep.absentDays}
                    </Text>
                  </View>
                  <View style={styles.miniStatBox}>
                    <Text style={[styles.miniStatLabel, { color: '#B45309' }]}>
                      Leave (L)
                    </Text>
                    <Text style={[styles.miniStatVal, { color: '#B45309' }]}>
                      {rep.leaveDays}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardTapFooter}>
                  <Text style={styles.cardTapFooterText}>
                    Inspect Month-by-Month Annual Breakdown →
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* ==========================================
         REMARK / LEAVE REASON MODAL
         ========================================== */}
      <Modal
        visible={!!remarkModalStudent}
        transparent
        animationType="slide"
        onRequestClose={() => setRemarkModalStudent(null)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalSheet,
              { paddingBottom: Math.max(insets.bottom + 12, 20) },
            ]}
          >
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>
                  Attendance Note / Leave Reason
                </Text>
                <Text style={styles.modalSubtitle}>
                  {remarkModalStudent
                    ? getStudentFullName(remarkModalStudent)
                    : ''}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseCircle}
                onPress={() => setRemarkModalStudent(null)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.remarkTextInput}
              placeholder="Enter leave reason or attendance note..."
              placeholderTextColor="#94A3B8"
              value={tempRemark}
              onChangeText={setTempRemark}
            />

            <Text style={styles.presetHeading}>Quick Reason Presets:</Text>
            <View style={styles.presetChipsWrap}>
              {QUICK_REMARK_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.presetChip,
                    tempRemark === preset && styles.presetChipActive,
                  ]}
                  onPress={() => setTempRemark(preset)}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      tempRemark === preset && styles.presetChipTextActive,
                    ]}
                  >
                    {preset}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={handleSaveRemark}
            >
              <Text style={styles.modalPrimaryBtnText}>Save Note</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ==========================================
         STUDENT MONTHLY & YEARLY DETAIL MODAL
         ========================================== */}
      <Modal
        visible={!!detailModalStudentId}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailModalStudentId(null)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalSheet,
              {
                maxHeight: '88%',
                paddingBottom: Math.max(insets.bottom + 12, 20),
              },
            ]}
          >
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>
                  {activeModalMonthlyReport?.studentName} (
                  {activeModalMonthlyReport?.rollNo})
                </Text>
                <Text style={styles.modalSubtitle}>
                  Walid: {activeModalMonthlyReport?.fatherName} •{' '}
                  {activeModalMonthlyReport?.darja}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseCircle}
                onPress={() => setDetailModalStudentId(null)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Modal Mode Switcher: Monthly Report vs Yearly Report */}
            <View style={styles.historySegmentBox}>
              <TouchableOpacity
                style={[
                  styles.historySegmentBtn,
                  detailModalMode === 'monthly' && styles.historySegmentBtnActive,
                ]}
                onPress={() => setDetailModalMode('monthly')}
              >
                <Text
                  style={[
                    styles.historySegmentText,
                    detailModalMode === 'monthly' &&
                      styles.historySegmentTextActive,
                  ]}
                >
                  📊 Monthly ({formatShortMonthLabel(selectedMonth)})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.historySegmentBtn,
                  detailModalMode === 'yearly' && styles.historySegmentBtnActive,
                ]}
                onPress={() => setDetailModalMode('yearly')}
              >
                <Text
                  style={[
                    styles.historySegmentText,
                    detailModalMode === 'yearly' &&
                      styles.historySegmentTextActive,
                  ]}
                >
                  📆 Yearly ({selectedYear})
                </Text>
              </TouchableOpacity>
            </View>

            {detailModalMode === 'monthly' ? (
              <>
                {/* Monthly Summary Strip */}
                <View style={[styles.liveStatsRow, { paddingHorizontal: 0 }]}>
                  <View style={[styles.statPill, { backgroundColor: '#DCFCE7' }]}>
                    <Text style={[styles.statPillNum, { color: '#15803D' }]}>
                      {activeModalMonthlyReport?.presentDays}
                    </Text>
                    <Text style={[styles.statPillLabel, { color: '#15803D' }]}>
                      Present
                    </Text>
                  </View>

                  <View style={[styles.statPill, { backgroundColor: '#FEE2E2' }]}>
                    <Text style={[styles.statPillNum, { color: '#DC2626' }]}>
                      {activeModalMonthlyReport?.absentDays}
                    </Text>
                    <Text style={[styles.statPillLabel, { color: '#DC2626' }]}>
                      Absent
                    </Text>
                  </View>

                  <View style={[styles.statPill, { backgroundColor: '#FEF3C7' }]}>
                    <Text style={[styles.statPillNum, { color: '#B45309' }]}>
                      {activeModalMonthlyReport?.leaveDays}
                    </Text>
                    <Text style={[styles.statPillLabel, { color: '#B45309' }]}>
                      Leave
                    </Text>
                  </View>

                  <View style={[styles.statPill, { backgroundColor: '#E0F2FE' }]}>
                    <Text style={[styles.statPillNum, { color: '#0369A1' }]}>
                      {activeModalMonthlyReport?.attendancePercentage}%
                    </Text>
                    <Text style={[styles.statPillLabel, { color: '#0369A1' }]}>
                      Monthly %
                    </Text>
                  </View>
                </View>

                <Text style={[styles.presetHeading, { marginTop: 12 }]}>
                  DAY-BY-DAY LOG ({formatMonthLabel(selectedMonth)}):
                </Text>

                <ScrollView
                  style={{ maxHeight: 280, marginVertical: 6 }}
                  showsVerticalScrollIndicator={false}
                >
                  {activeModalMonthlyReport?.records.map((rec) => (
                    <View key={rec.id} style={styles.modalLogRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.modalLogDate}>
                          {formatReadableDate(rec.date)}
                        </Text>
                        {rec.remarks ? (
                          <Text style={styles.modalLogRemark}>
                            📝 {rec.remarks}
                          </Text>
                        ) : null}
                      </View>
                      <View
                        style={[
                          styles.recordStatusPill,
                          rec.status === 'Present'
                            ? styles.pillPresent
                            : rec.status === 'Absent'
                            ? styles.pillAbsent
                            : styles.pillLeave,
                        ]}
                      >
                        <Text
                          style={[
                            styles.recordStatusPillText,
                            rec.status === 'Present'
                              ? { color: '#15803D' }
                              : rec.status === 'Absent'
                              ? { color: '#DC2626' }
                              : { color: '#B45309' },
                          ]}
                        >
                          {rec.status}
                        </Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </>
            ) : (
              <>
                {/* Yearly Summary Strip */}
                <View style={[styles.liveStatsRow, { paddingHorizontal: 0 }]}>
                  <View style={[styles.statPill, { backgroundColor: '#DCFCE7' }]}>
                    <Text style={[styles.statPillNum, { color: '#15803D' }]}>
                      {activeModalYearlyReport?.presentDays}
                    </Text>
                    <Text style={[styles.statPillLabel, { color: '#15803D' }]}>
                      Annual P
                    </Text>
                  </View>

                  <View style={[styles.statPill, { backgroundColor: '#FEE2E2' }]}>
                    <Text style={[styles.statPillNum, { color: '#DC2626' }]}>
                      {activeModalYearlyReport?.absentDays}
                    </Text>
                    <Text style={[styles.statPillLabel, { color: '#DC2626' }]}>
                      Annual A
                    </Text>
                  </View>

                  <View style={[styles.statPill, { backgroundColor: '#FEF3C7' }]}>
                    <Text style={[styles.statPillNum, { color: '#B45309' }]}>
                      {activeModalYearlyReport?.leaveDays}
                    </Text>
                    <Text style={[styles.statPillLabel, { color: '#B45309' }]}>
                      Annual L
                    </Text>
                  </View>

                  <View style={[styles.statPill, { backgroundColor: '#E0F2FE' }]}>
                    <Text style={[styles.statPillNum, { color: '#0369A1' }]}>
                      {activeModalYearlyReport?.attendancePercentage}%
                    </Text>
                    <Text style={[styles.statPillLabel, { color: '#0369A1' }]}>
                      Yearly %
                    </Text>
                  </View>
                </View>

                <Text style={[styles.presetHeading, { marginTop: 12 }]}>
                  MONTH-BY-MONTH BREAKDOWN ({selectedYear}):
                </Text>

                <ScrollView
                  style={{ maxHeight: 280, marginVertical: 6 }}
                  showsVerticalScrollIndicator={false}
                >
                  {activeModalYearlyReport?.monthlyBreakdown.map((mb) => (
                    <View key={mb.monthKey} style={styles.modalLogRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.modalLogDate}>
                          🗓️ {mb.monthLabel} ({mb.totalDays} days)
                        </Text>
                        <Text style={styles.modalLogRemark}>
                          Present: {mb.presentDays} • Absent: {mb.absentDays} •
                          Leave: {mb.leaveDays}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.recordStatusPill,
                          mb.percentage >= 85
                            ? styles.pillPresent
                            : mb.percentage >= 75
                            ? styles.pillLeave
                            : styles.pillAbsent,
                        ]}
                      >
                        <Text
                          style={[
                            styles.recordStatusPillText,
                            mb.percentage >= 85
                              ? { color: '#15803D' }
                              : mb.percentage >= 75
                              ? { color: '#B45309' }
                              : { color: '#DC2626' },
                          ]}
                        >
                          {mb.percentage}%
                        </Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </>
            )}

            {/* Guardian Contact Actions (for Teacher / Admin) */}
            {!isReadOnly && activeModalMonthlyReport?.guardianMobile ? (
              <View style={styles.guardianActionRow}>
                <TouchableOpacity
                  style={[styles.guardianBtn, { backgroundColor: '#059669' }]}
                  onPress={() =>
                    handleCallGuardian(activeModalMonthlyReport.guardianMobile)
                  }
                >
                  <Text style={styles.guardianBtnText}>📞 Call Guardian</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.guardianBtn, { backgroundColor: '#25D366' }]}
                  onPress={() =>
                    handleWhatsAppGuardian(
                      activeModalMonthlyReport.guardianMobile,
                      activeModalMonthlyReport.studentName
                    )
                  }
                >
                  <Text style={styles.guardianBtnText}>
                    💬 WhatsApp Guardian
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
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
    backgroundColor: '#0F4433',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
  headerRightBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  headerRightBadgeText: {
    color: '#FDE68A',
    fontSize: 10.5,
    fontWeight: '800',
  },
  modeTabsBar: {
    flexDirection: 'row',
    backgroundColor: '#0A2E22',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  },
  modeTabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  modeTabBtnActive: {
    backgroundColor: '#10B981',
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  modeTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  studentFocusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    borderBottomWidth: 1,
    borderBottomColor: '#A7F3D0',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  studentFocusLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 0.5,
  },
  studentFocusName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#064E3B',
    marginTop: 1,
  },
  clearStudentFocusBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#6EE7B7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  clearStudentFocusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  darjaFilterWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  darjaScrollContent: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  darjaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  darjaChipActive: {
    backgroundColor: '#0F4433',
    borderColor: '#D4AF37',
  },
  darjaChipIcon: {
    fontSize: 14,
    marginRight: 5,
  },
  darjaChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  darjaChipTextActive: {
    color: '#FFFFFF',
  },
  loaderBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  dateSelectorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 14,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateArrowBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  dateArrowText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F4433',
  },
  dateCenterBox: {
    alignItems: 'center',
    flex: 1,
  },
  dateRowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateMainLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  todayBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  todayBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#15803D',
  },
  dateSubLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  jumpTodayBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  jumpTodayBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  liveStatsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    marginTop: 10,
  },
  statPill: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  statPillNum: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  statPillLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    marginTop: 1,
  },
  controlsBar: {
    paddingHorizontal: 14,
    marginTop: 10,
    marginBottom: 6,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 0,
  },
  clearSearchIcon: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '700',
    padding: 4,
  },
  bulkBtnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  bulkLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginRight: 4,
  },
  bulkPresentBtn: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  bulkPresentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  bulkAbsentBtn: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  bulkAbsentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  bulkLeaveBtn: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  bulkLeaveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  markListContent: {
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 16,
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  studentTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPresent: {
    backgroundColor: '#DCFCE7',
  },
  avatarAbsent: {
    backgroundColor: '#FEE2E2',
  },
  avatarLeave: {
    backgroundColor: '#FEF3C7',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  nameHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  studentNameText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  rollBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rollBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
  },
  fatherText: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  statusButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  statusChoiceBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  statusChoicePresentActive: {
    backgroundColor: '#059669',
    borderColor: '#047857',
  },
  statusChoiceAbsentActive: {
    backgroundColor: '#DC2626',
    borderColor: '#B91C1C',
  },
  statusChoiceLeaveActive: {
    backgroundColor: '#D97706',
    borderColor: '#B45309',
  },
  statusChoiceText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  statusChoiceTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  cardBottomMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  remarkTriggerBtn: {
    flex: 1,
    marginRight: 8,
  },
  remarkTriggerText: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
  },
  miniReportBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  miniReportBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  saveFooterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 6,
  },
  saveFooterTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  saveFooterSub: {
    fontSize: 11.5,
    color: '#059669',
    fontWeight: '700',
    marginTop: 1,
  },
  saveBtn: {
    backgroundColor: '#0F4433',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  historySubHeader: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
  },
  historySegmentBox: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 3,
  },
  historySegmentBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  historySegmentBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  historySegmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  historySegmentTextActive: {
    color: '#0F4433',
    fontWeight: '800',
  },
  statusFilterPillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  statusFilterChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  statusFilterChipActive: {
    backgroundColor: '#0F4433',
    borderColor: '#0F4433',
  },
  statusFilterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  statusFilterChipTextActive: {
    color: '#FFFFFF',
  },
  historyListContent: {
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 24,
  },
  sessionHistoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sessionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionDateTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  sessionDarjaSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  sessionPctBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  pctGood: {
    backgroundColor: '#DCFCE7',
  },
  pctWarn: {
    backgroundColor: '#FEF3C7',
  },
  pctLow: {
    backgroundColor: '#FEE2E2',
  },
  sessionPctText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  sessionProgressTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 10,
  },
  sessionProgressFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 3,
  },
  sessionFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionCountsGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  sessionCountPresent: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#15803D',
  },
  sessionCountAbsent: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#DC2626',
  },
  sessionCountLeave: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#B45309',
  },
  sessionEditBtn: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  sessionEditBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F4433',
  },
  recordLogCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  recordLogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recordStudentName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  recordRollNo: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
  },
  recordMetaText: {
    fontSize: 11.5,
    color: '#475569',
    marginTop: 3,
  },
  recordRemarkText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 3,
    fontStyle: 'italic',
  },
  recordStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginLeft: 8,
  },
  pillPresent: {
    backgroundColor: '#DCFCE7',
  },
  pillAbsent: {
    backgroundColor: '#FEE2E2',
  },
  pillLeave: {
    backgroundColor: '#FEF3C7',
  },
  recordStatusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  monthlyScrollContent: {
    padding: 14,
    paddingBottom: 30,
  },
  monthPickerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  monthMainTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  monthSubTitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  monthlyHeroCard: {
    backgroundColor: '#0F4433',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },
  monthlyHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthlyHeroTag: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#86EFAC',
    letterSpacing: 0.7,
  },
  monthlyHeroBigPct: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  monthlyHeroSub: {
    fontSize: 12,
    color: '#D1FAE5',
  },
  monthlyHeroRightBox: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
  },
  monthlyHeroDaysNum: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FDE68A',
  },
  monthlyHeroDaysLabel: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  monthlyHeroDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 14,
  },
  monthlyTotalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  monthlyTotalItem: {
    alignItems: 'center',
  },
  monthlyTotalValPresent: {
    fontSize: 18,
    fontWeight: '800',
    color: '#86EFAC',
  },
  monthlyTotalValAbsent: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FCA5A5',
  },
  monthlyTotalValLeave: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FDE68A',
  },
  monthlyTotalLabel: {
    fontSize: 11,
    color: '#E2E8F0',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  sectionCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionCardSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 12,
  },
  darjaReportRow: {
    marginBottom: 12,
  },
  darjaReportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  darjaReportName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  darjaReportPct: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F4433',
  },
  darjaBarTrack: {
    height: 7,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  darjaBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionMainHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSubHeading: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  studentMonthlyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  studentMonthlyTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthlyPctCircle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 10,
  },
  monthlyPctCircleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  monthlyMiniCountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  miniStatBox: {
    alignItems: 'center',
    flex: 1,
  },
  miniStatLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
  },
  miniStatVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  cardTapFooter: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    alignItems: 'flex-end',
  },
  cardTapFooterText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#059669',
  },
  inlineLogCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inlineLogHeading: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0F4433',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12.5,
    color: '#059669',
    fontWeight: '600',
    marginTop: 2,
  },
  modalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
  },
  remarkTextInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 14,
  },
  presetHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  presetChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  presetChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetChipActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#059669',
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  presetChipTextActive: {
    color: '#0F4433',
    fontWeight: '800',
  },
  modalPrimaryBtn: {
    backgroundColor: '#0F4433',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  modalLogRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalLogDate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalLogRemark: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  guardianActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  guardianBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  guardianBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
