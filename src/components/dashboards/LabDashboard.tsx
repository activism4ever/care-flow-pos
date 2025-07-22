import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useHospitalStore, availableLabTests } from '@/stores/hospitalStore';
import { FlaskConical, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';

export default function LabDashboard() {
  const { 
    patients, 
    services, 
    payments, 
    completeService,
    getPatientPayments,
    getPatientsByStatus 
  } = useHospitalStore();

  // Only show lab services for patients who have paid for lab tests
  const paidLabPatients = getPatientsByStatus('lab_referred').filter(p => 
    getPatientPayments(p.id).some(payment => payment.type === 'lab')
  );
  
  const { toast } = useToast();

  const labServices = services.filter(s => s.serviceType === 'lab');
  const pendingTests = labServices.filter(s => s.status === 'pending');
  const completedTests = labServices.filter(s => s.status === 'completed');

  const handleCompleteTest = (serviceId: string) => {
    completeService(serviceId);
    toast({
      title: "Lab test completed",
      description: "Test results have been marked as completed",
    });
  };

  const isServicePaid = (service: any) => {
    const patientPayments = getPatientPayments(service.patientId);
    return patientPayments.some(p => p.type === 'lab' && p.amount >= service.totalAmount);
  };

  return (
    <Layout title="Laboratory Dashboard">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-card border-0 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Tests</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingTests.length}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card border-0 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedTests.length}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card border-0 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Lab Services</CardTitle>
              <FlaskConical className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{labServices.length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Tests */}
          <Card className="bg-gradient-card border-0 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Pending Lab Tests
              </CardTitle>
              <CardDescription>
                Tests waiting to be performed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingTests.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No pending tests</p>
                ) : (
                  pendingTests.map((service) => {
                    const patient = patients.find(p => p.id === service.patientId);
                    const isPaid = isServicePaid(service);
                    
                    return (
                      <div key={service.id} className="p-4 border border-border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{patient?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Patient ID: {patient?.id}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">₦{service.totalAmount.toLocaleString()}</p>
                            <Badge variant={isPaid ? "default" : "destructive"}>
                              {isPaid ? "Paid" : "Unpaid"}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Required Tests:</p>
                          <div className="space-y-1">
                            {service.items.map((testId) => {
                              const test = availableLabTests.find(t => t.id === testId);
                              return (
                                <div key={testId} className="flex items-center justify-between text-sm">
                                  <span>{test?.name}</span>
                                  <span>₦{test?.price.toLocaleString()}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        
                        {isPaid ? (
                          <Button 
                            onClick={() => handleCompleteTest(service.id)}
                            variant="success" 
                            className="w-full"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Mark as Completed
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-destructive" />
                            <span className="text-sm text-destructive">
                              Waiting for payment confirmation
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Completed Tests */}
          <Card className="bg-gradient-card border-0 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Completed Tests
              </CardTitle>
              <CardDescription>
                Recent completed lab tests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {completedTests.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No completed tests</p>
                ) : (
                  completedTests.map((service) => {
                    const patient = patients.find(p => p.id === service.patientId);
                    
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
                                Completed: {service.completedAt.toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold">₦{service.totalAmount.toLocaleString()}</p>
                            <Badge variant="secondary">Completed</Badge>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Tests Performed:</p>
                          <div className="space-y-1">
                            {service.items.map((testId) => {
                              const test = availableLabTests.find(t => t.id === testId);
                              return (
                                <div key={testId} className="flex items-center justify-between text-sm">
                                  <span>{test?.name}</span>
                                  <CheckCircle className="w-4 h-4 text-success" />
                                </div>
                              );
                            })}
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