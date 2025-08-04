import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

interface CreateUserForm {
  fullName: string;
  email: string;
  password: string;
  role: string;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

const AdminDashboard = () => {
  const [formData, setFormData] = useState<CreateUserForm>({
    fullName: '',
    email: '',
    password: '',
    role: ''
  });
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const { toast } = useToast();
  const { session } = useAuth();

  const handleInputChange = (field: keyof CreateUserForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      // Get all users with their profiles and roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          user_id,
          name,
          created_at,
          user_roles (
            role
          )
        `);

      if (profilesError) {
        console.error('Error fetching users:', profilesError);
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive",
        });
        return;
      }

      const usersWithDetails = profiles?.map(profile => ({
        id: profile.user_id,
        email: 'Loading...', // We'll show email from auth if available
        full_name: profile.name,
        role: (profile.user_roles as any)?.[0]?.role || 'N/A',
        created_at: profile.created_at
      })) || [];

      setUsers(usersWithDetails);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setUsersLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email || !formData.password || !formData.role) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          role: formData.role
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Success",
        description: `User ${formData.fullName} created successfully!`,
      });

      // Reset form
      setFormData({
        fullName: '',
        email: '',
        password: '',
        role: ''
      });

      // Reload users list
      loadUsers();

    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Simple header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-foreground">Hospital POS - Admin Dashboard</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        
        <Tabs defaultValue="create-user" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create-user">Create User</TabsTrigger>
            <TabsTrigger value="all-users">All Users</TabsTrigger>
          </TabsList>
          
          <TabsContent value="create-user">
            <Card>
              <CardHeader>
                <CardTitle>Create New User</CardTitle>
                <CardDescription>
                  Create a new user account and assign a role
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        placeholder="Enter full name"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="Enter email"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="Enter password"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cashier">Cashier</SelectItem>
                          <SelectItem value="doctor">Doctor</SelectItem>
                          <SelectItem value="lab">Lab Technician</SelectItem>
                          <SelectItem value="pharmacy">Pharmacist</SelectItem>
                          <SelectItem value="hod_lab">HOD Lab</SelectItem>
                          <SelectItem value="hod_pharmacy">HOD Pharmacy</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Button type="submit" disabled={loading} className="w-full md:w-auto">
                    {loading ? 'Creating User...' : 'Create User'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="all-users">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>
                  View and manage all system users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Button onClick={loadUsers} disabled={usersLoading}>
                    {usersLoading ? 'Loading...' : 'Refresh'}
                  </Button>
                </div>
                
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.full_name}</TableCell>
                          <TableCell>
                            <span className="capitalize">{user.role.replace('_', ' ')}</span>
                          </TableCell>
                          <TableCell>
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                      {users.length === 0 && !usersLoading && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">
                            No users found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;