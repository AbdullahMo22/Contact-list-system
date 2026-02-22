import { create } from 'zustand';
import axios from 'axios';
import Swal from "sweetalert2";
// Base API URL
const API_BASE = 'http://localhost:7000/api';

// Axios instance with base config
export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});


apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const message = String(error?.response?.data?.message || error?.message || "").toLowerCase();

    // منع تكرار نفس التنبيه
    if (error.__handled) return Promise.reject(error);

    // 401
    if (status === 401) {
      error.__handled = true;
      localStorage.removeItem("token");

      await Swal.fire({
        icon: "warning",
        title: "انتهت الجلسة",
        text: "يرجى تسجيل الدخول مرة أخرى.",
        confirmButtonText: "حسنًا",
      });

       return Promise.reject(error);
    }

    // 403
    if (status === 403 || message.includes("forbidden") || message.includes("insufficient")) {
      error.__handled = true;

      await Swal.fire({
        icon: "error",
        title: "لا تملك صلاحية",
        text: "ليس لديك صلاحية لتنفيذ هذا الإجراء.",
        confirmButtonText: "تم",
      });

      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);


// Add token interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// // Add response interceptor for handling auth errors
// apiClient.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       localStorage.removeItem('token');
//       window.location.href = '/login';
//     }
//     return Promise.reject(error);
//   }
// );

// Normalize permission/role names: trim, uppercase, replace separators with _
const norm = (s: string) => s.trim().toUpperCase().replace(/[\s.:\-]+/g, '_');

// Interface definitions
interface Permission {
  id: number;
  name: string;
  description: string;
}

interface Role {
  id: number;
  name: string;
  description: string;
  permissions: Permission[];
}

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  roles: Role[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;

  // Actions
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;

  // Permission helpers
  hasPermission: (permissionName: string) => boolean;
  hasRole: (roleName: string) => boolean;
}

// Fetch /auth/me using the current token in localStorage
const fetchMe = async (): Promise<User> => {
  try {
    const res = await apiClient.get('/auth/me');
    return res.data as User;
  } catch (error: any) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: false,
  isHydrated: false,
  error: null,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await apiClient.post('/auth/login', { username, password });
      const { token } = response.data;

      if (!token) {
        throw new Error('No token received from server');
      }

      localStorage.setItem('token', token);
      set({ token });

      // Wait a bit to ensure token is set in interceptor
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const user = await fetchMe();

      if (!user || !user.roles) {
        console.warn('User data incomplete:', user);
      }

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        isHydrated: true,
        error: null,
      });
    } catch (error: any) {
      console.error('Login error:', error);
      localStorage.removeItem('token');
      const msg = error.response?.data?.message || error.message || 'Login failed';
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        isHydrated: true,
        error: msg,
      });
      throw new Error(msg);
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isHydrated: true,
      error: null,
    });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isHydrated: true, isAuthenticated: false, token: null, user: null });
      return;
    }

    set({ token, isLoading: true });

    try {
      const user = await fetchMe();
      if (!user || !user.roles) {
        console.warn('User data incomplete during checkAuth:', user);
      }
      set({ user, isAuthenticated: true, isLoading: false, isHydrated: true });
    } catch (error: any) {
      console.error('CheckAuth error:', error);
      localStorage.removeItem('token');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        isHydrated: true,
      });
    }finally {
    set({ isLoading: false, isHydrated: true });
  }
  },

  clearError: () => {
    set({ error: null });
  },

  hasPermission: (permissionName: string) => {
    const { user } = get();
    if (!user) return false;

    // Admin bypass
    const isAdmin = user.roles.some((r) => {
      const rn = norm(r.name);
      return rn === 'ADMIN' || rn === 'ADMIN_MASTER';
    });
    if (isAdmin) return true;

    const wanted = norm(permissionName);

    return user.roles.some((role) =>
      role.permissions.some((p) => norm(p.name) === wanted)
    );
  },

  hasRole: (roleName: string) => {
    const { user } = get();
    if (!user) return false;
    const wanted = norm(roleName);
    return user.roles.some((r) => norm(r.name) === wanted);
  },
}));
