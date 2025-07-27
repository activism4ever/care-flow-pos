import { ReactNode } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Hospital, 
  LogOut, 
  CreditCard, 
  Stethoscope, 
  FlaskConical, 
  Pill,
  Shield
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  title: string;
}

const roleIcons = {
  cashier: CreditCard,
  doctor: Stethoscope,
  lab: FlaskConical,
  pharmacy: Pill,
  admin: Shield,
  hod_lab: FlaskConical,
  hod_pharmacy: Pill,
};

const roleColors = {
  cashier: 'bg-green-500',
  doctor: 'bg-blue-500',
  lab: 'bg-purple-500',
  pharmacy: 'bg-orange-500',
  admin: 'bg-red-500',
  hod_lab: 'bg-purple-600',
  hod_pharmacy: 'bg-orange-600',
};

export default function Layout({ children, title }: LayoutProps) {
  const { user, logout } = useAuthStore();
  
  if (!user) return null;

  const RoleIcon = roleIcons[user.role] || Shield;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Hospital className="w-8 h-8 text-primary" />
                <div>
                  <h1 className="text-xl font-bold text-foreground">Hospital POS</h1>
                  <p className="text-sm text-muted-foreground">{title}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Card className="px-3 py-2 bg-gradient-card border-0">
                <div className="flex items-center space-x-3">
                  <Avatar className={`w-8 h-8 ${roleColors[user.role]}`}>
                    <AvatarFallback className="text-white">
                      <RoleIcon className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <p className="font-medium text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                  </div>
                </div>
              </Card>
              
              <Button variant="ghost" onClick={logout} className="text-muted-foreground hover:text-foreground">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}