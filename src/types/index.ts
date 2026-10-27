export interface RegisterFormData {
  firstName: string;
  lastName: string;
  fatherName: string;
  cnic: string;
  guardianMobile: string;
  guardianEmail: string;
  pin: string;
  confirmPin: string;
  address: string;
  city: string;
  enrollmentProgram: string;
  picture: string | null; // URI or Base64 string
}

export interface Teacher {
  _id?: string;
  id?: string;
  name: string;
  phone: string;
  email?: string;
  cnic?: string;
  role:
    | 'Hifz Teacher'
    | 'Nazra Teacher'
    | 'Darse Nizami Teacher'
    | 'Head Teacher'
    | 'Tajweed Teacher'
    | 'General Teacher'
    | string;
  status: 'Active' | 'Inactive' | string;
  createdAt?: string;
}

export interface ClassItem {
  _id?: string;
  id?: string;
  name: string;
  section: string;
  roomNumber?: string;
  classTeacher?: Teacher | string | null;
  academicYear: string;
  status: 'Active' | 'Inactive' | string;
  createdAt?: string;
}

export interface Parent {
  _id?: string;
  id?: string;
  name: string;
  phone: string;
  cnic: string;
  address?: string;
  status: 'Active' | 'Inactive' | string;
  createdAt?: string;
}

export interface Student {
  _id?: string;
  id?: string;
  rollNo?: string;
  registrationNo?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  fatherName: string;
  dob?: string;
  gender?: 'Male' | 'Female' | 'Other' | string;
  bFormNo?: string;
  cnic?: string;
  admissionDate?: string;
  classId?: ClassItem | string;
  parentId?: Parent | string;
  guardianMobile?: string;
  guardianEmail?: string;
  address?: string;
  city?: string;
  enrollmentProgram?: string;
  picture?: string | null;
  pictureUrl?: string | null;
  status?: 'Enrolled' | 'Completed' | 'Suspended' | 'pending' | 'approved' | 'rejected' | string;
  role?: 'student' | 'superadmin' | 'admin' | string;
  createdAt?: string;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Leave';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  fatherName?: string;
  rollNo?: string;
  darja: string;
  guardianMobile?: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  remarks?: string;
  markedBy?: string;
  updatedAt?: string;
}

export interface DailyAttendanceSummary {
  date: string;
  darja?: string;
  total: number;
  present: number;
  absent: number;
  leave: number;
  percentage: number;
}

export interface StudentMonthlyReport {
  studentId: string;
  studentName: string;
  fatherName?: string;
  rollNo?: string;
  darja: string;
  guardianMobile?: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  attendancePercentage: number;
  records: AttendanceRecord[];
}

export interface MonthlyBreakdownItem {
  monthKey: string; // YYYY-MM
  monthLabel: string; // e.g. Oct 2026
  totalDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  percentage: number;
}

export interface StudentYearlyReport {
  studentId: string;
  studentName: string;
  fatherName?: string;
  rollNo?: string;
  darja: string;
  guardianMobile?: string;
  year: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  attendancePercentage: number;
  monthlyBreakdown: MonthlyBreakdownItem[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  student?: Student;
  students?: Student[];
  teacher?: Teacher;
  teachers?: Teacher[];
  class?: ClassItem;
  classes?: ClassItem[];
  parent?: Parent;
  parents?: Parent[];
  children?: Student[];
  token?: string;
  role?: string;
  error?: string;
  count?: number;
  isNewParentCreated?: boolean;
  parentCredentials?: {
    name: string;
    phone: string;
    cnic: string;
    defaultPassword?: string;
    note?: string;
  };
}

export type RootStackParamList = {
  LoginPinPage: undefined;
  RegisterPage: undefined;
  AdminPendingPage: undefined;
  DashboardScreen: { userName?: string; role?: string } | undefined;
  DashboardPage: { userName?: string; role?: string } | undefined;
  SuperAdminDashboard: { userName?: string; role?: string } | undefined;
  StudentsListScreen: { filterDarja?: string } | undefined;
  StudentAddScreen: undefined;
  TeachersListScreen: undefined;
  TeacherAddScreen: undefined;
  ClassesListScreen: undefined;
  ClassAddScreen: undefined;
  ParentsListScreen: undefined;
  ParentPortalScreen: { token?: string; parent?: Parent } | undefined;
  TeacherPortalScreen: { teacher?: Teacher } | undefined;
  AttendanceScreen:
    | {
        initialTab?: 'mark' | 'history' | 'monthly' | 'yearly';
        filterDarja?: string;
        className?: string;
        teacherName?: string;
        studentId?: string;
        studentName?: string;
        role?: 'superadmin' | 'teacher' | 'parent';
        readOnly?: boolean;
      }
    | undefined;
};
