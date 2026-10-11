import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, UserRole, SystemNotification } from '../types/audit';

export const ITAS_USERS: AuthUser[] = [
  {
    id: 'usr-auditor-01',
    name: 'Jane Doe',
    email: 'jane.doe@itas.gov.tax',
    role: 'COMPREHENSIVE_AUDITOR',
    title: 'Senior Comprehensive Tax Auditor',
    directorate: 'Large Taxpayers Directorate (LTO) - Energy & Manufacturing',
    badgeNumber: 'LTO-AUD-4421',
    clearanceLevel: 'Level 3 (Restricted Financial Data)'
  },
  {
    id: 'usr-tl-01',
    name: 'John Smith',
    email: 'john.smith@itas.gov.tax',
    role: 'TEAM_LEADER',
    title: 'Audit Team Leader & Technical Reviewer',
    directorate: 'LTO Substantive Audit Division',
    badgeNumber: 'LTO-TL-1092',
    clearanceLevel: 'Level 4 (Supervisory Review & Endorsement)'
  },
  {
    id: 'usr-director-01',
    name: 'Marcus Vance',
    email: 'marcus.vance@itas.gov.tax',
    role: 'AUDIT_DIRECTOR',
    title: 'Director of Comprehensive Audits & Process Owner',
    directorate: 'Executive Directorate of Large Taxpayer Audits',
    badgeNumber: 'HQ-DIR-0043',
    clearanceLevel: 'Level 5 (Executive Statutory Authorization)'
  },
  {
    id: 'usr-fraud-01',
    name: 'Sarah Connor',
    email: 'sarah.connor@itas.gov.tax',
    role: 'FRAUD_INVESTIGATOR',
    title: 'Special Criminal Tax Fraud Investigator',
    directorate: 'Intelligence & Tax Fraud Investigation Directorate',
    badgeNumber: 'INV-FRAUD-088',
    clearanceLevel: 'Level 5 (Criminal Enforcement & Penal Sanctions)'
  }
];

interface AuthContextType {
  currentUser: AuthUser;
  availableUsers: AuthUser[];
  switchUser: (userId: string) => void;
  notifications: SystemNotification[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser>(() => {
    const saved = localStorage.getItem('itas_authenticated_user_id');
    const matched = ITAS_USERS.find((u) => u.id === saved);
    return matched || ITAS_USERS[0];
  });

  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  const fetchNotifications = async (userToFetch = currentUser) => {
    try {
      const res = await fetch(`/api/notifications?userId=${userToFetch.id}`, {
        headers: {
          'X-User-Id': userToFetch.id
        }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch {
      // Fallback empty or local
    }
  };

  useEffect(() => {
    fetchNotifications(currentUser);
    const interval = setInterval(() => {
      fetchNotifications(currentUser);
    }, 10000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const switchUser = (userId: string) => {
    const found = ITAS_USERS.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
      localStorage.setItem('itas_authenticated_user_id', found.id);
      fetchNotifications(found);
    }
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'X-User-Id': currentUser.id }
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await fetch(`/api/notifications/mark-all-read`, {
        method: 'POST',
        headers: { 'X-User-Id': currentUser.id }
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        availableUsers: ITAS_USERS,
        switchUser,
        notifications,
        unreadNotificationCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        refreshNotifications: () => fetchNotifications(currentUser)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
