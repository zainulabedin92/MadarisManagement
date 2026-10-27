import { Platform } from 'react-native';
import {
  RegisterFormData,
  ApiResponse,
  Student,
  Teacher,
  ClassItem,
  Parent,
  AttendanceRecord,
} from '../types';

// Host candidates for Android and iOS/Web:
// 1. http://localhost:5000 (Physical Android device via "adb reverse tcp:5000 tcp:5000" or iOS/Web)
// 2. http://10.0.2.2:5000 (Android Studio Emulator without adb reverse)
// 3. http://192.168.1.9:5000 (Local Wi-Fi Network IP)
const CANDIDATE_HOSTS =
  Platform.OS === 'android'
    ? ['http://localhost:5000', 'http://10.0.2.2:5000', 'http://192.168.1.9:5000']
    : ['http://localhost:5000'];

const DEFAULT_HOST = 'http://localhost:5000';

class ApiService {
  private baseUrl: string = DEFAULT_HOST;
  private isUserConfigured: boolean = false;
  private authToken: string | null = null;

  public setBaseUrl(url: string) {
    let cleanUrl = url.trim();
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.slice(0, -1);
    }
    this.baseUrl = cleanUrl;
    this.isUserConfigured = true;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setAuthToken(token: string | null) {
    this.authToken = token;
  }

  public getAuthToken(): string | null {
    return this.authToken;
  }

