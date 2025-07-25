import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useHospitalStore } from '@/stores/hospitalStore';
import { Pill, Clock, CheckCircle, AlertCircle, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';

export default function PharmacyDashboard() {
  const { 
    patients, 
    services, 
    diagnoses,
    markServiceAsDispensed,
    getPaidPendingPharmacyServices,
    getPatientPayments,
    getPatientsByStatus 
  } = useHospitalStore();

  // Only show pharmacy services for patients who have paid for medications
  const paidPharmacyPatients = getPatientsByStatus('pharmacy_referred').filter(p => 
    getPatientPayments(p.id).some(payment => payment.type === 'pharmacy')
  );
  
  const { toast } = useToast();

  const pharmacyServices = services.filter(s => s.serviceType === 'pharmacy');
  const pendingPrescriptions = pharmacyServices.filter(s => s.status === 'paid');
  const dispensedPrescriptions = pharmacyServices.filter(s => s.status === 'dispensed');

  const handleDispenseMedication = (serviceId: string) => {
    markServiceAsDispensed(serviceId);
    toast({
      title: "Medication dispensed",
      description: "Prescription has been marked as dispensed",
    });
  };


  const getPatientDiagnosis = (patientId: string) => {
    return diagnoses.find(d => d.patientId === patientId);
  };

  return (
    <Layout title="Pharmacy Dashboard">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-card border-0 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Prescriptions</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingPrescriptions.length}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card border-0 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dispensed Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dispensedPrescriptions.length}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card border-0 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Prescriptions</CardTitle>
              <Pill className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pharmacyServices.length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Prescriptions */}
          <Card className="bg-gradient-card border-0 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Pending Prescriptions
              </CardTitle>
              <CardDescription>
                Prescriptions waiting to be dispensed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingPrescriptions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No pending prescriptions</p>
                ) : (
                  pendingPrescriptions.map((service) => {
                    const patient = patients.find(p => p.id === service.patientId);
                    const diagnosis = getPatientDiagnosis(service.patientId);
                    
                    return (
                      <div key={service.id} className="p-4 border border-border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{patient?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Patient ID: {patient?.id}
                            </p>
                            {diagnosis && (
                              <p className="text-xs text-muted-foreground">
                                Diagnosis: {diagnosis.diagnosis}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold">₦{service.totalAmount.toLocaleString()}</p>
                            <Badge variant="default">Paid</Badge>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Prescribed Medications:</p>
                          <div className="space-y-2">
                            {diagnosis?.prescriptions.map((prescription) => (
                              <div key={prescription.id} className="p-2 bg-muted/30 rounded text-sm space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{prescription.drugName}</span>
                                  <span>Qty: {prescription.quantity}</span>
                                </div>
                                <p className="text-muted-foreground text-xs">
                                  {prescription.instructions}
                                </p>
                                <p className="text-xs">
                                  Unit Price: ₦{prescription.price.toLocaleString()} × {prescription.quantity} = ₦{(prescription.price * prescription.quantity).toLocaleString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <Button 
                          onClick={() => handleDispenseMedication(service.id)}
                          variant="success" 
                          className="w-full"
                        >
                          <Package className="w-4 h-4" />
                          Dispense Medication
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dispensed Prescriptions */}
          <Card className="bg-gradient-card border-0 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Dispensed Prescriptions
              </CardTitle>
              <CardDescription>
                Recent dispensed medications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dispensedPrescriptions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No dispensed prescriptions</p>
                ) : (
                  dispensedPrescriptions.map((service) => {
                    const patient = patients.find(p => p.id === service.patientId);
                    const diagnosis = getPatientDiagnosis(service.patientId);
                    
                    return (
                      <div key={service.id} className="p-4 border border-border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{patient?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Patient ID: {patient?.id}
                            </p>
                            {service.completedAt && (
                              <p className="text-xs text-muted-foreground">
                                Dispensed: {service.completedAt.toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold">₦{service.totalAmount.toLocaleString()}</p>
                            <Badge variant="secondary">Dispensed</Badge>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Medications Dispensed:</p>
                          <div className="space-y-2">
                            {diagnosis?.prescriptions.map((prescription) => (
                              <div key={prescription.id} className="flex items-center justify-between text-sm">
                                <span>{prescription.drugName} (Qty: {prescription.quantity})</span>
                                <CheckCircle className="w-4 h-4 text-success" />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}