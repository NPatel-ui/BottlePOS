import { create } from 'zustand';

export interface RegisterResult {
  success: boolean;
  error?: string;
  email?: string;
  expiresInMinutes?: number;
  expiresAt?: string;
}

export interface LoginResult {
  success: boolean;
  error?: string;
  requiresVerification?: boolean;
  expired?: boolean;
  email?: string;
}

export interface VerifyResult {
  success: boolean;
  message: string;
  expired?: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  currentUser: { username: string; email: string; id?: string; token?: string } | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (username: string, email: string, password: string) => Promise<RegisterResult>;
  verifyEmail: (email: string, code: string) => Promise<VerifyResult>;
  resendVerification: (email: string) => Promise<RegisterResult>;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: !!localStorage.getItem('token'),
  isAdmin: !!localStorage.getItem('token'),
  currentUser: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') as string) : null,
  
  register: async (username: string, email: string, password: string): Promise<RegisterResult> => {
    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      
      const data = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        const errorMsg = data?.error?.message || data?.detail || 'Registration failed. Please check your details.';
        return { success: false, error: errorMsg };
      }
      
      return {
        success: true,
        email: data.email || email,
        expiresInMinutes: data.expires_in_minutes || 10,
        expiresAt: data.expires_at,
      };
    } catch (error: any) {
      console.error('Network error during registration', error);
      return { success: false, error: error?.message || 'Network error during registration.' };
    }
  },

  login: async (email: string, password: string): Promise<LoginResult> => {
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg = data?.error?.message || data?.detail || 'Invalid email or password.';
        const errorCode = data?.error?.code || '';
        const isUnverified = errorCode === 'EMAIL_NOT_VERIFIED' || errorMsg.toLowerCase().includes('not verified');
        const isExpired = errorCode === 'VERIFICATION_EXPIRED' || errorMsg.toLowerCase().includes('expired');

        return {
          success: false,
          error: errorMsg,
          requiresVerification: isUnverified,
          expired: isExpired,
          email,
        };
      }
      
      const token = data.access_token;
      localStorage.setItem('token', token);
      
      await get().fetchCurrentUser();
      return { success: true };
    } catch (error: any) {
      console.error('Network error during login', error);
      return { success: false, error: error?.message || 'Network error during login.' };
    }
  },

  verifyEmail: async (email: string, code: string): Promise<VerifyResult> => {
    try {
      const response = await fetch('/api/v1/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg = data?.error?.message || data?.detail || 'Failed to verify email code.';
        const errorCode = data?.error?.code || '';
        const isExpired = errorCode === 'VERIFICATION_EXPIRED' || errorMsg.toLowerCase().includes('expired');
        return {
          success: false,
          message: errorMsg,
          expired: isExpired,
        };
      }

      return {
        success: true,
        message: data?.message || 'Email verified successfully! You can now log in.',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error?.message || 'Network error during verification.',
      };
    }
  },

  resendVerification: async (email: string): Promise<RegisterResult> => {
    try {
      const response = await fetch('/api/v1/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg = data?.error?.message || data?.detail || 'Failed to resend verification code.';
        return { success: false, error: errorMsg };
      }

      return {
        success: true,
        email: data.email || email,
        expiresInMinutes: data.expires_in_minutes || 10,
        expiresAt: data.expires_at,
      };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Network error while resending code.' };
    }
  },
  
  fetchCurrentUser: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch('/api/v1/employees/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const user = await response.json();
        const userData = { username: user.first_name, email: user.email, id: user.id, token };
        localStorage.setItem('user', JSON.stringify(userData));
        
        set({ 
          isAuthenticated: true, 
          isAdmin: user.role === 'ADMIN' || user.role === 'OWNER' || user.role === 'MANAGER',
          currentUser: userData
        });
      } else {
        get().logout();
      }
    } catch (error) {
      console.error('Failed to fetch user', error);
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ isAuthenticated: false, isAdmin: false, currentUser: null });
  },
}));
