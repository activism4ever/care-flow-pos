import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pill, Plus, Trash2 } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Medication {
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

interface PrescriptionsSectionProps {
  availableMedications: Medication[];
  prescriptions: Prescription[];
  onPrescriptionsChange: (prescriptions: Prescription[]) => void;
}

const commonDosages = [
  '1x daily',
  '2x daily', 
  '3x daily',
  'After meals',
  'Before meals',
  'Before sleep',
  'As needed',
  'Every 4 hours',
  'Every 6 hours',
  'Every 8 hours',
  'Every 12 hours'
];

export default function PrescriptionsSection({ availableMedications, prescriptions, onPrescriptionsChange }: PrescriptionsSectionProps) {
  const [openPopovers, setOpenPopovers] = useState<Record<number, boolean>>({});

  const addPrescription = () => {
    const newPrescription: Prescription = {
      drugName: '',
      dosage: '',
      quantity: 1,
      instructions: '',
      price: 0,
    };
    onPrescriptionsChange([...prescriptions, newPrescription]);
  };

  const updatePrescription = (index: number, field: keyof Prescription, value: any) => {
    const updated = [...prescriptions];
    updated[index] = { ...updated[index], [field]: value };
    onPrescriptionsChange(updated);
  };

  const removePrescription = (index: number) => {
    onPrescriptionsChange(prescriptions.filter((_, i) => i !== index));
  };

  const setMedication = (index: number, medicationName: string) => {
    const medication = availableMedications.find(m => m.name === medicationName);
    updatePrescription(index, 'drugName', medicationName);
    updatePrescription(index, 'price', medication?.price || 0);
  };

  const togglePopover = (index: number, open: boolean) => {
    setOpenPopovers(prev => ({ ...prev, [index]: open }));
  };

  const getTotalCost = () => {
    return prescriptions.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  };

  const hasValidationErrors = () => {
    return prescriptions.some(p => p.drugName && !p.dosage);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pill className="w-4 h-4" />
          <Label>Prescriptions</Label>
          {prescriptions.length > 0 && (
            <span className="text-sm text-muted-foreground">
              ({prescriptions.length} medications - ₦{getTotalCost().toLocaleString()})
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={addPrescription}>
          <Plus className="w-4 h-4" />
          Add Medication
        </Button>
      </div>

      {hasValidationErrors() && (
        <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
          <p className="text-sm text-warning-foreground">
            ⚠️ Some medications are missing dosage information. Please complete all fields before proceeding.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {prescriptions.map((prescription, index) => (
          <div key={index} className="p-4 border border-border rounded-lg space-y-4">
            {/* Medication Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Medication *</Label>
                <Popover 
                  open={openPopovers[index] || false} 
                  onOpenChange={(open) => togglePopover(index, open)}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openPopovers[index] || false}
                      className="w-full justify-between"
                    >
                      {prescription.drugName || "Select medication..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search medications..." />
                      <CommandList>
                        <CommandEmpty>No medication found.</CommandEmpty>
                        <CommandGroup>
                          {availableMedications.map((medication) => (
                            <CommandItem
                              key={medication.id}
                              value={medication.name}
                              onSelect={() => {
                                setMedication(index, medication.name);
                                togglePopover(index, false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  prescription.drugName === medication.name ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex-1">
                                <div>{medication.name}</div>
                                <div className="text-sm text-muted-foreground">₦{medication.price}</div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Quantity</Label>
                <Input
                  type="number"
                  value={prescription.quantity}
                  onChange={(e) => updatePrescription(index, 'quantity', parseInt(e.target.value) || 1)}
                  min="1"
                  className="w-full"
                />
              </div>
            </div>

            {/* Dosage */}
            <div className="space-y-2">
              <Label className="text-sm">Dosage *</Label>
              <div className="flex gap-2">
                <Select
                  value={prescription.dosage}
                  onValueChange={(value) => updatePrescription(index, 'dosage', value)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select dosage" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonDosages.map((dosage) => (
                      <SelectItem key={dosage} value={dosage}>
                        {dosage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Or enter custom dosage..."
                  value={prescription.dosage}
                  onChange={(e) => updatePrescription(index, 'dosage', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-2">
              <Label className="text-sm">Additional Instructions</Label>
              <Input
                placeholder="e.g., Take with food, avoid alcohol..."
                value={prescription.instructions}
                onChange={(e) => updatePrescription(index, 'instructions', e.target.value)}
                className="w-full"
              />
            </div>

            {/* Total and Remove */}
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="font-medium">
                Total: ₦{(prescription.price * prescription.quantity).toLocaleString()}
              </span>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => removePrescription(index)}
              >
                <Trash2 className="w-4 h-4" />
                Remove
              </Button>
            </div>
          </div>
        ))}

        {prescriptions.length === 0 && (
          <div className="text-center text-muted-foreground py-8 border border-dashed border-border rounded-lg">
            No medications prescribed. Click "Add Medication" to start.
          </div>
        )}
      </div>
    </div>
  );
}