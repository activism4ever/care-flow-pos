import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useHospitalStore, availableLabTests, availableMedications } from '@/stores/hospitalStore';
import { useAuthStore } from '@/stores/authStore';
import { Stethoscope, FileText, FlaskConical, Pill, Clock, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';

export default function DoctorDashboard() {
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [selectedLabTests, setSelectedLabTests] = useState<string[]>([]);
  const [prescriptions, setPrescriptions] = useState<Array<{
    drugName: string;
    dosage: string;
    quantity: number;
    instructions: string;
    price: number;
  }>>([]);

  const { 
    getPatientsByStatus, 
    patients, 
    addDiagnosis,
    updatePatientStatus,
    addService,
    addPayment 
  } = useHospitalStore();
  
  const { user } = useAuthStore();
  const { toast } = useToast();

  const paidPatients = getPatientsByStatus('paid_consultation');
  const diagnosedPatients = getPatientsByStatus('diagnosed');

  const handleDiagnosis = () => {
    if (!selectedPatient || !diagnosis) {
      toast({
        title: "Please select a patient and enter diagnosis",
        variant: "destructive",
      });
      return;
    }

    const patient = patients.find(p => p.id === selectedPatient);
    if (!patient) return;

    // Create prescription objects
    const prescriptionObjects = prescriptions.map((p, index) => ({
      id: `PRESC${Date.now()}_${index}`,
      ...p,
    }));

    // Add diagnosis
    addDiagnosis({
      patientId: selectedPatient,
      doctorId: user!.id,
      diagnosis,
      labTests: selectedLabTests,
      prescriptions: prescriptionObjects,
    });

    // Update patient status
    updatePatientStatus(selectedPatient, 'diagnosed');

    // Create services if lab tests or prescriptions are added
    if (selectedLabTests.length > 0) {
      const labTotal = selectedLabTests.reduce((sum, testId) => {
        const test = availableLabTests.find(t => t.id === testId);
        return sum + (test?.price || 0);
      }, 0);

      addService({
        patientId: selectedPatient,
        serviceType: 'lab',
        items: selectedLabTests,
        totalAmount: labTotal,
        status: 'pending',
      });
    }

    if (prescriptions.length > 0) {
      const pharmacyTotal = prescriptions.reduce((sum, p) => sum + (p.price * p.quantity), 0);
      
      addService({
        patientId: selectedPatient,
        serviceType: 'pharmacy',
        items: prescriptions.map(p => p.drugName),
        totalAmount: pharmacyTotal,
        status: 'pending',
      });
    }

    toast({
      title: "Diagnosis completed",
      description: "Patient has been diagnosed and referred to appropriate services",
    });

    // Reset form
    setSelectedPatient(null);
    setDiagnosis('');
    setSelectedLabTests([]);
    setPrescriptions([]);
  };

  const addPrescription = () => {
    setPrescriptions([...prescriptions, {
      drugName: '',
      dosage: '',
      quantity: 1,
      instructions: '',
      price: 0,
    }]);
  };

  const updatePrescription = (index: number, field: string, value: any) => {
    const updated = [...prescriptions];
    updated[index] = { ...updated[index], [field]: value };
    setPrescriptions(updated);
  };

  const removePrescription = (index: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  return (
    <Layout title="Doctor Dashboard">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-card border-0 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Awaiting Consultation</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paidPatients.length}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card border-0 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Diagnosed Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{diagnosedPatients.length}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card border-0 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patients.length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patient List */}
          <Card className="bg-gradient-card border-0 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Patients Ready for Consultation
              </CardTitle>
              <CardDescription>
                Patients who have paid consultation fees
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {paidPatients.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No patients waiting</p>
                ) : (
                  paidPatients.map((patient) => (
                    <div
                      key={patient.id}
                      className={`p-4 border border-border rounded-lg cursor-pointer transition-colors ${
                        selectedPatient === patient.id 
                          ? 'bg-primary/10 border-primary' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedPatient(patient.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{patient.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {patient.age} years • {patient.gender} • {patient.contact}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Registered: {patient.registeredAt.toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="secondary">{patient.id}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Diagnosis Form */}
          <Card className="bg-gradient-card border-0 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Patient Diagnosis
              </CardTitle>
              <CardDescription>
                {selectedPatient 
                  ? `Diagnosing ${patients.find(p => p.id === selectedPatient)?.name}`
                  : 'Select a patient to begin diagnosis'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedPatient ? (
                <>
                  {/* Diagnosis */}
                  <div className="space-y-2">
                    <Label htmlFor="diagnosis">Diagnosis</Label>
                    <Textarea
                      id="diagnosis"
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      placeholder="Enter patient diagnosis..."
                      className="min-h-[100px]"
                    />
                  </div>

                  {/* Lab Tests */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FlaskConical className="w-4 h-4" />
                      <Label>Lab Tests Required</Label>
                    </div>
                    <div className="space-y-2">
                      {availableLabTests.map((test) => (
                        <div key={test.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={test.id}
                            checked={selectedLabTests.includes(test.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedLabTests([...selectedLabTests, test.id]);
                              } else {
                                setSelectedLabTests(selectedLabTests.filter(id => id !== test.id));
                              }
                            }}
                          />
                          <Label htmlFor={test.id} className="text-sm">
                            {test.name} - ₦{test.price.toLocaleString()}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Prescriptions */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Pill className="w-4 h-4" />
                        <Label>Prescriptions</Label>
                      </div>
                      <Button variant="outline" size="sm" onClick={addPrescription}>
                        Add Medication
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {prescriptions.map((prescription, index) => (
                        <div key={index} className="p-3 border border-border rounded-lg space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Medication</Label>
                              <select
                                value={prescription.drugName}
                                onChange={(e) => {
                                  const med = availableMedications.find(m => m.name === e.target.value);
                                  updatePrescription(index, 'drugName', e.target.value);
                                  updatePrescription(index, 'price', med?.price || 0);
                                }}
                                className="w-full p-2 border border-border rounded text-sm"
                              >
                                <option value="">Select medication</option>
                                {availableMedications.map((med) => (
                                  <option key={med.id} value={med.name}>
                                    {med.name} - ₦{med.price}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <Label className="text-xs">Quantity</Label>
                              <input
                                type="number"
                                value={prescription.quantity}
                                onChange={(e) => updatePrescription(index, 'quantity', parseInt(e.target.value) || 1)}
                                className="w-full p-2 border border-border rounded text-sm"
                                min="1"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs">Dosage & Instructions</Label>
                            <input
                              type="text"
                              value={prescription.instructions}
                              onChange={(e) => updatePrescription(index, 'instructions', e.target.value)}
                              placeholder="e.g., 2 tablets twice daily after meals"
                              className="w-full p-2 border border-border rounded text-sm"
                            />
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">
                              Total: ₦{(prescription.price * prescription.quantity).toLocaleString()}
                            </span>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => removePrescription(index)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button onClick={handleDiagnosis} variant="medical" className="w-full">
                    <Stethoscope className="w-4 h-4" />
                    Complete Diagnosis
                  </Button>
                </>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Select a patient from the list to begin diagnosis
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}