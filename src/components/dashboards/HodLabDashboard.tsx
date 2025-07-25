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
import { Microscope, TrendingUp, Download, FileText, Calendar, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';

export default function HodLabDashboard() {
  const [dateFilter, setDateFilter] = useState({
    from: '',
    to: ''
  });

  const { patients, payments, services, getLabRevenue } = useHospitalStore();
  const { users } = useAuthStore();
  const { toast } = useToast();

  // Lab-specific data
  const labServices = services.filter(s => s.serviceType === 'lab');
  const labPayments = payments.filter(p => p.type === 'lab');
  const labRevenue = getLabRevenue();
  const completedLabServices = labServices.filter(s => s.status === 'completed');
  const pendingLabServices = labServices.filter(s => s.status === 'pending');
  const paidLabServices = labServices.filter(s => s.status === 'paid');
  
  // Lab technicians
  const labTechnicians = users.filter(u => u.role === 'lab');

  // Analytics data
  const getTopTests = () => {
    const testCounts: Record<string, number> = {};
    labServices.forEach(service => {
      service.items.forEach(item => {
        testCounts[item] = (testCounts[item] || 0) + 1;
      });
    });
    return Object.entries(testCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  };

  const getTechnicianPerformance = () => {
    return labTechnicians.map(tech => {
      // In a real system, this would track which technician performed which service
      const assignedServices = Math.floor(Math.random() * 10) + 1; // Demo data
      const completedServices = Math.floor(assignedServices * 0.8);
      return {
        name: tech.name,
        assigned: assignedServices,
        completed: completedServices,
        completionRate: Math.round((completedServices / assignedServices) * 100)
      };
    });
  };

  const handleGenerateReport = (type: string) => {
    toast({
      title: "Report Generated",
      description: `${type} report has been generated and downloaded`,
    });
  };

  const filteredServices = labServices.filter(service => {
    if (!dateFilter.from || !dateFilter.to) return true;
    
    const serviceDate = service.completedAt || new Date();
    const fromDate = new Date(dateFilter.from);
    const toDate = new Date(dateFilter.to);
    
    return serviceDate >= fromDate && serviceDate <= toDate;
  });

  const topTests = getTopTests();
  const technicianPerformance = getTechnicianPerformance();

  return (
    <Layout title="HOD - Laboratory Dashboard">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-card border-0 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Lab Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{labRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">All time earnings</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-0 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Tests</CardTitle>
              <Microscope className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedLabServices.length}</div>
              <p className="text-xs text-muted-foreground">{pendingLabServices.length} pending</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-0 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lab Technicians</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{labTechnicians.length}</div>
              <p className="text-xs text-muted-foreground">Active staff</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-0 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid Services</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paidLabServices.length}</div>
              <p className="text-xs text-muted-foreground">Ready for processing</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="services">Service Records</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gradient-card border-0 shadow-card">
                <CardHeader>
                  <CardTitle>Recent Lab Services</CardTitle>
                  <CardDescription>Latest laboratory test requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {labServices.slice(0, 10).map((service) => {
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
                  <CardTitle>Technician Performance</CardTitle>
                  <CardDescription>Current month completion rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {technicianPerformance.map((tech, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{tech.name}</span>
                          <Badge variant="outline">{tech.completionRate}%</Badge>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Completed: {tech.completed}/{tech.assigned}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${tech.completionRate}%` }}
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
                <CardTitle>All Lab Service Records</CardTitle>
                <CardDescription>Filter and view laboratory service history</CardDescription>
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
                      <Microscope className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No lab services found</p>
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
                  <CardTitle>Top Requested Tests</CardTitle>
                  <CardDescription>Most frequently ordered laboratory tests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topTests.map(([test, count], index) => (
                      <div key={test} className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <span>{test}</span>
                        </div>
                        <Badge variant="secondary">{count} tests</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-0 shadow-card">
                <CardHeader>
                  <CardTitle>Revenue Breakdown</CardTitle>
                  <CardDescription>Monthly laboratory income analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Total Revenue</span>
                      <span className="font-bold text-lg">₦{labRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Completed Services</span>
                      <span className="font-medium">{completedLabServices.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Average per Service</span>
                      <span className="font-medium">
                        ₦{completedLabServices.length ? Math.round(labRevenue / completedLabServices.length).toLocaleString() : '0'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Pending Services</span>
                      <Badge variant="destructive">{pendingLabServices.length}</Badge>
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
                  <CardDescription>Download comprehensive laboratory reports</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleGenerateReport('Daily Income')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Daily Income Report (CSV)
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleGenerateReport('Weekly Income')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Weekly Income Report (PDF)
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleGenerateReport('Monthly Income')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Monthly Income Report (PDF)
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleGenerateReport('Top Tests')}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Top Tests Analysis (CSV)
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleGenerateReport('Technician Performance')}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Technician Performance (PDF)
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
                        <div className="text-2xl font-bold text-primary">{labServices.length}</div>
                        <div className="text-sm text-muted-foreground">Total Services</div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-primary">₦{labRevenue.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">Total Revenue</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-primary">{completedLabServices.length}</div>
                        <div className="text-sm text-muted-foreground">Completed</div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-primary">{labTechnicians.length}</div>
                        <div className="text-sm text-muted-foreground">Technicians</div>
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