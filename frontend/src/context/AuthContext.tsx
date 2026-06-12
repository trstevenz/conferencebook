import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  departmentName: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  readStatus: boolean;
  type: string;
  createdAt: string;
}

interface AuthContextType {
  token: string | null;
  user: UserProfile | null;
  notifications: NotificationItem[];
  login: (token: string, profile: UserProfile) => void;
  logout: () => void;
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: number) => Promise<void>;
  apiCall: (path: string, options?: RequestInit) => Promise<any>;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  calendarInterval: number;
  calendarStartHour: number;
  calendarEndHour: number;
  checkinGracePeriod: number;
  maxMeetingDuration: number;
  updateCalendarSettings: (interval: number, startHour: number, endHour: number, checkinGracePeriod: number, maxMeetingDuration: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<UserProfile | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [calendarInterval, setCalendarInterval] = useState<number>(() => {
    const saved = localStorage.getItem('calendarInterval');
    return saved ? Number(saved) : 15;
  });
  const [calendarStartHour, setCalendarStartHour] = useState<number>(() => {
    const saved = localStorage.getItem('calendarStartHour');
    return saved ? Number(saved) : 8;
  });
  const [calendarEndHour, setCalendarEndHour] = useState<number>(() => {
    const saved = localStorage.getItem('calendarEndHour');
    return saved ? Number(saved) : 18;
  });
  const [checkinGracePeriod, setCheckinGracePeriod] = useState<number>(() => {
    const saved = localStorage.getItem('checkinGracePeriod');
    return saved ? Number(saved) : 15;
  });
  const [maxMeetingDuration, setMaxMeetingDuration] = useState<number>(() => {
    const saved = localStorage.getItem('maxMeetingDuration');
    return saved ? Number(saved) : 120;
  });

  const updateCalendarSettings = (interval: number, startHour: number, endHour: number, gracePeriod: number, maxDuration: number) => {
    setCalendarInterval(interval);
    setCalendarStartHour(startHour);
    setCalendarEndHour(endHour);
    setCheckinGracePeriod(gracePeriod);
    setMaxMeetingDuration(maxDuration);
    localStorage.setItem('calendarInterval', String(interval));
    localStorage.setItem('calendarStartHour', String(startHour));
    localStorage.setItem('calendarEndHour', String(endHour));
    localStorage.setItem('checkinGracePeriod', String(gracePeriod));
    localStorage.setItem('maxMeetingDuration', String(maxDuration));
  };
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const API_BASE = 'http://localhost:8080';

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Synchronize authentication state across browser tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        setToken(e.newValue);
      }
      if (e.key === 'user') {
        setUser(e.newValue ? JSON.parse(e.newValue) : null);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const login = (accessToken: string, profile: UserProfile) => {
    setToken(accessToken);
    setUser(profile);
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(profile));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setNotifications([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const apiCall = async (path: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    const currentToken = localStorage.getItem('token');
    if (currentToken) {
      headers.set('Authorization', `Bearer ${currentToken}`);
    }
    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        logout();
        throw new Error('Session expired. Please log in again.');
      }
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `API error (${response.status})`);
    }

    if (response.status === 204) return null;
    return response.json();
  };

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const data = await apiCall('/api/notifications');
      setNotifications(data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const markNotificationRead = async (id: number) => {
    try {
      await apiCall(`/api/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, readStatus: true } : n)
      );
    } catch (err) {
      console.error('Error reading notification:', err);
    }
  };

  // Poll notifications every 30 seconds
  useEffect(() => {
    if (token) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{
      token,
      user,
      notifications,
      login,
      logout,
      fetchNotifications,
      markNotificationRead,
      apiCall,
      theme,
      toggleTheme,
      calendarInterval,
      calendarStartHour,
      calendarEndHour,
      checkinGracePeriod,
      maxMeetingDuration,
      updateCalendarSettings
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
