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
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
        } else {
          setUserRole(data?.role || null);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setRoleLoading(false);
      }
    };

    if (user) {
      getUserRole();
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

  // Role-based dashboard routing
  switch (userRole) {
    case 'admin':
      return <AdminDashboard />;
    case 'cashier':
      return <SupabaseCashierDashboard />;
    case 'doctor':
      return <SupabaseCashierDashboard />; // TODO: Create DoctorDashboard
    case 'lab':
    case 'hod_lab':
      return <SupabaseCashierDashboard />; // TODO: Create LabDashboard
    case 'pharmacy':
    case 'hod_pharmacy':
      return <SupabaseCashierDashboard />; // TODO: Create PharmacyDashboard
    default:
      return <SupabaseCashierDashboard />; // Default fallback
  }
};

export default Index;
