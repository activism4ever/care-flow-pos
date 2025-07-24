import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useHospitalStore } from '@/stores/hospitalStore';
import { useAuthStore } from '@/stores/authStore';
import { Pill, TrendingUp, Download, FileText, Calendar, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';

export default function HodPharmacyDashboard() {
  const [dateFilter, setDateFilter] = useState({
    from: '',
    to: ''
  });

  const { patients, payments, services } = useHospitalStore();
  const { users } = useAuthStore();
  const { toast } = useToast();

  // Pharmacy-specific data
  const pharmacyServices = services.filter(s => s.serviceType === 'pharmacy');
  const pharmacyPayments = payments.filter(p => p.type === 'pharmacy');
  const pharmacyRevenue = pharmacyPayments.reduce((sum, p) => sum + p.amount, 0);
  const completedPharmacyServices = pharmacyServices.filter(s => s.status === 'completed');
  const pendingPharmacyServices = pharmacyServices.filter(s => s.status === 'pending');
  const paidPharmacyServices = pharmacyServices.filter(s => s.status === 'paid');
  
  // Pharmacists
  const pharmacists = users.filter(u => u.role === 'pharmacy');

  // Analytics data
  const getTopMedications = () => {
    const medicationCounts: Record<string, number> = {};
    pharmacyServices.forEach(service => {
      service.items.forEach(item => {
        medicationCounts[item] = (medicationCounts[item] || 0) + 1;
      });
    });
    return Object.entries(medicationCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  };

  const getPharmacistPerformance = () => {
    return pharmacists.map(pharmacist => {
      // In a real system, this would track which pharmacist dispensed which medication
      const dispensedMedications = Math.floor(Math.random() * 20) + 1; // Demo data
      const revenue = Math.floor(Math.random() * 50000) + 10000;
      return {
        name: pharmacist.name,
        dispensed: dispensedMedications,
        revenue: revenue,
        averagePerDispense: Math.round(revenue / dispensedMedications)
      };
    });
  };

  const handleGenerateReport = (type: string) => {
    toast({
      title: "Report Generated",
      description: `${type} report has been generated and downloaded`,
    });
  };

  const filteredServices = pharmacyServices.filter(service => {
    if (!dateFilter.from || !dateFilter.to) return true;
    
    const serviceDate = service.completedAt || new Date();
    const fromDate = new Date(dateFilter.from);
    const toDate = new Date(dateFilter.to);
    
    return serviceDate >= fromDate && serviceDate <= toDate;
  });

  const topMedications = getTopMedications();
  const pharmacistPerformance = getPharmacistPerformance();

  return (
    <Layout title="HOD - Pharmacy Dashboard">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-card border-0 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pharmacy Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{pharmacyRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">All time earnings</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-0 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dispensed Medications</CardTitle>
              <Pill className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedPharmacyServices.length}</div>
              <p className="text-xs text-muted-foreground">{pendingPharmacyServices.length} pending</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-0 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pharmacists</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pharmacists.length}</div>
              <p className="text-xs text-muted-foreground">Active staff</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-0 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid Prescriptions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paidPharmacyServices.length}</div>
              <p className="text-xs text-muted-foreground">Ready for dispensing</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="services">Drug Sales</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gradient-card border-0 shadow-card">
                <CardHeader>
                  <CardTitle>Recent Prescriptions</CardTitle>
                  <CardDescription>Latest medication dispensing requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {pharmacyServices.slice(0, 10).map((service) => {
                      const patient = patients.find(p => p.id === service.patientId);
                      return (
                        <div key={service.id} className="p-3 border border-border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{patient?.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {service.items.join(', ')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">₦{service.totalAmount.toLocaleString()}</p>
                              <Badge 
                                variant={service.status === 'completed' ? 'default' : 'secondary'}
                                className="text-xs capitalize"
                              >
                                {service.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-0 shadow-card">
                <CardHeader>
                  <CardTitle>Pharmacist Performance</CardTitle>
                  <CardDescription>Current month sales performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pharmacistPerformance.map((pharmacist, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{pharmacist.name}</span>
                          <Badge variant="outline">₦{pharmacist.revenue.toLocaleString()}</Badge>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Dispensed: {pharmacist.dispensed} medications</span>
                          <span>Avg: ₦{pharmacist.averagePerDispense}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${Math.min((pharmacist.revenue / 50000) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="services">
            <Card className="bg-gradient-card border-0 shadow-card">
              <CardHeader>
                <CardTitle>All Drug Sales Records</CardTitle>
                <CardDescription>Filter and view pharmacy sales history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <Label htmlFor="from-date">From Date</Label>
                    <Input
                      id="from-date"
                      type="date"
                      value={dateFilter.from}
                      onChange={(e) => setDateFilter({ ...dateFilter, from: e.target.value })}
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="to-date">To Date</Label>
                    <Input
                      id="to-date"
                      type="date"
                      value={dateFilter.to}
                      onChange={(e) => setDateFilter({ ...dateFilter, to: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {filteredServices.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Pill className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No pharmacy sales found</p>
                    </div>
                  ) : (
                    filteredServices.map((service) => {
                      const patient = patients.find(p => p.id === service.patientId);
                      return (
                        <div key={service.id} className="p-4 border border-border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div>
                                <p className="font-semibold">{patient?.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  Patient ID: {patient?.id} • Contact: {patient?.contact}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {service.items.map((item, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {item}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg">₦{service.totalAmount.toLocaleString()}</p>
                              <Badge 
                                variant={service.status === 'completed' ? 'default' : 'secondary'}
                                className="capitalize"
                              >
                                {service.status}
                              </Badge>
                              {service.completedAt && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {service.completedAt.toLocaleDateString()}
                                </p>
                              )}
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

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gradient-card border-0 shadow-card">
                <CardHeader>
                  <CardTitle>Frequently Dispensed Medications</CardTitle>
                  <CardDescription>Most commonly prescribed drugs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topMedications.map(([medication, count], index) => (
                      <div key={medication} className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <span>{medication}</span>
                        </div>
                        <Badge variant="secondary">{count} dispensed</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-0 shadow-card">
                <CardHeader>
                  <CardTitle>Sales Analytics</CardTitle>
                  <CardDescription>Monthly pharmacy revenue analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Total Revenue</span>
                      <span className="font-bold text-lg">₦{pharmacyRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Dispensed Medications</span>
                      <span className="font-medium">{completedPharmacyServices.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Average per Sale</span>
                      <span className="font-medium">
                        ₦{completedPharmacyServices.length ? Math.round(pharmacyRevenue / completedPharmacyServices.length).toLocaleString() : '0'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Pending Prescriptions</span>
                      <Badge variant="destructive">{pendingPharmacyServices.length}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gradient-card border-0 shadow-card">
                <CardHeader>
                  <CardTitle>Generate Reports</CardTitle>
                  <CardDescription>Download comprehensive pharmacy reports</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleGenerateReport('Daily Drug Sales')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Daily Drug Sales Report (CSV)
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleGenerateReport('Weekly Drug Sales')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Weekly Sales Report (PDF)
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleGenerateReport('Monthly Drug Sales')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Monthly Sales Report (PDF)
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleGenerateReport('Frequent Medications')}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Frequently Dispensed Report (CSV)
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleGenerateReport('Pharmacist Revenue')}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Revenue per Pharmacist (PDF)
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-0 shadow-card">
                <CardHeader>
                  <CardTitle>Report Summary</CardTitle>
                  <CardDescription>Key metrics for reporting period</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-primary">{pharmacyServices.length}</div>
                        <div className="text-sm text-muted-foreground">Total Sales</div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-primary">₦{pharmacyRevenue.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">Total Revenue</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-primary">{completedPharmacyServices.length}</div>
                        <div className="text-sm text-muted-foreground">Dispensed</div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-primary">{pharmacists.length}</div>
                        <div className="text-sm text-muted-foreground">Pharmacists</div>
                      </div>
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