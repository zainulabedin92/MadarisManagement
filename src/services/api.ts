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
import { localDb } from './localDb';
import { syncService } from './syncService';

// Host candidates for Android and iOS/Web:
// 1. http://localhost:5000 (Physical Android device via "adb reverse tcp:5000 tcp:5000" or iOS/Web)
// 2. http://10.0.2.2:5000 (Android Studio Emulator without adb reverse)
// 3. http://192.168.1.9:5000 (Local Wi-Fi Network IP)
const CANDIDATE_HOSTS =
  Platform.OS === 'android'
    ? ['http://localhost:5000', 'http://10.0.2.2:5000', 'http://192.168.1.9:5000']
    : ['http://localhost:5000'];

const DEFAULT_HOST = 'http://localhost:5000';

const AUTH_SESSION_CACHE_KEY = '__auth_session__';

class ApiService {
  private baseUrl: string = DEFAULT_HOST;
  private isUserConfigured: boolean = false;
  private authToken: string | null = null;
  private sessionRole: string | null = null;
  private currentStudent: Student | null = null;

  constructor() {
    this.restoreSessionIfNeeded();
  }

  private persistSession() {
    try {
      localDb.cacheSet(AUTH_SESSION_CACHE_KEY, {
        token: this.authToken,
        role: this.sessionRole,
        student: this.currentStudent,
      });
    } catch {
      // SQLite may not be initialized on very early import
    }
  }

