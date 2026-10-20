import { Alert, Platform } from 'react-native';
import { RegisterFormData, ApiResponse, Student } from '../types';

// Host candidates for Android and iOS/Web:
// 1. http://localhost:5000 (Physical Android device via "adb reverse tcp:5000 tcp:5000" or iOS/Web)
// 2. http://10.0.2.2:5000 (Android Studio Emulator without adb reverse)
// 3. http://192.168.1.9:5000 (Local Wi-Fi Network IP)
const CANDIDATE_HOSTS = Platform.OS === 'android'
  ? ['http://localhost:5000', 'http://10.0.2.2:5000', 'http://192.168.1.9:5000']
  : ['http://localhost:5000'];

const DEFAULT_HOST = 'http://localhost:5000';

class ApiService {
  private baseUrl: string = DEFAULT_HOST;
  private isUserConfigured: boolean = false;

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

  /**
   * Helper to perform a single fetch with timeout
   */
  private async executeFetch(
    url: string,
    options: RequestInit = {}
  ): Promise<{ response?: Response; error?: any }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(options.headers || {}),
        },
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

      const guidance = Platform.OS === 'android'
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
        token: data.token,
      };
    } catch (parseErr: any) {
      return {
        success: false,
        message: 'Failed to parse server response',
        error: parseErr.message,
      };
    }
  }

  /**
   * Register a new student
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
   * Login with 4-digit PIN
   * POST /api/auth/login-pin
   */
  public async loginPin(identifier: string, pin: string): Promise<ApiResponse> {
    return this.request('/api/auth/login-pin', {
      method: 'POST',
      body: JSON.stringify({
        cnic: identifier.trim(), // e.g. CNIC or Mobile
        pin: pin.trim(),
      }),
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
   * Fetch all registered students with optional filters
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
}

export const apiService = new ApiService();
