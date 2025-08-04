import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useNavigate } from "react-router-dom";
import SupabaseCashierDashboard from "@/components/dashboards/SupabaseCashierDashboard";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  // For now, show cashier dashboard for all authenticated users
  // Later we can add role-based routing
  return <SupabaseCashierDashboard />;
};

export default Index;
