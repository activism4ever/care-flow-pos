import { create } from 'zustand';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  users: User[];
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  createUser: (userData: Omit<User, 'id'>) => string;
  resetPassword: (userId: string, newPassword: string) => void;
}

// Demo users for MVP
const demoUsers: User[] = [
  { id: '1', username: 'cashier', role: 'cashier', name: 'Sarah Johnson', createdAt: new Date('2024-01-01') },
  { id: '2', username: 'doctor', role: 'doctor', name: 'Dr. Michael Chen', createdAt: new Date('2024-01-01') },
  { id: '3', username: 'lab', role: 'lab', name: 'Lisa Parker', createdAt: new Date('2024-01-01') },
  { id: '4', username: 'pharmacy', role: 'pharmacy', name: 'James Wilson', createdAt: new Date('2024-01-01') },
  { id: '5', username: 'admin', role: 'admin', name: 'Admin User', createdAt: new Date('2024-01-01') },
  { id: '6', username: 'hod_lab', role: 'hod_lab', name: 'Dr. Patricia Lee', department: 'Laboratory', createdAt: new Date('2024-01-01') },
  { id: '7', username: 'hod_pharmacy', role: 'hod_pharmacy', name: 'Dr. Robert Brown', department: 'Pharmacy', createdAt: new Date('2024-01-01') },
];

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  users: demoUsers,
  
  login: async (username: string, password: string) => {
    // Demo authentication - in real app, this would be an API call
    const { users } = get();
    const user = users.find(u => u.username === username);
    if (user && password === 'demo123') {
      set({ user, isAuthenticated: true });
      return true;
    }
    return false;
  },
  
  logout: () => {
    set({ user: null, isAuthenticated: false });
  },

  createUser: (userData: Omit<User, 'id'>) => {
    const { users } = get();
    const newId = (users.length + 1).toString();
    const newUser: User = {
      ...userData,
      id: newId,
    };
    
    set({ users: [...users, newUser] });
    return newId;
  },

  resetPassword: (userId: string, newPassword: string) => {
    // In a real app, this would make an API call
    // For now, just log the action
    console.log(`Password reset for user ${userId}: ${newPassword}`);
  },
}));