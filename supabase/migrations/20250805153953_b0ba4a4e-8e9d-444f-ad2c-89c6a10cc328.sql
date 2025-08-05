-- Create initial admin user (this will be done through Supabase Auth)
-- Note: This creates the user account directly in the auth.users table

-- First, let's insert a test admin user with a known password
-- We'll use the admin API to create this user with a specific ID

-- Insert the admin role for the initial user
-- Using a specific UUID that we'll create the user with
INSERT INTO public.user_roles (user_id, role)
VALUES ('11111111-1111-1111-1111-111111111111'::uuid, 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;

-- Insert profile for the admin user
INSERT INTO public.profiles (user_id, username, name, department)
VALUES (
  '11111111-1111-1111-1111-111111111111'::uuid,
  'admin@hospital.com',
  'System Administrator',
  'admin'
)
ON CONFLICT (user_id) DO NOTHING;