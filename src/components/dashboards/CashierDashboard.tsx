import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useHospitalStore, availableLabTests, availableMedications } from '@/stores/hospitalStore';
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
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [includeConsultation, setIncludeConsultation] = useState(false);

  const { 
    registerPatient, 
    addPayment, 
    addCombinedPayment,
    updatePatientStatus, 
    updateServiceStatus,
    updateServicesStatus,
    patients, 
    payments,
    services,
    diagnoses,
    getPatientsByStatus,
    getUnpaidServices,
    getPendingServicesByPatient
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
        isReturning: false,
        visitHistory: []
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

      // Update patient status and mark services as paid
      if (paymentType === 'consultation') {
        updatePatientStatus(selectedPatient, 'paid_consultation');
      } else {
                        // Mark only the first matching service as paid
                        const serviceToUpdate = services.find(s => 
                          s.patientId === selectedPatient && 
                          s.serviceType === paymentType && 
                          s.status === 'pending'
                        );
                        if (serviceToUpdate) {
                          // Update only this specific service status to paid
                          updateServiceStatus(serviceToUpdate.id, 'paid');
                          
                          // Update patient status only if appropriate
                          if (paymentType === 'lab') {
                            updatePatientStatus(selectedPatient, 'lab_referred');
                          } else if (paymentType === 'pharmacy') {
                            updatePatientStatus(selectedPatient, 'pharmacy_referred');
                          }
                        }
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
  const pendingServices = services.filter(s => s.status === 'pending');
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="register">Register Patient</TabsTrigger>
            <TabsTrigger value="payment">Process Payment</TabsTrigger>
            <TabsTrigger value="combined-payment">Combined Payment</TabsTrigger>
            <TabsTrigger value="service-payments">Pending Service Payments</TabsTrigger>
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

          <TabsContent value="combined-payment">
            <Card className="bg-gradient-card border-0 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Combined Payment
                </CardTitle>
                <CardDescription>
                  Collect one payment for all services (consultation, lab tests, medications)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="patient-combined">Select Patient</Label>
                    <Select value={selectedPatient} onValueChange={(value) => {
                      setSelectedPatient(value);
                      setSelectedServices([]);
                      setIncludeConsultation(false);
                    }}>
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

                  {selectedPatient && (() => {
                    // Use the new function to get only pending services
                    const unpaidServices = getPendingServicesByPatient(selectedPatient);
                    console.log('Pending services for patient', selectedPatient, ':', unpaidServices);
                    const consultationFee = 2000; // Standard consultation fee
                    
                    // Group services by type for better organization
                    const servicesByType = unpaidServices.reduce((acc, service) => {
                      if (!acc[service.serviceType]) {
                        acc[service.serviceType] = [];
                      }
                      acc[service.serviceType].push(service);
                      return acc;
                    }, {} as Record<string, typeof unpaidServices>);
                    
                    // Calculate selected total
                    const selectedServiceTotal = selectedServices.reduce((sum, serviceId) => {
                      const service = unpaidServices.find(s => s.id === serviceId);
                      return sum + (service ? service.totalAmount : 0);
                    }, 0);
                    const consultationAmount = includeConsultation ? consultationFee : 0;
                    const grandTotal = selectedServiceTotal + consultationAmount;

                    if (unpaidServices.length === 0 && !includeConsultation) {
                      return (
                        <div className="text-center py-8 text-muted-foreground">
                          <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No unpaid services found for this patient</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        <div className="border rounded-lg p-4 space-y-4">
                          <h4 className="font-semibold">Select Services to Pay</h4>
                          
                          {/* Consultation Fee */}
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                id="consultation"
                                checked={includeConsultation}
                                onCheckedChange={(checked) => setIncludeConsultation(!!checked)}
                              />
                              <Label htmlFor="consultation" className="font-medium">
                                Consultation Fee
                              </Label>
                            </div>
                            <span className="font-medium">₦{consultationFee.toLocaleString()}</span>
                          </div>
                          
                          {/* Unpaid Services grouped by type */}
                          {Object.entries(servicesByType).map(([serviceType, servicesOfType]) => (
                            <div key={serviceType} className="space-y-2">
                              <h5 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                                {serviceType} Services
                              </h5>
                              {servicesOfType.map((service) => (
                                <div key={service.id} className="border rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-3">
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
                                      <Label htmlFor={service.id} className="font-medium capitalize">
                                        {service.serviceType} Services
                                      </Label>
                                    </div>
                                    <span className="font-medium">₦{service.totalAmount.toLocaleString()}</span>
                                  </div>
                                  
                                  {/* Service Details */}
                                  <div className="ml-6 space-y-1">
                                    {service.serviceType === 'lab' && service.items.length > 0 ? (
                                      service.items.map((item, index) => {
                                        // Map lab test ID to actual test name
                                        const labTest = availableLabTests.find(test => test.id === item || test.name === item);
                                        const testName = labTest ? labTest.name : item;
                                        return (
                                          <div key={index} className="text-sm text-muted-foreground">
                                            • {testName}
                                          </div>
                                        );
                                      })
                                    ) : service.serviceType === 'lab' ? (
                                      <div className="text-sm text-muted-foreground">No lab tests</div>
                                    ) : null}
                                    
                                    {service.serviceType === 'pharmacy' && (() => {
                                      // Get the diagnosis for this patient to access prescription details
                                      const diagnosis = diagnoses.find(d => d.patientId === selectedPatient);
                                      
                                      if (!diagnosis || !diagnosis.prescriptions || diagnosis.prescriptions.length === 0) {
                                        return <div className="text-sm text-muted-foreground">No medications prescribed</div>;
                                      }
                                      
                                      return diagnosis.prescriptions.map((prescription, index) => (
                                        <div key={index} className="text-sm text-muted-foreground">
                                          • {prescription.drugName || "Unnamed Drug"} (Qty: {prescription.quantity || 1})
                                        </div>
                                      ));
                                    })()}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                          
                          {/* Total */}
                          <div className="flex justify-between items-center pt-3 border-t-2 font-bold text-lg">
                            <span>Selected Total</span>
                            <span className="text-primary">₦{grandTotal.toLocaleString()}</span>
                          </div>
                        </div>

                        <Button 
                          className="w-full" 
                          variant="success" 
                          onClick={() => {
                            if (selectedServices.length > 0 || includeConsultation) {
                              const breakdown = [];
                              
                              if (includeConsultation) {
                                breakdown.push({ service: 'Consultation', amount: consultationFee });
                              }
                              
                              selectedServices.forEach(serviceId => {
                                const service = unpaidServices.find(s => s.id === serviceId);
                                if (service) {
                                  breakdown.push({ 
                                    service: `${service.serviceType} services`, 
                                    amount: service.totalAmount,
                                    items: service.items 
                                  });
                                }
                              });
                              
                              // Process payment for selected services only
                              const receiptNumber = addCombinedPayment(
                                selectedPatient, 
                                selectedServices, 
                                grandTotal, 
                                breakdown
                              );
                              
                              // Only update consultation status if it was included in this payment
                              if (includeConsultation) {
                                updatePatientStatus(selectedPatient, 'paid_consultation');
                              }
                              
                              toast({
                                title: "Payment processed for selected services",
                                description: `Paid: ₦${grandTotal.toLocaleString()}, Receipt: ${receiptNumber}. Other unpaid services remain pending.`,
                              });
                              
                              // Reset selections but keep patient selected to see remaining services
                              setSelectedServices([]);
                              setIncludeConsultation(false);
                            }
                          }}
                          disabled={selectedServices.length === 0 && !includeConsultation}
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Collect Payment - ₦{grandTotal.toLocaleString()}
                        </Button>
                      </div>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="service-payments">
            <Card className="bg-gradient-card border-0 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Pending Service Payments
                </CardTitle>
                <CardDescription>
                  Process payments for lab tests and prescriptions referred by doctors
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingServices.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No pending service payments</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingServices.map((service) => {
                      const patient = patients.find(p => p.id === service.patientId);
                      const isLabService = service.serviceType === 'lab';
                      
                      return (
                        <div key={`pending-service-${service.id}`} className="p-6 border border-border rounded-lg space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div>
                                <p className="font-semibold text-lg">{patient?.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  Patient ID: {patient?.id} • Contact: {patient?.contact}
                                </p>
                              </div>
                              <Badge variant={isLabService ? "secondary" : "outline"} className="text-xs">
                                {isLabService ? "Lab Tests" : "Pharmacy"}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-2xl text-primary">₦{service.totalAmount.toLocaleString()}</p>
                              <Badge variant="destructive">Payment Required</Badge>
                            </div>
                          </div>
                          
                          {/* Itemized list */}
                          <div className="border-t pt-4">
                            <h4 className="font-medium mb-3">Service Details:</h4>
                            <div className="space-y-2">
                              {service.items.map((item, index) => (
                                <div key={index} className="flex justify-between text-sm">
                                  <span>{item}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex gap-3 pt-4 border-t">
                            <Button 
                              variant="default" 
                              size="sm"
                              className="flex-1"
                              onClick={() => {
                                setSelectedPatient(service.patientId);
                                setPaymentType(service.serviceType);
                                setPaymentAmount(service.totalAmount.toString());
                                setActiveTab('payment');
                              }}
                            >
                              <CreditCard className="w-4 h-4 mr-2" />
                              Collect Payment
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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