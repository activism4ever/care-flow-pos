import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { UserPlus, CreditCard, Receipt, Users, DollarSign, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import Layout from '@/components/Layout';
import {
  usePatients,
  useCreatePatient,
  useUpdatePatient,
  usePayments,
  useCreatePayment,
  usePatientServices,
  useCreatePatientService,
  useUpdatePatientService,
  useLabTests,
  useMedications,
} from '@/hooks/useSupabaseData';

export default function SupabaseCashierDashboard() {
  const [newPatient, setNewPatient] = useState({
    name: '',
    age: '',
    gender: '',
    contact: '',
  });
  
  const [tempPatient, setTempPatient] = useState<{
    name: string;
    age: string;
    gender: string;
    contact: string;
  } | null>(null);
  
  const [activeTab, setActiveTab] = useState('register');
  const [selectedPatient, setSelectedPatient] = useState('');
  const [paymentType, setPaymentType] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [includeConsultation, setIncludeConsultation] = useState(false);

  const { signOut } = useAuth();
  const { toast } = useToast();

  // Supabase hooks
  const { data: patients = [], isLoading: patientsLoading, error: patientsError } = usePatients();
  const { data: payments = [], isLoading: paymentsLoading, error: paymentsError } = usePayments();
  const { data: patientServices = [], isLoading: servicesLoading, error: servicesError } = usePatientServices();
  const { data: labTests = [], isLoading: labTestsLoading, error: labTestsError } = useLabTests();
  const { data: medications = [], isLoading: medicationsLoading, error: medicationsError } = useMedications();

  // Debug logging
  console.log('Dashboard data loading states:', {
    patientsLoading,
    paymentsLoading,
    servicesLoading,
    labTestsLoading,
    medicationsLoading
  });

  console.log('Dashboard data errors:', {
    patientsError,
    paymentsError,
    servicesError,
    labTestsError,
    medicationsError
  });

  console.log('Dashboard data:', {
    patientsCount: patients.length,
    paymentsCount: payments.length,
    servicesCount: patientServices.length,
    labTestsCount: labTests.length,
    medicationsCount: medications.length
  });

  const createPatientMutation = useCreatePatient();
  const updatePatientMutation = useUpdatePatient();
  const createPaymentMutation = useCreatePayment();
  const createServiceMutation = useCreatePatientService();
  const updateServiceMutation = useUpdatePatientService();

  // Statistics
  const totalPatients = patients.length;
  const pendingPaymentPatients = patients.filter(p => p.status === 'payment_pending').length;
  const totalPayments = payments.length;
  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);

  const unpaidServices = patientServices.filter(service => service.status === 'pending');

  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPatient.name || !newPatient.age || !newPatient.gender || !newPatient.contact) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await createPatientMutation.mutateAsync({
        name: newPatient.name,
        age: parseInt(newPatient.age),
        gender: newPatient.gender as 'male' | 'female' | 'other',
        contact: newPatient.contact,
        status: 'payment_pending',
        isReturning: false,
        registeredAt: new Date(),
      });

      // Store temporarily for payment processing
      setTempPatient(newPatient);
      setNewPatient({ name: '', age: '', gender: '', contact: '' });
      setActiveTab('process-payment');

      toast({
        title: "Success",
        description: "Patient registered successfully! Please process payment.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to register patient",
        variant: "destructive",
      });
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let patientId = selectedPatient;
    
    // If processing payment for newly registered patient
    if (tempPatient && !selectedPatient) {
      const newlyRegisteredPatient = patients.find(p => 
        p.name === tempPatient.name && 
        p.contact === tempPatient.contact &&
        p.status === 'payment_pending'
      );
      
      if (newlyRegisteredPatient) {
        patientId = newlyRegisteredPatient.id;
      }
    }

    if (!patientId || !paymentType || !paymentAmount) {
      toast({
        title: "Error",
        description: "Please fill in all payment fields",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(paymentAmount);
    const receiptNumber = `RCP-${Date.now()}`;

    try {
      await createPaymentMutation.mutateAsync({
        patientId,
        type: paymentType as 'consultation' | 'lab' | 'pharmacy' | 'combined',
        amount,
        description: `${paymentType} payment`,
        receiptNumber,
        breakdown: [],
      });

      // Update patient status
      let newStatus = 'registered';
      if (paymentType === 'consultation') {
        newStatus = 'paid_consultation';
      }

      await updatePatientMutation.mutateAsync({
        id: patientId,
        updates: { status: newStatus as any }
      });

      // Clear form
      setSelectedPatient('');
      setPaymentType('');
      setPaymentAmount('');
      setTempPatient(null);
      setActiveTab('register');

      toast({
        title: "Success",
        description: `Payment of $${amount} processed successfully. Receipt: ${receiptNumber}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process payment",
        variant: "destructive",
      });
    }
  };

  const handleCombinedPayment = async () => {
    if (selectedServices.length === 0 && !includeConsultation) {
      toast({
        title: "Error",
        description: "Please select at least one service or consultation",
        variant: "destructive",
      });
      return;
    }

    if (!selectedPatient) {
      toast({
        title: "Error",
        description: "Please select a patient",
        variant: "destructive",
      });
      return;
    }

    try {
      let totalAmount = 0;
      const breakdown: any[] = [];

      // Add consultation fee if selected
      if (includeConsultation) {
        totalAmount += 50; // Consultation fee
        breakdown.push({ type: 'consultation', amount: 50, description: 'Consultation Fee' });
      }

      // Calculate selected services cost
      selectedServices.forEach(serviceId => {
        const service = unpaidServices.find(s => s.id === serviceId);
        if (service) {
          totalAmount += service.totalAmount;
          breakdown.push({
            type: service.serviceType,
            amount: service.totalAmount,
            description: `${service.serviceType} services`,
            items: service.items
          });
        }
      });

      const receiptNumber = `RCP-${Date.now()}`;

      // Create combined payment
      await createPaymentMutation.mutateAsync({
        patientId: selectedPatient,
        type: 'combined',
        amount: totalAmount,
        description: 'Combined payment for multiple services',
        receiptNumber,
        breakdown,
      });

      // Update service statuses to paid
      for (const serviceId of selectedServices) {
        await updateServiceMutation.mutateAsync({
          id: serviceId,
          updates: { status: 'paid' }
        });
      }

      // Update patient status if consultation was included
      if (includeConsultation) {
        await updatePatientMutation.mutateAsync({
          id: selectedPatient,
          updates: { status: 'paid_consultation' }
        });
      }

      // Clear form
      setSelectedServices([]);
      setIncludeConsultation(false);
      setSelectedPatient('');

      toast({
        title: "Success",
        description: `Combined payment of $${totalAmount} processed successfully. Receipt: ${receiptNumber}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process combined payment",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  if (patientsLoading || paymentsLoading || servicesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <Layout title="Cashier Dashboard">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Cashier Dashboard</h1>
        <Button onClick={handleLogout} variant="outline">
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPatients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payment</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPaymentPatients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPayments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="register">Register Patient</TabsTrigger>
          <TabsTrigger value="process-payment">Process Payment</TabsTrigger>
          <TabsTrigger value="combined-payment">Combined Payment</TabsTrigger>
          <TabsTrigger value="pending-services">Pending Services</TabsTrigger>
          <TabsTrigger value="receipts">View Receipts</TabsTrigger>
        </TabsList>

        {/* Register Patient Tab */}
        <TabsContent value="register" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Register New Patient
              </CardTitle>
              <CardDescription>
                Add a new patient to the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegisterPatient} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={newPatient.name}
                      onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                      placeholder="Enter patient's full name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={newPatient.age}
                      onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                      placeholder="Enter age"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select 
                      value={newPatient.gender} 
                      onValueChange={(value) => setNewPatient({ ...newPatient, gender: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="contact">Contact Number</Label>
                    <Input
                      id="contact"
                      value={newPatient.contact}
                      onChange={(e) => setNewPatient({ ...newPatient, contact: e.target.value })}
                      placeholder="Enter contact number"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" disabled={createPatientMutation.isPending}>
                  {createPatientMutation.isPending ? 'Registering...' : 'Register Patient'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Process Payment Tab */}
        <TabsContent value="process-payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Process Payment
              </CardTitle>
              <CardDescription>
                Process payments for registered patients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePayment} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="patient-select">Select Patient</Label>
                    <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose patient" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.name} - {patient.contact}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="payment-type">Payment Type</Label>
                    <Select value={paymentType} onValueChange={setPaymentType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="consultation">Consultation</SelectItem>
                        <SelectItem value="lab">Lab Tests</SelectItem>
                        <SelectItem value="pharmacy">Pharmacy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="amount">Amount ($)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="Enter amount"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" disabled={createPaymentMutation.isPending}>
                  {createPaymentMutation.isPending ? 'Processing...' : 'Process Payment'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Combined Payment Tab */}
        <TabsContent value="combined-payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Combined Payment</CardTitle>
              <CardDescription>
                Process payment for multiple services at once
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Select Patient</Label>
                <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name} - {patient.contact}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="consultation"
                  checked={includeConsultation}
                  onCheckedChange={(checked) => setIncludeConsultation(checked as boolean)}
                />
                <Label htmlFor="consultation">Include Consultation Fee ($50)</Label>
              </div>

              <div>
                <Label>Select Unpaid Services</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {unpaidServices
                    .filter(service => !selectedPatient || service.patientId === selectedPatient)
                    .map((service) => {
                      const patient = patients.find(p => p.id === service.patientId);
                      return (
                        <div key={service.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={service.id}
                            checked={selectedServices.includes(service.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedServices([...selectedServices, service.id]);
                              } else {
                                setSelectedServices(selectedServices.filter(id => id !== service.id));
                              }
                            }}
                          />
                          <Label htmlFor={service.id} className="text-sm">
                            {patient?.name} - {service.serviceType} - ${service.totalAmount}
                          </Label>
                        </div>
                      );
                    })}
                </div>
              </div>

              <Button 
                onClick={handleCombinedPayment} 
                disabled={createPaymentMutation.isPending}
                className="w-full"
              >
                {createPaymentMutation.isPending ? 'Processing...' : 'Process Combined Payment'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Services Tab */}
        <TabsContent value="pending-services" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Service Payments</CardTitle>
              <CardDescription>
                Services waiting for payment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {unpaidServices.map((service) => {
                  const patient = patients.find(p => p.id === service.patientId);
                  return (
                    <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{patient?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {service.serviceType} - {service.items.join(', ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${service.totalAmount}</p>
                        <Badge variant="outline">{service.status}</Badge>
                      </div>
                    </div>
                  );
                })}
                {unpaidServices.length === 0 && (
                  <p className="text-center text-muted-foreground">No pending services</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* View Receipts Tab */}
        <TabsContent value="receipts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Receipts</CardTitle>
              <CardDescription>
                History of all processed payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payments.map((payment) => {
                  const patient = patients.find(p => p.id === payment.patientId);
                  return (
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{patient?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {payment.description} - {payment.paidAt.toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Receipt: {payment.receiptNumber}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${payment.amount}</p>
                        <Badge>{payment.type}</Badge>
                      </div>
                    </div>
                  );
                })}
                {payments.length === 0 && (
                  <p className="text-center text-muted-foreground">No payments found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}