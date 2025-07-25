export interface User {
  id: string;
  username: string;
  role: 'cashier' | 'doctor' | 'lab' | 'pharmacy' | 'admin' | 'hod_lab' | 'hod_pharmacy';
  name: string;
  department?: string;
  createdAt: Date;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  contact: string;
  registeredAt: Date;
  status: 'draft' | 'payment_pending' | 'registered' | 'paid_consultation' | 'diagnosed' | 'lab_referred' | 'pharmacy_referred' | 'completed';
  isReturning: boolean;
  visitHistory: Visit[];
}

export interface Visit {
  id: string;
  patientId: string;
  date: Date;
  reason: string;
  referredServices: string[];
  totalAmount: number;
}

export interface Payment {
  id: string;
  patientId: string;
  type: 'consultation' | 'lab' | 'pharmacy' | 'combined';
  amount: number;
  description: string;
  paidAt: Date;
  receiptNumber: string;
  breakdown?: any[];
}

export interface Diagnosis {
  id: string;
  patientId: string;
  doctorId: string;
  diagnosis: string;
  labTests: string[];
  prescriptions: Prescription[];
  createdAt: Date;
}

export interface Prescription {
  id: string;
  drugName: string;
  dosage: string;
  quantity: number;
  instructions: string;
  price: number;
}

export interface LabTest {
  id: string;
  name: string;
  price: number;
  description: string;
}

export interface PatientService {
  id: string;
  patientId: string;
  serviceType: 'lab' | 'pharmacy';
  items: string[];
  totalAmount: number;
  status: 'pending' | 'paid' | 'completed' | 'dispensed';
  completedAt?: Date;
}