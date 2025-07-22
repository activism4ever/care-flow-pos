import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/stores/authStore';
import { Hospital, Shield, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const { login } = useAuthStore();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const success = await login(username, password);
    
    if (!success) {
      toast({
        title: "Login failed",
        description: "Invalid credentials. Use demo123 as password.",
        variant: "destructive",
      });
    }
  };

  const quickLogin = (role: string) => {
    setUsername(role);
    setPassword('demo123');
    setSelectedRole(role);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-accent flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
      
      <Card className="w-full max-w-md relative bg-gradient-card shadow-floating border-0">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-medical rounded-full flex items-center justify-center shadow-medical">
            <Hospital className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-foreground">Hospital POS</CardTitle>
            <CardDescription className="text-muted-foreground">
              Medical Management System
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-11"
                placeholder="Enter username"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
                placeholder="Enter password"
              />
            </div>
            
            <Button type="submit" variant="medical" size="lg" className="w-full">
              <Shield className="w-4 h-4" />
              Sign In
            </Button>
          </form>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Quick Access</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              onClick={() => quickLogin('cashier')}
              className="h-12 flex-col gap-1"
            >
              <User className="w-4 h-4" />
              <span className="text-xs">Cashier</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => quickLogin('doctor')}
              className="h-12 flex-col gap-1"
            >
              <User className="w-4 h-4" />
              <span className="text-xs">Doctor</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => quickLogin('lab')}
              className="h-12 flex-col gap-1"
            >
              <User className="w-4 h-4" />
              <span className="text-xs">Lab Tech</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => quickLogin('pharmacy')}
              className="h-12 flex-col gap-1"
            >
              <User className="w-4 h-4" />
              <span className="text-xs">Pharmacist</span>
            </Button>
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            Demo credentials: Use any username with password "demo123"
          </div>
        </CardContent>
      </Card>
    </div>
  );
}