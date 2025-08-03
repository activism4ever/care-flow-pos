import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Patient, Payment, Diagnosis, PatientService, LabTest, Prescription } from '@/types';

// Helper functions to convert between camelCase and snake_case
const mapPatientFromDb = (dbPatient: any): Patient => ({
  id: dbPatient.id,
  name: dbPatient.name,
  age: dbPatient.age,
  gender: dbPatient.gender,
  contact: dbPatient.contact,
  registeredAt: new Date(dbPatient.registered_at),
  status: dbPatient.status,
  isReturning: dbPatient.is_returning,
  visitHistory: [], // Will be loaded separately if needed
});

const mapPatientToDb = (patient: Omit<Patient, 'id' | 'visitHistory'>) => ({
  name: patient.name,
  age: patient.age,
  gender: patient.gender,
  contact: patient.contact,
  status: patient.status,
  is_returning: patient.isReturning,
  registered_at: patient.registeredAt.toISOString(),
});

const mapPaymentFromDb = (dbPayment: any): Payment => ({
  id: dbPayment.id,
  patientId: dbPayment.patient_id,
  type: dbPayment.type,
  amount: dbPayment.amount,
  description: dbPayment.description,
  paidAt: new Date(dbPayment.paid_at),
  receiptNumber: dbPayment.receipt_number,
  breakdown: dbPayment.breakdown,
});

const mapPaymentToDb = (payment: Omit<Payment, 'id' | 'paidAt'>) => ({
  patient_id: payment.patientId,
  type: payment.type,
  amount: payment.amount,
  description: payment.description,
  receipt_number: payment.receiptNumber,
  breakdown: payment.breakdown,
});

const mapPatientServiceFromDb = (dbService: any): PatientService => ({
  id: dbService.id,
  patientId: dbService.patient_id,
  serviceType: dbService.service_type,
  items: dbService.items,
  totalAmount: dbService.total_amount,
  status: dbService.status,
  completedAt: dbService.completed_at ? new Date(dbService.completed_at) : undefined,
  dispensedBy: dbService.dispensed_by,
});

const mapPatientServiceToDb = (service: Omit<PatientService, 'id' | 'completedAt'>) => ({
  patient_id: service.patientId,
  service_type: service.serviceType,
  items: service.items,
  total_amount: service.totalAmount,
  status: service.status,
  dispensed_by: service.dispensedBy,
});

const mapDiagnosisFromDb = (dbDiagnosis: any): Diagnosis => ({
  id: dbDiagnosis.id,
  patientId: dbDiagnosis.patient_id,
  doctorId: dbDiagnosis.doctor_id,
  diagnosis: dbDiagnosis.diagnosis,
  labTests: dbDiagnosis.lab_tests,
  prescriptions: dbDiagnosis.prescriptions,
  createdAt: new Date(dbDiagnosis.created_at),
});

const mapDiagnosisToDb = (diagnosis: Omit<Diagnosis, 'id' | 'createdAt'>) => ({
  patient_id: diagnosis.patientId,
  doctor_id: diagnosis.doctorId,
  diagnosis: diagnosis.diagnosis,
  lab_tests: diagnosis.labTests,
  prescriptions: JSON.parse(JSON.stringify(diagnosis.prescriptions)), // Convert to JSON
});

const mapLabTestFromDb = (dbLabTest: any): LabTest => ({
  id: dbLabTest.id,
  name: dbLabTest.name,
  price: dbLabTest.price,
  description: dbLabTest.description,
});

export interface DbMedication {
  id: string;
  name: string;
  price: number;
  description?: string;
  is_active: boolean;
}

// Patients
export const usePatients = () => {
  return useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data?.map(mapPatientFromDb) || [];
    },
  });
};

export const useCreatePatient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (patient: Omit<Patient, 'id' | 'visitHistory'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('patients')
        .insert({
          ...mapPatientToDb(patient),
          created_by: user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return mapPatientFromDb(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
};

export const useUpdatePatient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Patient> }) => {
      const dbUpdates: any = {};
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.age) dbUpdates.age = updates.age;
      if (updates.gender) dbUpdates.gender = updates.gender;
      if (updates.contact) dbUpdates.contact = updates.contact;
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.isReturning !== undefined) dbUpdates.is_returning = updates.isReturning;
      
      const { data, error } = await supabase
        .from('patients')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return mapPatientFromDb(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
};

// Payments
export const usePayments = () => {
  return useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data?.map(mapPaymentFromDb) || [];
    },
  });
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payment: Omit<Payment, 'id' | 'paidAt'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('payments')
        .insert({
          ...mapPaymentToDb(payment),
          created_by: user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return mapPaymentFromDb(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
};

// Patient Services
export const usePatientServices = () => {
  return useQuery({
    queryKey: ['patient-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_services')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data?.map(mapPatientServiceFromDb) || [];
    },
  });
};

export const useCreatePatientService = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (service: Omit<PatientService, 'id' | 'completedAt'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('patient_services')
        .insert({
          ...mapPatientServiceToDb(service),
          created_by: user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return mapPatientServiceFromDb(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-services'] });
    },
  });
};

export const useUpdatePatientService = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PatientService> }) => {
      const dbUpdates: any = {};
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.completedAt) dbUpdates.completed_at = updates.completedAt.toISOString();
      if (updates.dispensedBy) dbUpdates.dispensed_by = updates.dispensedBy;
      
      const { data, error } = await supabase
        .from('patient_services')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return mapPatientServiceFromDb(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-services'] });
    },
  });
};

// Lab Tests
export const useLabTests = () => {
  return useQuery({
    queryKey: ['lab-tests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lab_tests')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data?.map(mapLabTestFromDb) || [];
    },
  });
};

// Medications
export const useMedications = () => {
  return useQuery({
    queryKey: ['medications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as DbMedication[];
    },
  });
};

// Diagnoses
export const useDiagnoses = () => {
  return useQuery({
    queryKey: ['diagnoses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('diagnoses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data?.map(mapDiagnosisFromDb) || [];
    },
  });
};

export const useCreateDiagnosis = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (diagnosis: Omit<Diagnosis, 'id' | 'createdAt'>) => {
      const { data, error } = await supabase
        .from('diagnoses')
        .insert(mapDiagnosisToDb(diagnosis))
        .select()
        .single();
      
      if (error) throw error;
      return mapDiagnosisFromDb(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnoses'] });
    },
  });
};