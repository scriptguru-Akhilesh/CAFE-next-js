export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'platform' | 'owner'; // 'admin' is for backward compatibility
  cafeId?: string;
}

const STORAGE_KEY = 'corner_roastery_admin_session';

export const adminAuth = {
  login: async (identifier: string, passwordAttempt: string): Promise<{ success: boolean; error?: string; user?: AdminUser }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: identifier, password: passwordAttempt })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Invalid username or password',
        };
      }

      const user: AdminUser = data.user;

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token: 'session_' + Date.now() }));
          // Keep a cookie for reload/session continuity.
          document.cookie = `admin_auth_token=valid; path=/; max-age=86400; SameSite=Lax`;
        } catch (e) {
          console.error('Failed to save admin session', e);
        }
      }

      return { success: true, user };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'Network error during login' };
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
        document.cookie = `admin_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      } catch (e) {
        console.error('Failed to remove admin session', e);
      }
    }
  },

  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return !!data;
    } catch {
      return false;
    }
  },

  getUser: (): AdminUser | null => {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;
      const parsed = JSON.parse(data);
      return parsed.user || null;
    } catch {
      return null;
    }
  },
};
