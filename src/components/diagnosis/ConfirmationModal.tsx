import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, FlaskConical, Pill, User } from 'lucide-react';

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  contact: string;
}

interface LabTest {
  id: string;
  name: string;
  price: number;
}

interface Prescription {
  drugName: string;
  dosage: string;
  quantity: number;
  instructions: string;
  price: number;
}

interface ConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient;
  diagnosis: string;
  selectedLabTests: string[];
  availableLabTests: LabTest[];
  prescriptions: Prescription[];
  onConfirm: () => void;
  loading?: boolean;
}

export default function ConfirmationModal({
  open,
  onOpenChange,
  patient,
  diagnosis,
  selectedLabTests,
  availableLabTests,
  prescriptions,
  onConfirm,
  loading = false
}: ConfirmationModalProps) {
  const selectedTests = availableLabTests.filter(test => selectedLabTests.includes(test.id));
  const labTotal = selectedTests.reduce((sum, test) => sum + test.price, 0);
  const pharmacyTotal = prescriptions.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  const grandTotal = labTotal + pharmacyTotal;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Confirm Diagnosis
          </DialogTitle>
          <DialogDescription>
            Please review the diagnosis details before completing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <h3 className="font-semibold">Patient Information</h3>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{patient.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Patient ID</p>
                  <p className="font-medium">{patient.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Age</p>
                  <p className="font-medium">{patient.age} years</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="font-medium">{patient.gender}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Diagnosis */}
          <div className="space-y-3">
            <h3 className="font-semibold">Diagnosis</h3>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p>{diagnosis}</p>
            </div>
          </div>

          {/* Lab Tests */}
          {selectedTests.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4" />
                <h3 className="font-semibold">Lab Tests ({selectedTests.length})</h3>
              </div>
              <div className="space-y-2">
                {selectedTests.map((test) => (
                  <div key={test.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span>{test.name}</span>
                    <span className="font-medium">₦{test.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="font-semibold">Lab Tests Subtotal</span>
                <span className="font-semibold">₦{labTotal.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Prescriptions */}
          {prescriptions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4" />
                <h3 className="font-semibold">Prescriptions ({prescriptions.length})</h3>
              </div>
              <div className="space-y-3">
                {prescriptions.map((prescription, index) => (
                  <div key={index} className="p-3 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium">{prescription.drugName}</p>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>Dosage: {prescription.dosage}</span>
                          <span>Qty: {prescription.quantity}</span>
                        </div>
                        {prescription.instructions && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Instructions: {prescription.instructions}
                          </p>
                        )}
                      </div>
                      <span className="font-medium">₦{(prescription.price * prescription.quantity).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="font-semibold">Pharmacy Subtotal</span>
                <span className="font-semibold">₦{pharmacyTotal.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Grand Total */}
          {grandTotal > 0 && (
            <>
              <Separator />
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total Amount</span>
                <span>₦{grandTotal.toLocaleString()}</span>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Review Again
          </Button>
          <Button onClick={onConfirm} variant="medical" disabled={loading}>
            {loading ? 'Completing...' : 'Complete Diagnosis'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}