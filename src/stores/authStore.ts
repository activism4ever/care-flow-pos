import { create } from 'zustand';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// Demo users for MVP
const demoUsers: User[] = [
  { id: '1', username: 'cashier', role: 'cashier', name: 'Sarah Johnson' },
  { id: '2', username: 'doctor', role: 'doctor', name: 'Dr. Michael Chen' },
  { id: '3', username: 'lab', role: 'lab', name: 'Lisa Parker' },
  { id: '4', username: 'pharmacy', role: 'pharmacy', name: 'James Wilson' },
  { id: '5', username: 'admin', role: 'admin', name: 'Admin User' },
];

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  
  login: async (username: string, password: string) => {
    // Demo authentication - in real app, this would be an API call
    const user = demoUsers.find(u => u.username === username);
    if (user && password === 'demo123') {
      set({ user, isAuthenticated: true });
      return true;
    }
    return false;
  },
  
  logout: () => {
    set({ user: null, isAuthenticated: false });
  },
}));