  /**
   * Helper to perform a single fetch with timeout
   */
  private async executeFetch(
    url: string,
    options: RequestInit = {}
  ): Promise<{ response?: Response; error?: any }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {}),
      ...((options.headers as Record<string, string>) || {}),
    };

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers,
      });
      clearTimeout(timeoutId);
      return { response };
    } catch (err: any) {
      clearTimeout(timeoutId);
      return { error: err };
    }
  }

  /**
   * Quick ping to test host connectivity
   */
  private async pingHost(host: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${host}/`, {
        signal: controller.signal,
        method: 'GET',
      });
      clearTimeout(timeoutId);
      return res.ok || res.status < 500;
    } catch {
      return false;
    }
  }

  /**
   * Try other candidate hosts if current host fails with a network error
   */
  private async findWorkingHost(): Promise<string | null> {
    for (const host of CANDIDATE_HOSTS) {
      if (host === this.baseUrl) continue;
      const works = await this.pingHost(host);
      if (works) {
        console.log(`[ApiService] Discovered reachable host: ${host}`);
        this.baseUrl = host;
        return host;
      }
    }
    return null;
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    let url = `${this.baseUrl}${normalizedEndpoint}`;

    let { response, error } = await this.executeFetch(url, options);

    // If initial request failed with a network error, try candidate hosts automatically
    if (error && !this.isUserConfigured) {
      console.warn(`[ApiService] Connection to ${this.baseUrl} failed. Checking alternative hosts...`);
      const discovered = await this.findWorkingHost();
      if (discovered) {
        url = `${discovered}${normalizedEndpoint}`;
        const retryResult = await this.executeFetch(url, options);
        response = retryResult.response;
        error = retryResult.error;
      }
    }

    if (error) {
      console.error(`API Error [${endpoint}]:`, error);
      let errorMsg = error.message || 'Network request failed';
      if (error.name === 'AbortError') {
        errorMsg = 'Request timed out';
      }

      const guidance =
        Platform.OS === 'android'
          ? ` Ensure backend is running at ${this.baseUrl}.\n(For USB debugging, ensure 'adb reverse tcp:5000 tcp:5000' is run)`
          : ` Ensure backend is running at ${this.baseUrl}`;

      return {
        success: false,
        message: `${errorMsg}.${guidance}`,
        error: errorMsg,
      };
    }

    if (!response) {
      return {
        success: false,
        message: 'No response received from server',
      };
    }

    try {
      const contentType = response.headers.get('content-type');
      let data: any = {};
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: text };
      }

      if (!response.ok) {
        return {
          success: false,
          message: data.message || data.error || `HTTP ${response.status} Error`,
          error: data.error || data.message,
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message || 'Success',
        student: data.student,
        students: data.students,
        teacher: data.teacher,
        teachers: data.teachers,
        class: data.class,
        classes: data.classes,
        parent: data.parent,
        parents: data.parents,
        children: data.children,
        token: data.token,
        count: data.count,
        isNewParentCreated: data.isNewParentCreated,
        parentCredentials: data.parentCredentials,
      };
    } catch (parseErr: any) {
      return {
        success: false,
        message: 'Failed to parse server response',
        error: parseErr.message,
      };
    }
  }

  // ==========================================
  // AUTHENTICATION
  // ==========================================

  /**
   * Register a new student (Self-registration flow)
   * POST /api/auth/register
   */
  public async register(formData: RegisterFormData): Promise<ApiResponse<Student>> {
    return this.request<Student>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        fatherName: formData.fatherName.trim(),
        cnic: formData.cnic.trim(),
        guardianMobile: formData.guardianMobile.trim(),
        guardianEmail: formData.guardianEmail.trim(),
        pin: formData.pin.trim(),
        confirmPin: formData.confirmPin?.trim() || formData.pin.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        enrollmentProgram: formData.enrollmentProgram.trim(),
        picture: formData.picture || null,
      }),
    });
  }

  /**
   * Login with 4-digit PIN (Student or Admin)
   * POST /api/auth/login-pin
   */
  public async loginPin(identifier: string, pin: string): Promise<ApiResponse> {
    return this.request('/api/auth/login-pin', {
      method: 'POST',
      body: JSON.stringify({
        cnic: identifier.trim(),
        pin: pin.trim(),
      }),
    });
  }

  // ==========================================
  // TEACHERS API (/api/teachers)
  // ==========================================

  /**
   * Fetch all teachers with optional role, status, and search filters
   * GET /api/teachers
   */
  public async getTeachers(params?: {
    role?: string;
    status?: string;
    search?: string;
  }): Promise<ApiResponse<Teacher[]>> {
    const queryParts: string[] = [];
    if (params?.role && params.role !== 'All') {
      queryParts.push(`role=${encodeURIComponent(params.role)}`);
    }
    if (params?.status && params.status !== 'All') {
      queryParts.push(`status=${encodeURIComponent(params.status)}`);
    }
    if (params?.search && params.search.trim()) {
      queryParts.push(`search=${encodeURIComponent(params.search.trim())}`);
    }
    const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

    return this.request<Teacher[]>(`/api/teachers${qs}`, {
      method: 'GET',
    });
  }

  /**
   * Get teacher by ID
   * GET /api/teachers/:id
   */
  public async getTeacherById(id: string): Promise<ApiResponse<Teacher>> {
    return this.request<Teacher>(`/api/teachers/${id}`, {
      method: 'GET',
    });
  }

  /**
   * Create a new teacher
   * POST /api/teachers
   */
  public async createTeacher(teacherData: {
    name: string;
    phone: string;
    email?: string;
    cnic?: string;
    role?: string;
    status?: string;
  }): Promise<ApiResponse<Teacher>> {
    return this.request<Teacher>('/api/teachers', {
      method: 'POST',
      body: JSON.stringify(teacherData),
    });
  }

  // ==========================================
  // CLASSES API (/api/classes)
  // ==========================================

  /**
   * Fetch all active classes
   * GET /api/classes
   */
  public async getClasses(params?: {
    status?: string;
    academicYear?: string;
  }): Promise<ApiResponse<ClassItem[]>> {
    const queryParts: string[] = [];
    if (params?.status && params.status !== 'All') {
      queryParts.push(`status=${encodeURIComponent(params.status)}`);
    }
    if (params?.academicYear && params.academicYear !== 'All') {
      queryParts.push(`academicYear=${encodeURIComponent(params.academicYear)}`);
    }
    const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

    return this.request<ClassItem[]>(`/api/classes${qs}`, {
      method: 'GET',
    });
  }

  /**
   * Get class by ID
   * GET /api/classes/:id
   */
  public async getClassById(id: string): Promise<ApiResponse<ClassItem>> {
    return this.request<ClassItem>(`/api/classes/${id}`, {
      method: 'GET',
    });
  }

  /**
   * Create a new class
   * POST /api/classes
   */
  public async createClass(classData: {
    name: string;
    section?: string;
    roomNumber?: string;
    classTeacher?: string | null;
    academicYear?: string;
    status?: string;
  }): Promise<ApiResponse<ClassItem>> {
    return this.request<ClassItem>('/api/classes', {
      method: 'POST',
      body: JSON.stringify(classData),
    });
  }

  /**
   * Update a class
   * PUT /api/classes/:id
   */
  public async updateClass(
    id: string,
    classData: Partial<ClassItem>
  ): Promise<ApiResponse<ClassItem>> {
    return this.request<ClassItem>(`/api/classes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(classData),
    });
  }

  // ==========================================
  // PARENTS API (/api/parents)
  // ==========================================

  /**
   * Parent Login
   * POST /api/parents/login
   */
  public async parentLogin(
    identifier: string,
    password: string
  ): Promise<ApiResponse<Parent>> {
    const res = await this.request<Parent>('/api/parents/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier: identifier.trim(),
        password: password.trim(),
      }),
    });

    if (res.success && res.token) {
      this.setAuthToken(res.token);
    }
    return res;
  }

  /**
   * Get My Children (Parent Portal Protected)
   * GET /api/parents/my-children
   */
  public async getMyChildren(customToken?: string): Promise<ApiResponse<Student[]>> {
    const headers: Record<string, string> = {};
    if (customToken) {
      headers.Authorization = `Bearer ${customToken}`;
    }
    return this.request<Student[]>('/api/parents/my-children', {
      method: 'GET',
      headers,
    });
  }

  /**
   * Get Parent Profile (Parent Portal Protected)
   * GET /api/parents/profile
   */
  public async getParentProfile(customToken?: string): Promise<ApiResponse<Parent>> {
    const headers: Record<string, string> = {};
    if (customToken) {
      headers.Authorization = `Bearer ${customToken}`;
    }
    return this.request<Parent>('/api/parents/profile', {
      method: 'GET',
      headers,
    });
  }

  /**
   * Get all registered parents (Admin)
   * GET /api/parents
   */
  public async getAllParents(search?: string): Promise<ApiResponse<Parent[]>> {
    const qs = search && search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
    return this.request<Parent[]>(`/api/parents${qs}`, {
      method: 'GET',
    });
  }

  // ==========================================
  // STUDENTS API (/api/students & /api/admin)
  // ==========================================

  /**
   * Register Student (Admin Flow with Class Assignment & Parent Linking)
   * POST /api/students
   */
  public async registerStudentAdminFlow(studentData: {
    fullName: string;
    fatherName: string;
    dob?: string;
    gender?: string;
    bFormNo?: string;
    admissionDate?: string;
    classId: string;
    status?: string;
    parentId?: string;
    parentName?: string;
    parentPhone?: string;
    parentCnic?: string;
    parentAddress?: string;
    parentPassword?: string;
  }): Promise<ApiResponse<Student>> {
    return this.request<Student>('/api/students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
  }

  /**
   * Fetch all registered students with class and parent populated
   * GET /api/students
   */
  public async getStudents(params?: {
    classId?: string;
    status?: string;
    search?: string;
  }): Promise<ApiResponse<Student[]>> {
    const queryParts: string[] = [];
    if (params?.classId) {
      queryParts.push(`classId=${encodeURIComponent(params.classId)}`);
    }
    if (params?.status && params.status !== 'All') {
      queryParts.push(`status=${encodeURIComponent(params.status)}`);
    }
    if (params?.search && params.search.trim()) {
      queryParts.push(`search=${encodeURIComponent(params.search.trim())}`);
    }
    const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

    return this.request<Student[]>(`/api/students${qs}`, {
      method: 'GET',
    });
  }

  /**
   * Fetch student details by ID
   * GET /api/students/:id
   */
  public async getStudentById(id: string): Promise<ApiResponse<Student>> {
    return this.request<Student>(`/api/students/${id}`, {
      method: 'GET',
    });
  }

  /**
   * Fetch list of pending students for admin
   * GET /api/admin/pending
   */
  public async getPendingStudents(): Promise<ApiResponse<Student[]>> {
    return this.request<Student[]>('/api/admin/pending', {
      method: 'GET',
    });
  }

  /**
   * Approve student registration
   * PATCH /api/admin/approve/:id
   */
  public async approveStudent(id: string): Promise<ApiResponse> {
    return this.request(`/api/admin/approve/${id}`, {
      method: 'PATCH',
    });
  }

  /**
   * Fetch all registered students for admin filters (Legacy / Admin)
   * GET /api/admin/students
   */
  public async getAllStudents(params?: {
    program?: string;
    darja?: string;
    status?: string;
    search?: string;
  }): Promise<ApiResponse<Student[]>> {
    const queryParts: string[] = [];
    const prog = params?.program || params?.darja;
    if (prog && prog !== 'All' && prog !== 'All Darjat') {
      queryParts.push(`program=${encodeURIComponent(prog)}`);
    }
    if (params?.status && params.status !== 'All') {
      queryParts.push(`status=${encodeURIComponent(params.status)}`);
    }
    if (params?.search && params.search.trim()) {
      queryParts.push(`search=${encodeURIComponent(params.search.trim())}`);
    }
    const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

    return this.request<Student[]>(`/api/admin/students${qs}`, {
      method: 'GET',
    });
  }

  // ==========================================
  // ATTENDANCE API (/api/attendance)
  // ==========================================

  /**
   * Save / Submit daily attendance batch
   * POST /api/attendance
   */
  public async saveAttendance(payload: {
    date: string;
    darja?: string;
    records: AttendanceRecord[];
  }): Promise<ApiResponse<AttendanceRecord[]>> {
    return this.request<AttendanceRecord[]>('/api/attendance', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Get attendance records with optional filters (date, month, darja, studentId)
   * GET /api/attendance
   */
  public async getAttendance(params?: {
    date?: string;
    month?: string; // YYYY-MM
    darja?: string;
    studentId?: string;
  }): Promise<ApiResponse<AttendanceRecord[]>> {
    const queryParts: string[] = [];
    if (params?.date) {
      queryParts.push(`date=${encodeURIComponent(params.date)}`);
    }
    if (params?.month) {
      queryParts.push(`month=${encodeURIComponent(params.month)}`);
    }
    if (params?.darja && params.darja !== 'All Darjat' && params.darja !== 'All') {
      queryParts.push(`darja=${encodeURIComponent(params.darja)}`);
    }
    if (params?.studentId) {
      queryParts.push(`studentId=${encodeURIComponent(params.studentId)}`);
    }
    const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

    return this.request<AttendanceRecord[]>(`/api/attendance${qs}`, {
      method: 'GET',
    });
  }
}

export const apiService = new ApiService();
