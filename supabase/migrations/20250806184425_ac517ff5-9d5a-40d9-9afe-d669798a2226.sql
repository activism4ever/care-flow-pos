-- Add missing cashier role for the user who doesn't have one
INSERT INTO public.user_roles (user_id, role)
VALUES ('faa69814-af70-4e8a-b804-ff33455c6e65', 'cashier')
ON CONFLICT (user_id, role) DO NOTHING;