-- Fix security vulnerabilities by implementing proper role-based access control

-- 1. Fix patients table - restrict access based on roles
DROP POLICY IF EXISTS "Authenticated users can view patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated users can create patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated users can update patients" ON public.patients;

-- Only cashiers, doctors, and admins can view patients
CREATE POLICY "Authorized staff can view patients" ON public.patients
FOR SELECT USING (
  has_role(auth.uid(), 'cashier'::app_role) OR 
  has_role(auth.uid(), 'doctor'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Only cashiers and admins can create patients
CREATE POLICY "Cashiers and admins can create patients" ON public.patients
FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'cashier'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Only cashiers, doctors, and admins can update patients
CREATE POLICY "Authorized staff can update patients" ON public.patients
FOR UPDATE USING (
  has_role(auth.uid(), 'cashier'::app_role) OR 
  has_role(auth.uid(), 'doctor'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- 2. Fix payments table - restrict to financial staff
DROP POLICY IF EXISTS "Authenticated users can view payments" ON public.payments;
DROP POLICY IF EXISTS "Authenticated users can create payments" ON public.payments;

-- Only cashiers and admins can view payments
CREATE POLICY "Financial staff can view payments" ON public.payments
FOR SELECT USING (
  has_role(auth.uid(), 'cashier'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Only cashiers and admins can create payments
CREATE POLICY "Financial staff can create payments" ON public.payments
FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'cashier'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- 3. Fix diagnoses table - restrict to medical staff
DROP POLICY IF EXISTS "Authenticated users can view diagnoses" ON public.diagnoses;
DROP POLICY IF EXISTS "Doctors can create diagnoses" ON public.diagnoses;

-- Only doctors and admins can view diagnoses
CREATE POLICY "Medical staff can view diagnoses" ON public.diagnoses
FOR SELECT USING (
  has_role(auth.uid(), 'doctor'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Only doctors can create diagnoses
CREATE POLICY "Doctors can create diagnoses" ON public.diagnoses
FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'doctor'::app_role)
);

-- 4. Fix visits table - restrict based on roles
DROP POLICY IF EXISTS "Authenticated users can view visits" ON public.visits;
DROP POLICY IF EXISTS "Authenticated users can create visits" ON public.visits;

-- Only cashiers, doctors, and admins can view visits
CREATE POLICY "Authorized staff can view visits" ON public.visits
FOR SELECT USING (
  has_role(auth.uid(), 'cashier'::app_role) OR 
  has_role(auth.uid(), 'doctor'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Only cashiers and doctors can create visits
CREATE POLICY "Staff can create visits" ON public.visits
FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'cashier'::app_role) OR 
  has_role(auth.uid(), 'doctor'::app_role)
);

-- 5. Fix patient_services table - restrict based on service type and roles
DROP POLICY IF EXISTS "Authenticated users can view patient services" ON public.patient_services;
DROP POLICY IF EXISTS "Authenticated users can create patient services" ON public.patient_services;
DROP POLICY IF EXISTS "Authenticated users can update patient services" ON public.patient_services;

-- Role-based access for viewing patient services
CREATE POLICY "Role-based patient services view" ON public.patient_services
FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'doctor'::app_role) OR
  (service_type = 'lab' AND (has_role(auth.uid(), 'lab'::app_role) OR has_role(auth.uid(), 'hod_lab'::app_role))) OR
  (service_type = 'pharmacy' AND (has_role(auth.uid(), 'pharmacy'::app_role) OR has_role(auth.uid(), 'hod_pharmacy'::app_role)))
);

-- Only doctors and admins can create patient services
CREATE POLICY "Medical staff can create patient services" ON public.patient_services
FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'doctor'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Role-based updates for patient services
CREATE POLICY "Role-based patient services update" ON public.patient_services
FOR UPDATE USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  (service_type = 'lab' AND (has_role(auth.uid(), 'lab'::app_role) OR has_role(auth.uid(), 'hod_lab'::app_role))) OR
  (service_type = 'pharmacy' AND (has_role(auth.uid(), 'pharmacy'::app_role) OR has_role(auth.uid(), 'hod_pharmacy'::app_role)))
);