import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { useHospitalStore } from '@/stores/hospitalStore';
import { Shield, Users, UserPlus, DollarSign, TrendingUp, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import type { User } from '@/types';

export default function AdminDashboard() {
  const [newUser, setNewUser] = useState({
    username: '',
    name: '',
    role: '',
    department: '',
    password: 'demo123'
  });

  const { createUser, users } = useAuthStore();
  const { patients, payments, services } = useHospitalStore();
  const { toast } = useToast();

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUser.username || !newUser.name || !newUser.role) {
      toast({
        title: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      createUser({
        username: newUser.username,
        name: newUser.name,
        role: newUser.role as User['role'],
        department: newUser.department || undefined,
        createdAt: new Date()
      });

      toast({
        title: "User created successfully",
        description: `${newUser.name} has been added with role: ${newUser.role}`,
      });

      setNewUser({
        username: '',
        name: '',
        role: '',
        department: '',
        password: 'demo123'
      });
    } catch (error) {
      toast({
        title: "Error creating user",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const labRevenue = payments.filter(p => p.type === 'lab').reduce((sum, p) => sum + p.amount, 0);
  const pharmacyRevenue = payments.filter(p => p.type === 'pharmacy').reduce((sum, p) => sum + p.amount, 0);
  const consultationRevenue = payments.filter(p => p.type === 'consultation').reduce((sum, p) => sum + p.amount, 0);

  const completedServices = services.filter(s => s.status === 'completed').length;
  const pendingServices = services.filter(s => s.status === 'pending').length;

  return (
    <Layout title="Admin Dashboard">
      <div className="space-y-6">
        {/* System-wide Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-card border-0 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">All system users</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-0 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patients.length}</div>
              <p className="text-xs text-muted-foreground">Registered patients</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-0 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">All departments</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-0 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Services</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedServices}</div>
              <p className="text-xs text-muted-foreground">{pendingServices} pending</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">Manage Users</TabsTrigger>
            <TabsTrigger value="revenue">Revenue Analytics</TabsTrigger>
            <TabsTrigger value="services">Service Records</TabsTrigger>
            <TabsTrigger value="system">System Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Create User Form */}
              <Card className="bg-gradient-card border-0 shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Create New User
                  </CardTitle>
                  <CardDescription>
                    Add new staff members to the system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={newUser.username}
                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                        placeholder="Enter username"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        placeholder="Enter full name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cashier">Cashier</SelectItem>
                          <SelectItem value="doctor">Doctor</SelectItem>
                          <SelectItem value="lab">Lab Technician</SelectItem>
                          <SelectItem value="pharmacy">Pharmacist</SelectItem>
                          <SelectItem value="hod_lab">HOD - Laboratory</SelectItem>
                          <SelectItem value="hod_pharmacy">HOD - Pharmacy</SelectItem>
                          <SelectItem value="admin">Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {(newUser.role === 'hod_lab' || newUser.role === 'hod_pharmacy') && (
                      <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <Input
                          id="department"
                          value={newUser.department}
                          onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                          placeholder="Enter department"
                        />
                      </div>
                    )}

                    <Button type="submit" variant="medical" className="w-full">
                      <UserPlus className="w-4 h-4" />
                      Create User
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Users List */}
              <Card className="bg-gradient-card border-0 shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Current Users
                  </CardTitle>
                  <CardDescription>
                    All registered system users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {users.map((user) => (
                      <div key={user.id} className="p-3 border border-border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                            {user.department && (
                              <p className="text-xs text-muted-foreground">{user.department}</p>
                            )}
                          </div>
                          <Badge 
                            variant={user.role === 'admin' ? 'default' : 'secondary'}
                            className="capitalize"
                          >
                            {user.role.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="revenue">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-card border-0 shadow-card">
                <CardHeader>
                  <CardTitle className="text-lg">Consultation Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">₦{consultationRevenue.toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground">Doctor consultations</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-0 shadow-card">
                <CardHeader>
                  <CardTitle className="text-lg">Laboratory Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">₦{labRevenue.toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground">Lab tests and procedures</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-0 shadow-card">
                <CardHeader>
                  <CardTitle className="text-lg">Pharmacy Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">₦{pharmacyRevenue.toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground">Medications and prescriptions</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="services">
            <Card className="bg-gradient-card border-0 shadow-card">
              <CardHeader>
                <CardTitle>All Service Records</CardTitle>
                <CardDescription>Complete history of lab and pharmacy services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {services.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No service records found</p>
                    </div>
                  ) : (
                    services.map((service) => {
                      const patient = patients.find(p => p.id === service.patientId);
                      return (
                        <div key={service.id} className="p-4 border border-border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{patient?.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {service.serviceType === 'lab' ? 'Laboratory' : 'Pharmacy'} • 
                                {service.items.join(', ')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">₦{service.totalAmount.toLocaleString()}</p>
                              <Badge 
                                variant={service.status === 'completed' ? 'default' : 'secondary'}
                                className="capitalize"
                              >
                                {service.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gradient-card border-0 shadow-card">
                <CardHeader>
                  <CardTitle>User Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['admin', 'doctor', 'cashier', 'lab', 'pharmacy', 'hod_lab', 'hod_pharmacy'].map(role => {
                      const count = users.filter(u => u.role === role).length;
                      return (
                        <div key={role} className="flex justify-between items-center">
                          <span className="capitalize">{role.replace('_', ' ')}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-0 shadow-card">
                <CardHeader>
                  <CardTitle>System Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Total Transactions</span>
                      <Badge variant="outline">{payments.length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Completed Services</span>
                      <Badge variant="outline">{completedServices}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Pending Services</span>
                      <Badge variant="outline">{pendingServices}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Average Revenue per Patient</span>
                      <Badge variant="outline">
                        ₦{patients.length ? Math.round(totalRevenue / patients.length).toLocaleString() : '0'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}