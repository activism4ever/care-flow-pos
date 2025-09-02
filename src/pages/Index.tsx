import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SupabaseCashierDashboard from "@/components/dashboards/SupabaseCashierDashboard";
import AdminDashboard from "@/components/dashboards/AdminDashboard";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const getUserRole = async () => {
      if (!user) return;

      try {
        console.log('Fetching role for user:', user.id);
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user role:', error);
          // If there's an error fetching role, default to cashier for now
          setUserRole('cashier');
        } else if (data?.role) {
          console.log('User role found:', data.role);
          setUserRole(data.role);
        } else {
          console.log('No role found for user, checking if user was just created...');
          // If no role found, wait a moment and retry once (for newly created users)
          setTimeout(async () => {
            const { data: retryData, error: retryError } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', user.id)
              .maybeSingle();
            
            if (retryError) {
              console.error('Retry error fetching user role:', retryError);
              setUserRole('cashier'); // Default fallback
            } else if (retryData?.role) {
              console.log('User role found on retry:', retryData.role);
              setUserRole(retryData.role);
            } else {
              console.log('Still no role found, defaulting to cashier');
              setUserRole('cashier'); // Default fallback
            }
          }, 1000);
        }
      } catch (error) {
        console.error('Unexpected error fetching user role:', error);
        setUserRole('cashier'); // Default fallback
      } finally {
        setRoleLoading(false);
      }
    };

    if (user) {
      getUserRole();
    } else {
      setRoleLoading(false);
    }
  }, [user]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  console.log('Rendering dashboard for user role:', userRole);

  // Role-based dashboard routing
  switch (userRole) {
    case 'admin':
      console.log('Rendering AdminDashboard');
      return <AdminDashboard />;
    case 'cashier':
      console.log('Rendering SupabaseCashierDashboard');
      return <SupabaseCashierDashboard />;
    case 'doctor':
      console.log('Rendering SupabaseCashierDashboard for doctor');
      return <SupabaseCashierDashboard />; // TODO: Create DoctorDashboard
    case 'lab':
    case 'hod_lab':
      console.log('Rendering SupabaseCashierDashboard for lab');
      return <SupabaseCashierDashboard />; // TODO: Create LabDashboard
    case 'pharmacy':
    case 'hod_pharmacy':
      console.log('Rendering SupabaseCashierDashboard for pharmacy');
      return <SupabaseCashierDashboard />; // TODO: Create PharmacyDashboard
    default:
      console.log('Rendering default SupabaseCashierDashboard');
      return <SupabaseCashierDashboard />; // Default fallback
  }
};

export default Index;
