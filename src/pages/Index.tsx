import { useAuthStore } from '@/stores/authStore';
import Login from '@/components/Login';
import CashierDashboard from '@/components/dashboards/CashierDashboard';
import DoctorDashboard from '@/components/dashboards/DoctorDashboard';
import LabDashboard from '@/components/dashboards/LabDashboard';
import PharmacyDashboard from '@/components/dashboards/PharmacyDashboard';

const Index = () => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Login />;
  }

  // Route to appropriate dashboard based on user role
  switch (user.role) {
    case 'cashier':
      return <CashierDashboard />;
    case 'doctor':
      return <DoctorDashboard />;
    case 'lab':
      return <LabDashboard />;
    case 'pharmacy':
      return <PharmacyDashboard />;
    case 'admin':
      return <CashierDashboard />; // Default to cashier for now
    default:
      return <Login />;
  }
};

export default Index;
