'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserSession {
  id: string;
  email: string;
  display_name: string;
  role: 'member' | 'admin';
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected';
  available_balance: number;
  reserved_balance: number;
}

export const DEMO_USERS: UserSession[] = [
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    email: 'aarav.sharma@example.com',
    display_name: 'Aarav Sharma',
    role: 'member',
    verification_status: 'verified',
    available_balance: 5,
    reserved_balance: 0,
  },
  {
    id: 'b2222222-2222-2222-2222-222222222222',
    email: 'priya.nair@example.com',
    display_name: 'Priya Nair',
    role: 'member',
    verification_status: 'verified',
    available_balance: 4,
    reserved_balance: 0,
  },
  {
    id: 'c3333333-3333-3333-3333-333333333333',
    email: 'rohan.mehta@example.com',
    display_name: 'Rohan Mehta',
    role: 'admin',
    verification_status: 'verified',
    available_balance: 10,
    reserved_balance: 0,
  },
];

interface AuthContextType {
  currentUser: UserSession | null;
  setCurrentUser: (user: UserSession | null) => void;
  switchUser: (userId: string) => void;
  refreshWallet: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  setCurrentUser: () => {},
  switchUser: () => {},
  refreshWallet: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(DEMO_USERS[0]);

  // Load from localStorage if present
  useEffect(() => {
    const savedId = localStorage.getItem('swapstay_user_id');
    if (savedId) {
      const found = DEMO_USERS.find((u) => u.id === savedId);
      if (found) setCurrentUser(found);
    }
  }, []);

  const switchUser = (userId: string) => {
    const found = DEMO_USERS.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
      localStorage.setItem('swapstay_user_id', found.id);
    }
  };

  const refreshWallet = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/wallet', {
        headers: { 'x-user-id': currentUser.id },
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser((prev) =>
          prev
            ? {
                ...prev,
                available_balance: data.data.available_balance,
                reserved_balance: data.data.reserved_balance,
              }
            : null
        );
      }
    } catch (e) {
      console.warn('Could not refresh wallet from backend:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, switchUser, refreshWallet }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
