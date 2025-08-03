-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('cashier', 'doctor', 'lab', 'pharmacy', 'admin', 'hod_lab', 'hod_pharmacy');

-- Create profiles table
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE,
  name text NOT NULL,
  department text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create patients table
CREATE TABLE public.patients (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  age integer NOT NULL,
  gender text NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  contact text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'payment_pending', 'registered', 'paid_consultation', 'diagnosed', 'lab_referred', 'pharmacy_referred', 'completed')),
  is_returning boolean NOT NULL DEFAULT false,
  registered_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create visits table
CREATE TABLE public.visits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  date timestamp with time zone NOT NULL DEFAULT now(),
  reason text NOT NULL,
  referred_services text[] DEFAULT '{}',
  total_amount decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('consultation', 'lab', 'pharmacy', 'combined')),
  amount decimal(10,2) NOT NULL,
  description text NOT NULL,
  receipt_number text NOT NULL UNIQUE,
  breakdown jsonb DEFAULT '[]',
  paid_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create diagnoses table
CREATE TABLE public.diagnoses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES auth.users(id),
  diagnosis text NOT NULL,
  lab_tests text[] DEFAULT '{}',
  prescriptions jsonb DEFAULT '[]',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create lab_tests table (available tests)
CREATE TABLE public.lab_tests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  price decimal(10,2) NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create medications table (available medications)
CREATE TABLE public.medications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  price decimal(10,2) NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create patient_services table
CREATE TABLE public.patient_services (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  service_type text NOT NULL CHECK (service_type IN ('lab', 'pharmacy')),
  items text[] NOT NULL,
  total_amount decimal(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'completed', 'dispensed')),
  completed_at timestamp with time zone,
  dispensed_by uuid REFERENCES auth.users(id),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_services ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create policies for patients (accessible to all authenticated users)
CREATE POLICY "Authenticated users can view patients" ON public.patients
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create patients" ON public.patients
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update patients" ON public.patients
  FOR UPDATE TO authenticated USING (true);

-- Create policies for visits
CREATE POLICY "Authenticated users can view visits" ON public.visits
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create visits" ON public.visits
  FOR INSERT TO authenticated WITH CHECK (true);

-- Create policies for payments
CREATE POLICY "Authenticated users can view payments" ON public.payments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create payments" ON public.payments
  FOR INSERT TO authenticated WITH CHECK (true);

-- Create policies for diagnoses
CREATE POLICY "Authenticated users can view diagnoses" ON public.diagnoses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Doctors can create diagnoses" ON public.diagnoses
  FOR INSERT TO authenticated WITH CHECK (true);

-- Create policies for lab_tests and medications (read-only for most users)
CREATE POLICY "Authenticated users can view lab tests" ON public.lab_tests
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and HODs can manage lab tests" ON public.lab_tests
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'hod_lab')
  );

CREATE POLICY "Authenticated users can view medications" ON public.medications
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and HODs can manage medications" ON public.medications
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'hod_pharmacy')
  );

-- Create policies for patient_services
CREATE POLICY "Authenticated users can view patient services" ON public.patient_services
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create patient services" ON public.patient_services
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update patient services" ON public.patient_services
  FOR UPDATE TO authenticated USING (true);

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patient_services_updated_at
  BEFORE UPDATE ON public.patient_services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample lab tests
INSERT INTO public.lab_tests (name, price, description) VALUES
  ('Complete Blood Count (CBC)', 50.00, 'Full blood analysis including RBC, WBC, platelets'),
  ('Blood Sugar Test', 25.00, 'Fasting and random glucose levels'),
  ('Liver Function Test', 75.00, 'Comprehensive liver enzyme analysis'),
  ('Kidney Function Test', 60.00, 'Creatinine and urea analysis'),
  ('Lipid Profile', 80.00, 'Cholesterol and triglyceride levels'),
  ('Thyroid Function Test', 90.00, 'TSH, T3, T4 hormone levels'),
  ('Urine Analysis', 30.00, 'Complete urine examination'),
  ('X-Ray Chest', 40.00, 'Chest radiography'),
  ('ECG', 35.00, 'Electrocardiogram'),
  ('Ultrasound', 100.00, 'Abdominal ultrasound examination');

-- Insert sample medications
INSERT INTO public.medications (name, price, description) VALUES
  ('Paracetamol 500mg', 2.50, 'Pain reliever and fever reducer'),
  ('Amoxicillin 250mg', 8.00, 'Antibiotic for bacterial infections'),
  ('Ibuprofen 400mg', 3.50, 'Anti-inflammatory pain reliever'),
  ('Omeprazole 20mg', 12.00, 'Proton pump inhibitor for acid reflux'),
  ('Metformin 500mg', 6.00, 'Diabetes medication'),
  ('Amlodipine 5mg', 7.50, 'Blood pressure medication'),
  ('Cetirizine 10mg', 4.00, 'Antihistamine for allergies'),
  ('Vitamin D3', 15.00, 'Vitamin D supplement'),
  ('Iron tablets', 9.00, 'Iron supplement for anemia'),
  ('Cough Syrup', 8.50, 'Cough suppressant and expectorant');