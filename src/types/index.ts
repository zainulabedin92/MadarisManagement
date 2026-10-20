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

export interface Student {
  _id?: string;
  id?: string;
  firstName: string;
  lastName: string;
  fatherName: string;
  cnic: string;
  guardianMobile: string;
  guardianEmail: string;
  address: string;
  city: string;
  enrollmentProgram: string;
  picture?: string;
  status?: 'pending' | 'approved' | string;
  role?: 'student' | 'superadmin' | 'admin' | string;
  createdAt?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  student?: Student;
  students?: Student[];
  token?: string;
  role?: string;
  error?: string;
}

export type RootStackParamList = {
  LoginPinPage: undefined;
  RegisterPage: undefined;
  AdminPendingPage: undefined;
  DashboardScreen: { userName?: string; role?: string } | undefined;
  DashboardPage: { userName?: string; role?: string } | undefined;
  SuperAdminDashboard: { userName?: string; role?: string } | undefined;
  StudentsListScreen: { filterDarja?: string } | undefined;
};
