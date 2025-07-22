import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useHospitalStore } from '@/stores/hospitalStore';
import { UserPlus, CreditCard, Receipt, Users, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';

export default function CashierDashboard() {
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

  const { 
    registerPatient, 
    addPayment, 
    updatePatientStatus, 
    patients, 
    payments,
    getPatientsByStatus 
  } = useHospitalStore();
  
  const { toast } = useToast();

  const handleRegisterPatient = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPatient.name || !newPatient.age || !newPatient.gender || !newPatient.contact) {
      toast({
        title: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    // Store patient temporarily (don't save to database yet)
    setTempPatient(newPatient);

    toast({
      title: "Patient details stored",
      description: "Now proceed to payment to complete registration",
    });

    // Auto-switch to payment tab
    setActiveTab('payment');
    setNewPatient({ name: '', age: '', gender: '', contact: '' });
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if we're processing a new patient or existing patient
    if (tempPatient && !selectedPatient) {
      // New patient registration + payment
      if (!paymentType || !paymentAmount) {
        toast({
          title: "Please fill in payment details",
          variant: "destructive",
        });
        return;
      }

      // First register the patient with payment_pending status
      const patientId = registerPatient({
        name: tempPatient.name,
        age: parseInt(tempPatient.age),
        gender: tempPatient.gender as 'male' | 'female' | 'other',
        contact: tempPatient.contact,
        status: 'payment_pending',
      });

      // Then add the payment
      const receiptNumber = addPayment({
        patientId: patientId,
        type: paymentType as 'consultation' | 'lab' | 'pharmacy',
        amount: parseFloat(paymentAmount),
        description: `${paymentType} payment`,
      });

      // Update patient status based on payment type
      if (paymentType === 'consultation') {
        updatePatientStatus(patientId, 'paid_consultation');
      } else {
        updatePatientStatus(patientId, 'registered');
      }

      toast({
        title: "Patient registered and payment processed",
        description: `Patient ID: ${patientId}, Receipt: ${receiptNumber}`,
      });

      // Clear temporary data and switch to receipts tab
      setTempPatient(null);
      setPaymentType('');
      setPaymentAmount('');
      setActiveTab('receipts');
      
    } else if (selectedPatient && !tempPatient) {
      // Existing patient payment
      if (!paymentType || !paymentAmount) {
        toast({
          title: "Please fill in all payment fields",
          variant: "destructive",
        });
        return;
      }

      const receiptNumber = addPayment({
        patientId: selectedPatient,
        type: paymentType as 'consultation' | 'lab' | 'pharmacy',
        amount: parseFloat(paymentAmount),
        description: `${paymentType} payment`,
      });

      // Update patient status based on payment type
      if (paymentType === 'consultation') {
        updatePatientStatus(selectedPatient, 'paid_consultation');
      }

      toast({
        title: "Payment processed successfully",
        description: `Receipt: ${receiptNumber}`,
      });

      setSelectedPatient('');
      setPaymentType('');
      setPaymentAmount('');
      setActiveTab('receipts');
    } else {
      toast({
        title: "Please select a patient or complete registration first",
        variant: "destructive",
      });
    }
  };

  const pendingPaymentPatients = getPatientsByStatus('payment_pending');
  const registeredPatients = getPatientsByStatus('registered');
  const consultationPaidPatients = getPatientsByStatus('paid_consultation');
  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <Layout title="Cashier Dashboard">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-card border-0 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patients.length}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card border-0 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payment</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingPaymentPatients.length}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card border-0 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{payments.length}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card border-0 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{totalPayments.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="register">Register Patient</TabsTrigger>
            <TabsTrigger value="payment">Process Payment</TabsTrigger>
            <TabsTrigger value="receipts">View Receipts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="register">
            <Card className="bg-gradient-card border-0 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Register New Patient
                </CardTitle>
                <CardDescription>
                  Enter patient information to create a new record
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegisterPatient} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={newPatient.name}
                        onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                        placeholder="Enter patient name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        value={newPatient.age}
                        onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                        placeholder="Enter age"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select value={newPatient.gender} onValueChange={(value) => setNewPatient({ ...newPatient, gender: value })}>
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
                    
                    <div className="space-y-2">
                      <Label htmlFor="contact">Contact Number</Label>
                      <Input
                        id="contact"
                        value={newPatient.contact}
                        onChange={(e) => setNewPatient({ ...newPatient, contact: e.target.value })}
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" variant="medical" className="w-full">
                    <UserPlus className="w-4 h-4" />
                    Register Patient
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="payment">
            <Card className="bg-gradient-card border-0 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Process Payment
                </CardTitle>
                <CardDescription>
                  Collect payments for consultations, lab tests, or medications
                </CardDescription>
              </CardHeader>
               <CardContent>
                <form onSubmit={handlePayment} className="space-y-4">
                  {tempPatient ? (
                    <div className="p-4 bg-muted rounded-lg border">
                      <h4 className="font-medium mb-2">New Patient Registration</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground">Name:</span>
                        <span>{tempPatient.name}</span>
                        <span className="text-muted-foreground">Age:</span>
                        <span>{tempPatient.age}</span>
                        <span className="text-muted-foreground">Gender:</span>
                        <span className="capitalize">{tempPatient.gender}</span>
                        <span className="text-muted-foreground">Contact:</span>
                        <span>{tempPatient.contact}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="patient">Select Patient</Label>
                      <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose patient" />
                        </SelectTrigger>
                        <SelectContent>
                          {patients.map((patient) => (
                            <SelectItem key={patient.id} value={patient.id}>
                              {patient.name} ({patient.id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Payment Type</Label>
                      <Select value={paymentType} onValueChange={setPaymentType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="consultation">Consultation Fee</SelectItem>
                          <SelectItem value="lab">Lab Tests</SelectItem>
                          <SelectItem value="pharmacy">Medications</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount (₦)</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder="Enter amount"
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" variant="success" className="w-full">
                    <CreditCard className="w-4 h-4" />
                    Process Payment
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="receipts">
            <Card className="bg-gradient-card border-0 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Payment History
                </CardTitle>
                <CardDescription>
                  View all processed payments and receipts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {payments.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No payments recorded yet</p>
                  ) : (
                    payments.map((payment) => {
                      const patient = patients.find(p => p.id === payment.patientId);
                      return (
                        <div key={payment.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                          <div className="space-y-1">
                            <p className="font-medium">{patient?.name}</p>
                            <p className="text-sm text-muted-foreground">{payment.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {payment.paidAt.toLocaleDateString()} - Receipt: {payment.receiptNumber}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">₦{payment.amount.toLocaleString()}</p>
                            <Badge variant="secondary" className="text-xs">
                              {payment.type}
                            </Badge>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}