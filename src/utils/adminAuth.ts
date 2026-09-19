export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin';
}

const STORAGE_KEY = 'corner_roastery_admin_session';

export const ADMIN_CREDENTIALS = {
  // Can be configured via process.env or defaults
  email: process.env.NEXT_PUBLIC_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'admin@cornerroastery.com',
  username: 'admin',
  password: process.env.NEXT_PUBLIC_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'admin123',
};

export const adminAuth = {
  login: async (identifier: string, passwordAttempt: string): Promise<{ success: boolean; error?: string; user?: AdminUser }> => {
    const trimmedId = identifier.trim().toLowerCase();
    const isValidId = trimmedId === ADMIN_CREDENTIALS.email.toLowerCase() || trimmedId === ADMIN_CREDENTIALS.username.toLowerCase();
    const isValidPass = passwordAttempt === ADMIN_CREDENTIALS.password;

    if (!isValidId || !isValidPass) {
      return {
        success: false,
        error: 'Invalid email/username or password. (Default: admin@cornerroastery.com / admin123)',
      };
    }

    const user: AdminUser = {
      id: 'admin-1',
      name: 'Cafe Owner / Administrator',
      email: ADMIN_CREDENTIALS.email,
      role: 'admin',
    };

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