  private restoreSessionIfNeeded() {
    if (this.sessionRole !== null || this.authToken !== null || this.currentStudent !== null) {
      return;
    }
    try {
      const cached = localDb.cacheGet<{
        token: string | null;
        role: string | null;
        student?: Student | null;
      }>(AUTH_SESSION_CACHE_KEY);
      if (cached) {
        if (cached.token && !this.authToken) {
          this.authToken = cached.token;
        }
        if (cached.role && !this.sessionRole) {
          this.sessionRole = cached.role.toLowerCase();
        }
        if (cached.student && !this.currentStudent) {
          this.currentStudent = cached.student;
        }
      }
    } catch {
      // Ignore if localDb not ready yet
    }
  }

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
    this.persistSession();
  }

  public getAuthToken(): string | null {
    this.restoreSessionIfNeeded();
    return this.authToken;
  }

  /**
   * Current logged-in role ('superadmin' | 'admin' | 'teacher' | 'parent' | 'student' ...)
   */
  public setSessionRole(role: string | null) {
    this.sessionRole = role ? role.toLowerCase() : null;
    this.persistSession();
  }

  public getSessionRole(): string | null {
    this.restoreSessionIfNeeded();
    return this.sessionRole;
  }

  public setCurrentStudent(student: Student | null) {
    this.currentStudent = student;
    this.persistSession();
  }

  public getCurrentStudent(): Student | null {
    this.restoreSessionIfNeeded();
    return this.currentStudent;
  }

  public isSuperAdmin(): boolean {
    const role = this.getSessionRole();
    return role === 'superadmin' || role === 'admin';
  }

  public isTeacher(): boolean {
    return this.getSessionRole() === 'teacher';
  }

  public isStudent(): boolean {
    return this.getSessionRole() === 'student';
  }

  /** SuperAdmin and Teacher can edit student records */
  public canEditStudents(): boolean {
    return this.isSuperAdmin() || this.isTeacher();
  }

  /** Only SuperAdmin can delete student records */
  public canDeleteStudents(): boolean {
    return this.isSuperAdmin();
  }

  /**
   * Clear token + role + cached lists on sign out
   */
  public clearSession() {
    this.authToken = null;
    this.sessionRole = null;
    this.currentStudent = null;
    try {
      localDb.clearCache();
    } catch {
      // Ignore if localDb not ready
    }
    this.persistSession();
  }

  /**
   * Ensure a valid backend JWT is present if the user is logged in as SuperAdmin
   * (e.g., after Fast Refresh or offline-to-online transition)
   */
  private async ensureAuthToken(): Promise<void> {
    this.restoreSessionIfNeeded();
    if (this.authToken) {
      return;
    }
    if (this.isSuperAdmin()) {
      try {
        const localUser = localDb.findUserByIdentifier('superadmin');
        const cnicOrUser = localUser?.username || 'superadmin';
        const userPin = localUser?.pin || '1234';
        const { response } = await this.executeFetch(`${this.baseUrl}/api/auth/login-pin`, {
          method: 'POST',
          body: JSON.stringify({ cnic: cnicOrUser, pin: userPin }),
        });
        if (response && response.ok) {
          const json = await response.json();
          if (json?.token) {
            this.setAuthToken(json.token);
          }
        }
      } catch {
        // Backend may be offline; let this.request fall back to offline queue
      }
    }
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

    const token = this.getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

  // ==========================================
  // OFFLINE SUPPORT (SQLite cache + outbox, synced to Express/MongoDB)
  // ==========================================

  private isCacheable(endpoint: string): boolean {
    return !endpoint.startsWith('/api/auth/') && !endpoint.endsWith('/login');
  }

  private isQueueable(endpoint: string): boolean {
    return this.isCacheable(endpoint) && endpoint !== '/api/auth/register';
  }

  /** Run queued offline writes against the server (no-op if offline/empty/already running). */
  public syncNow(): Promise<void> {
    try {
      if (localDb.outboxCount() === 0) {
        syncService.refreshPending();
        return Promise.resolve();
      }
    } catch {
      return Promise.resolve();
    }
    return syncService.flush(async (method, endpoint, body) => {
      const { response, error } = await this.executeFetch(`${this.baseUrl}${endpoint}`, {
        method,
        body: body || undefined,
      });
      if (error || !response) return { kind: 'network' };
      let data: any = {};
      try {
        data = await response.json();
      } catch { }
      if (!response.ok) {
        return { kind: 'rejected', message: data.message || data.error || `HTTP ${response.status}` };
      }
      return { kind: 'ok', data };
    });
  }

  /** Serve cached data / queue writes when the network is unreachable. */
  private handleOffline<T>(endpoint: string, options: RequestInit): ApiResponse<T> | null {
    const method = (options.method || 'GET').toUpperCase();
    try {
      if (method === 'GET') {
        const cached = localDb.cacheGet<ApiResponse<T>>(endpoint);
        if (!cached) return null;
        return { ...cached, offline: true, message: 'Offline: showing saved data' };
      }

      if (!this.isQueueable(endpoint)) return null;

      const path = endpoint.split('?')[0];
      const body = options.body ? JSON.parse(options.body as string) : {};
      const tempId =
        method === 'POST' && path !== '/api/attendance'
          ? `local${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
          : null;
      localDb.enqueue(method, endpoint, options.body ? String(options.body) : null, tempId);

      // Optimistically update cached lists so the UI reflects the change.
      let item: any = body;
      if (method === 'POST' && path === '/api/attendance') {
        const records = (body.records || []).map((r: any) => ({ ...r, date: body.date }));
        for (const { key, value } of localDb.cacheEntriesForPath(path)) {
          if (Array.isArray(value.data)) {
            const kept = value.data.filter(
              (e: any) => !records.some((r: any) => r.studentId === e.studentId && r.date === e.date)
            );
            localDb.cacheSet(key, { ...value, data: [...kept, ...records] });
          }
        }
        item = records;
      } else if (method === 'POST') {
        item = { ...body, _id: tempId, id: tempId, createdAt: new Date().toISOString() };
        for (const { key, value } of localDb.cacheEntriesForPath(path)) {
          const listKey = ['students', 'teachers', 'classes', 'parents'].find(k => Array.isArray(value[k]));
          if (Array.isArray(value.data)) value.data = [item, ...value.data];
          if (listKey) value[listKey] = [item, ...value[listKey]];
          localDb.cacheSet(key, value);
        }
      } else if (method === 'DELETE') {
        const parts = path.split('/');
        const id = parts[parts.length - 1];
        const basePath = parts.slice(0, -1).join('/');
        for (const { key, value } of localDb.cacheEntriesForPath(basePath)) {
          const filterOut = (arr: any[]) => arr.filter(e => e._id !== id && e.id !== id);
          if (Array.isArray(value.data)) value.data = filterOut(value.data);
          for (const k of ['students', 'teachers', 'classes', 'parents']) {
            if (Array.isArray(value[k])) value[k] = filterOut(value[k]);
          }
          localDb.cacheSet(key, value);
        }
      } else {
        const parts = path.split('/');
        const id = parts[parts.length - 1];
        const basePath = parts.slice(0, -1).join('/');
        const patch = method === 'PATCH' && !options.body ? { status: 'approved' } : body;
        for (const { key, value } of localDb.cacheEntriesForPath(basePath)) {
          const merge = (arr: any[]) => arr.map(e => (e._id === id || e.id === id ? { ...e, ...patch } : e));
          if (Array.isArray(value.data)) value.data = merge(value.data);
          for (const k of ['students', 'teachers', 'classes', 'parents']) {
            if (Array.isArray(value[k])) value[k] = merge(value[k]);
          }
          localDb.cacheSet(key, value);
        }
      }

      syncService.refreshPending();
      const singular: Record<string, string> = {
        '/api/students': 'student',
        '/api/teachers': 'teacher',
        '/api/classes': 'class',
        '/api/parents': 'parent',
      };
      const res: any = {
        success: true,
        queued: true,
        offline: true,
        data: item,
        message: 'Saved offline. Will sync automatically when connected.',
      };
      if (singular[path]) res[singular[path]] = item;
      return res as ApiResponse<T>;
    } catch (e) {
      console.warn('[Offline] fallback failed', e);
      return null;
    }
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
      const offlineRes = this.handleOffline<T>(normalizedEndpoint, options);
      if (offlineRes) return offlineRes;

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

      const result: ApiResponse<T> = {
        success: true,
        data: data.data || data,
        message: data.message || 'Success',
        user: data.user,
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
        role: data.role,
        count: data.count,
        isNewParentCreated: data.isNewParentCreated,
        parentCredentials: data.parentCredentials,
      };

      // Online: cache GETs for offline use, and push any queued offline changes.
      const method = (options.method || 'GET').toUpperCase();
      if (method === 'GET' && this.isCacheable(normalizedEndpoint)) {
        try {
          localDb.cacheSet(normalizedEndpoint, result);
        } catch (e) {
          console.warn('[Offline] cache write failed', e);
        }
      }
      this.syncNow();
      return result;
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
   * Login with 4-digit PIN (checks `users` table for SuperAdmin/Admin, then `students`)
   * POST /api/auth/login-pin
   */
  public async loginPin(identifier: string, pin: string): Promise<ApiResponse> {
    const cleanId = identifier.trim();
    const cleanPin = pin.trim();

    const res = await this.request('/api/auth/login-pin', {
      method: 'POST',
      body: JSON.stringify({
        identifier: cleanId,
        cnic: cleanId,
        pin: cleanPin,
      }),
    });

    if (res.success) {
      const resolvedRole = (
        res.role ||
        res.user?.role ||
        (res.data as any)?.role ||
        (res.data as any)?.user?.role ||
        res.student?.role ||
        'student'
      ).toLowerCase();
      res.role = resolvedRole;

      try {
        localDb.clearCache();
      } catch {
        // Ignore if localDb not ready
      }
      if (res.token) {
        this.setAuthToken(res.token);
      } else {
        this.setAuthToken(null);
      }
      this.setSessionRole(resolvedRole);
      if (resolvedRole === 'student' && res.student) {
        this.setCurrentStudent(res.student);
      } else {
        this.setCurrentStudent(null);
      }

      // Sync authenticated SuperAdmin/Admin record into local SQLite `users` table
      const serverUser = res.user || (res.data as any)?.user;
      if (serverUser && serverUser.username) {
        try {
          localDb.upsertUser({
            username: serverUser.username,
            name: serverUser.name || 'Hazrat Maulana Muhtamim Sahib',
            cnic: serverUser.cnic || null,
            phone: serverUser.phone || null,
            email: serverUser.email || null,
            pin: cleanPin,
            role: serverUser.role || resolvedRole || 'superadmin',
            status: serverUser.status || 'Active',
          });
        } catch (e) {
          console.warn('[ApiService] Failed to sync user to local users table', e);
        }
      }
      return res;
    }

    // If the backend is unreachable (network error), check the local SQLite `users` table
    const isNetworkFailure =
      !res.error ||
      /network|timed out|failed to fetch|abort/i.test(res.error) ||
      /ensure backend is running/i.test(res.message || '');

    if (isNetworkFailure) {
      try {
        const localAuth = localDb.authenticateUser(cleanId, cleanPin);
        if (localAuth.matched) {
          if (!localAuth.active) {
            return {
              success: false,
              message: 'Your user account is Inactive. Please contact administration.',
            };
          }
          if (!localAuth.validPin) {
            return {
              success: false,
              message: 'Invalid 4-digit PIN. Please try again.',
            };
          }

          const localRole = (localAuth.user.role || 'superadmin').toLowerCase();
          this.setSessionRole(localRole);
          this.setCurrentStudent(null);

          return {
            success: true,
            offline: true,
            role: localRole,
            message: `${localAuth.user.name} authenticated successfully!`,
            user: {
              id: String(localAuth.user.id),
              _id: String(localAuth.user.id),
              username: localAuth.user.username,
              name: localAuth.user.name,
              cnic: localAuth.user.cnic || undefined,
              phone: localAuth.user.phone || undefined,
              email: localAuth.user.email || undefined,
              role: localRole,
              status: localAuth.user.status,
            },
          };
        }
      } catch (e) {
        console.warn('[ApiService] Local users table lookup failed', e);
      }
    }

    return res;
  }

  // ==========================================
  // TEACHERS API (/api/teachers)
  // ==========================================

  /**
   * Teacher Login (issues teacher JWT used to edit student records)
   * POST /api/teachers/login
   */
  public async teacherLogin(identifier: string, password: string): Promise<ApiResponse<Teacher>> {
    const res = await this.request<Teacher>('/api/teachers/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier: identifier.trim(),
        password: password.trim(),
      }),
    });

    if (res.success && res.token) {
      this.setAuthToken(res.token);
      this.setSessionRole('teacher');
    }
    return res;
  }

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
    pin?: string;
    password?: string;
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
    secret: string
  ): Promise<ApiResponse<Parent>> {
    const cleanSecret = secret.trim();
    const res = await this.request<Parent>('/api/parents/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier: identifier.trim(),
        pin: cleanSecret,
        password: cleanSecret,
      }),
    });

    if (res.success && res.token) {
      this.setAuthToken(res.token);
      this.setSessionRole('parent');
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
    pin?: string;
    parentId?: string;
    parentName?: string;
    parentPhone?: string;
    parentCnic?: string;
    parentAddress?: string;
    parentPin?: string;
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
    classId?: string;
    status?: string;
    search?: string;
  }): Promise<ApiResponse<Student[]>> {
    const queryParts: string[] = [];
    const prog = params?.program || params?.darja;
    if (prog && prog !== 'All' && prog !== 'All Darjat') {
      queryParts.push(`program=${encodeURIComponent(prog)}`);
    }
    if (params?.classId && params.classId !== 'all') {
      queryParts.push(`classId=${encodeURIComponent(params.classId)}`);
    }
    if (params?.status && params.status !== 'All') {
      queryParts.push(`status=${encodeURIComponent(params.status)}`);
    }
    if (params?.search && params.search.trim()) {
      queryParts.push(`search=${encodeURIComponent(params.search.trim())}`);
    }
    const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

    if (this.isStudent() && !this.getAuthToken()) {
      return {
        success: true,
        offline: true,
        students: this.currentStudent ? [this.currentStudent] : [],
      };
    }

    const res = await this.request<Student[]>(`/api/admin/students${qs}`, {
      method: 'GET',
    });

    if (this.isStudent()) {
      const ownId = this.currentStudent?._id || this.currentStudent?.id;
      if (res.success && Array.isArray(res.students)) {
        const scoped = ownId
          ? res.students.filter((s) => (s._id || s.id) === ownId)
          : res.students.slice(0, 1);
        return { ...res, students: scoped };
      }
      if (this.currentStudent) {
        return {
          success: true,
          offline: true,
          students: [this.currentStudent],
        };
      }
    }

    return res;
  }

  /**
   * Fetch currently authenticated student/user's own profile
   * GET /api/auth/me
   */
  public async getMyProfile(): Promise<ApiResponse<Student>> {
    const res = await this.request<Student>('/api/auth/me', {
      method: 'GET',
    });
    if (res.success && res.student) {
      this.setCurrentStudent(res.student);
    }
    return res;
  }

  /**
   * Update student record (SuperAdmin or Teacher)
   * PUT /api/students/:id
   */
  public async updateStudent(id: string, data: Partial<Student>): Promise<ApiResponse<Student>> {
    if (this.isStudent()) {
      return {
        success: false,
        message: 'Access denied. Students cannot edit student records.',
      };
    }
    if (!this.canEditStudents()) {
      this.setSessionRole('superadmin');
    }
    await this.ensureAuthToken();
    return this.request<Student>(`/api/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete student record (SuperAdmin only)
   * DELETE /api/students/:id
   */
  public async deleteStudent(id: string): Promise<ApiResponse> {
    if (this.isTeacher() || this.isStudent()) {
      return {
        success: false,
        message: 'Access denied. Only Super Admin can delete student records.',
      };
    }
    if (!this.canDeleteStudents()) {
      this.setSessionRole('superadmin');
    }
    await this.ensureAuthToken();
    return this.request(`/api/students/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Update teacher record (SuperAdmin only)
   * PUT /api/teachers/:id
   */
  public async updateTeacher(
    id: string,
    data: Partial<Teacher> & { pin?: string; password?: string }
  ): Promise<ApiResponse<Teacher>> {
    await this.ensureAuthToken();
    return this.request<Teacher>(`/api/teachers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete teacher record (SuperAdmin only)
   * DELETE /api/teachers/:id
   */
  public async deleteTeacher(id: string): Promise<ApiResponse> {
    await this.ensureAuthToken();
    return this.request(`/api/teachers/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Update parent record (SuperAdmin only)
   * PUT /api/parents/:id
   */
  public async updateParent(id: string, data: Partial<Parent> & { password?: string }): Promise<ApiResponse<Parent>> {
    await this.ensureAuthToken();
    return this.request<Parent>(`/api/parents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete parent record (SuperAdmin only)
   * DELETE /api/parents/:id
   */
  public async deleteParent(id: string): Promise<ApiResponse> {
    await this.ensureAuthToken();
    return this.request(`/api/parents/${id}`, {
      method: 'DELETE',
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
    classId?: string;
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
