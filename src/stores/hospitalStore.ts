import { create } from 'zustand';
import { Patient, Payment, Diagnosis, PatientService, LabTest, Prescription } from '@/types';

interface HospitalState {
  patients: Patient[];
  payments: Payment[];
  diagnoses: Diagnosis[];
  services: PatientService[];
  
  // Actions
  registerPatient: (patient: Omit<Patient, 'id' | 'registeredAt'>) => string;
  addPayment: (payment: Omit<Payment, 'id' | 'paidAt' | 'receiptNumber'>) => string;
  updatePatientStatus: (patientId: string, status: Patient['status']) => void;
  addDiagnosis: (diagnosis: Omit<Diagnosis, 'id' | 'createdAt'>) => void;
  addService: (service: Omit<PatientService, 'id'>) => string;
  updateServiceStatus: (serviceId: string, status: PatientService['status']) => void;
  completeService: (serviceId: string) => void;
  
  // Getters
  getPatientsByStatus: (status: Patient['status']) => Patient[];
  getPatientPayments: (patientId: string) => Payment[];
  getPatientServices: (patientId: string) => PatientService[];
}

// Demo lab tests
export const availableLabTests: LabTest[] = [
  { id: '1', name: 'Blood Test (Full)', price: 2500, description: 'Complete blood count' },
  { id: '2', name: 'Urine Test', price: 1500, description: 'Urinalysis' },
  { id: '3', name: 'X-Ray Chest', price: 3000, description: 'Chest X-ray examination' },
  { id: '4', name: 'Blood Sugar', price: 800, description: 'Glucose level test' },
  { id: '5', name: 'ECG', price: 2000, description: 'Electrocardiogram' },
];

// Demo medications
export const availableMedications = [
  { id: '1', name: 'Paracetamol 500mg', price: 50 },
  { id: '2', name: 'Amoxicillin 250mg', price: 120 },
  { id: '3', name: 'Ibuprofen 400mg', price: 80 },
  { id: '4', name: 'Vitamin C 1000mg', price: 30 },
  { id: '5', name: 'Omeprazole 20mg', price: 150 },
];

let receiptCounter = 1000;
let patientCounter = 1;

export const useHospitalStore = create<HospitalState>((set, get) => ({
  patients: [],
  payments: [],
  diagnoses: [],
  services: [],
  
  registerPatient: (patientData) => {
    const id = `P${patientCounter.toString().padStart(4, '0')}`;
    patientCounter++;
    
    const patient: Patient = {
      ...patientData,
      id,
      registeredAt: new Date(),
      status: 'registered',
    };
    
    set((state) => ({
      patients: [...state.patients, patient],
    }));
    
    return id;
  },
  
  addPayment: (paymentData) => {
    const id = `PAY${Date.now()}`;
    const receiptNumber = `RCP${receiptCounter++}`;
    
    const payment: Payment = {
      ...paymentData,
      id,
      receiptNumber,
      paidAt: new Date(),
    };
    
    set((state) => ({
      payments: [...state.payments, payment],
    }));
    
    return receiptNumber;
  },
  
  updatePatientStatus: (patientId, status) => {
    set((state) => ({
      patients: state.patients.map(p => 
        p.id === patientId ? { ...p, status } : p
      ),
    }));
  },
  
  addDiagnosis: (diagnosisData) => {
    const id = `DIAG${Date.now()}`;
    
    const diagnosis: Diagnosis = {
      ...diagnosisData,
      id,
      createdAt: new Date(),
    };
    
    set((state) => ({
      diagnoses: [...state.diagnoses, diagnosis],
    }));
  },
  
  addService: (serviceData) => {
    const id = `SVC${Date.now()}`;
    
    const service: PatientService = {
      ...serviceData,
      id,
    };
    
    set((state) => ({
      services: [...state.services, service],
    }));
    
    return id;
  },
  
  updateServiceStatus: (serviceId, status) => {
    set((state) => ({
      services: state.services.map(s => 
        s.id === serviceId ? { ...s, status } : s
      ),
    }));
  },

  completeService: (serviceId) => {
    set((state) => ({
      services: state.services.map(s => 
        s.id === serviceId 
          ? { ...s, status: 'completed', completedAt: new Date() }
          : s
      ),
    }));
  },
  
  getPatientsByStatus: (status) => {
    return get().patients.filter(p => p.status === status);
  },
  
  getPatientPayments: (patientId) => {
    return get().payments.filter(p => p.patientId === patientId);
  },
  
  getPatientServices: (patientId) => {
    return get().services.filter(s => s.patientId === patientId);
  },
}));