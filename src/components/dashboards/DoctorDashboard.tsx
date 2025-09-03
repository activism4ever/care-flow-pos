import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useHospitalStore, availableLabTests, availableMedications } from '@/stores/hospitalStore';
import { useAuthStore } from '@/stores/authStore';
import { Stethoscope, FileText, Clock, CheckCircle, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import LabTestsSection from '@/components/diagnosis/LabTestsSection';
import PrescriptionsSection from '@/components/diagnosis/PrescriptionsSection';
import ConfirmationModal from '@/components/diagnosis/ConfirmationModal';

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
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Draft state - could be persisted to localStorage or backend later
  const [savedDrafts, setSavedDrafts] = useState<Record<string, any>>({});

  const { 
    getPatientsByStatus, 
    getPatientPayments,
    patients, 
    addDiagnosis,
    updatePatientStatus,
    addService,
    addPayment 
  } = useHospitalStore();
  
  const { user } = useAuthStore();
  const { toast } = useToast();

  const paidPatients = getPatientsByStatus('paid_consultation').filter(p => 
    getPatientPayments(p.id).some(payment => payment.type === 'consultation')
  );
  const diagnosedPatients = getPatientsByStatus('diagnosed');

  const validateForm = () => {
    const errors: string[] = [];
    
    if (!selectedPatient) errors.push("Please select a patient");
    if (!diagnosis.trim()) errors.push("Please enter a diagnosis");
    
    // Check for prescriptions with missing dosage
    const invalidPrescriptions = prescriptions.filter(p => p.drugName && !p.dosage);
    if (invalidPrescriptions.length > 0) {
      errors.push("Some medications are missing dosage information");
    }
    
    return errors;
  };

  const handleCompleteDiagnosis = () => {
    const errors = validateForm();
    if (errors.length > 0) {
      toast({
        title: "Please fix the following issues:",
        description: errors.join(", "),
        variant: "destructive",
      });
      return;
    }
    
    setShowConfirmation(true);
  };

  const handleConfirmDiagnosis = async () => {
    setIsSubmitting(true);
    
    try {
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

      // Clear saved draft
      if (selectedPatient && savedDrafts[selectedPatient]) {
        const newDrafts = { ...savedDrafts };
        delete newDrafts[selectedPatient];
        setSavedDrafts(newDrafts);
      }

      toast({
        title: "Diagnosis completed successfully",
        description: "Patient has been diagnosed and referred to appropriate services",
      });

      // Reset form
      resetForm();
      setShowConfirmation(false);
    } catch (error) {
      toast({
        title: "Error completing diagnosis",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    if (!selectedPatient) {
      toast({
        title: "Please select a patient to save draft",
        variant: "destructive",
      });
      return;
    }

    const draftData = {
      diagnosis,
      selectedLabTests,
      prescriptions,
      savedAt: new Date().toISOString(),
    };

    setSavedDrafts(prev => ({
      ...prev,
      [selectedPatient]: draftData
    }));

    toast({
      title: "Draft saved successfully",
      description: "You can continue working on this diagnosis later",
    });
  };

  const loadDraft = (patientId: string) => {
    const draft = savedDrafts[patientId];
    if (draft) {
      setDiagnosis(draft.diagnosis || '');
      setSelectedLabTests(draft.selectedLabTests || []);
      setPrescriptions(draft.prescriptions || []);
      
      toast({
        title: "Draft loaded",
        description: `Loaded draft from ${new Date(draft.savedAt).toLocaleDateString()}`,
      });
    }
  };

  const resetForm = () => {
    setSelectedPatient(null);
    setDiagnosis('');
    setSelectedLabTests([]);
    setPrescriptions([]);
  };

  const handlePatientSelect = (patientId: string) => {
    setSelectedPatient(patientId);
    // Check if there's a saved draft for this patient
    if (savedDrafts[patientId]) {
      loadDraft(patientId);
    } else {
      // Reset form for new patient
      setDiagnosis('');
      setSelectedLabTests([]);
      setPrescriptions([]);
    }
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
                      onClick={() => handlePatientSelect(patient.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{patient.name}</p>
                            {savedDrafts[patient.id] && (
                              <Badge variant="secondary" className="text-xs">
                                Draft Saved
                              </Badge>
                            )}
                          </div>
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
                  <LabTestsSection
                    availableLabTests={availableLabTests}
                    selectedLabTests={selectedLabTests}
                    onSelectionChange={setSelectedLabTests}
                  />

                  {/* Prescriptions */}
                  <PrescriptionsSection
                    availableMedications={availableMedications}
                    prescriptions={prescriptions}
                    onPrescriptionsChange={setPrescriptions}
                  />

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button 
                      onClick={handleSaveDraft} 
                      variant="outline" 
                      className="flex-1"
                    >
                      <Save className="w-4 h-4" />
                      Save Draft
                    </Button>
                    <Button 
                      onClick={handleCompleteDiagnosis} 
                      variant="medical" 
                      className="flex-1"
                    >
                      <Stethoscope className="w-4 h-4" />
                      Complete Diagnosis
                    </Button>
                  </div>
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

      {/* Confirmation Modal */}
      {selectedPatient && (
        <ConfirmationModal
          open={showConfirmation}
          onOpenChange={setShowConfirmation}
          patient={patients.find(p => p.id === selectedPatient)!}
          diagnosis={diagnosis}
          selectedLabTests={selectedLabTests}
          availableLabTests={availableLabTests}
          prescriptions={prescriptions}
          onConfirm={handleConfirmDiagnosis}
          loading={isSubmitting}
        />
      )}
    </Layout>
  );
}