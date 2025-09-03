import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { FlaskConical, Search } from 'lucide-react';

interface LabTest {
  id: string;
  name: string;
  price: number;
  description: string;
  category?: string; // Make category optional
}

interface LabTestsSectionProps {
  availableLabTests: LabTest[];
  selectedLabTests: string[];
  onSelectionChange: (testIds: string[]) => void;
}

// Categorize lab tests
const categorizeLabTests = (tests: LabTest[]) => {
  const categorized: Record<string, LabTest[]> = {
    'Blood Tests': [],
    'Imaging': [],
    'Other': []
  };

  tests.forEach(test => {
    const category = test.category || 'Other';
    if (!categorized[category]) {
      categorized[category] = [];
    }
    categorized[category].push(test);
  });

  return categorized;
};

export default function LabTestsSection({ availableLabTests, selectedLabTests, onSelectionChange }: LabTestsSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Add categories to lab tests if not already present
  const testsWithCategories = availableLabTests.map(test => ({
    ...test,
    category: test.category || (
      test.name.toLowerCase().includes('blood') || test.name.toLowerCase().includes('glucose') || test.name.toLowerCase().includes('cholesterol') ? 'Blood Tests' :
      test.name.toLowerCase().includes('x-ray') || test.name.toLowerCase().includes('scan') || test.name.toLowerCase().includes('ultrasound') ? 'Imaging' :
      'Other'
    )
  }));

  // Filter tests based on search query
  const filteredTests = testsWithCategories.filter(test =>
    test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    test.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categorizedTests = categorizeLabTests(filteredTests);

  const handleTestToggle = (testId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedLabTests, testId]);
    } else {
      onSelectionChange(selectedLabTests.filter(id => id !== testId));
    }
  };

  const getTotalCost = () => {
    return selectedLabTests.reduce((sum, testId) => {
      const test = availableLabTests.find(t => t.id === testId);
      return sum + (test?.price || 0);
    }, 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FlaskConical className="w-4 h-4" />
        <Label>Lab Tests Required</Label>
        {selectedLabTests.length > 0 && (
          <span className="text-sm text-muted-foreground">
            ({selectedLabTests.length} selected - ₦{getTotalCost().toLocaleString()})
          </span>
        )}
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search lab tests..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categorized tests */}
      <div className="space-y-4">
        {Object.entries(categorizedTests).map(([category, tests]) => {
          if (tests.length === 0) return null;
          
          return (
            <div key={category} className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">{category}</h4>
              <div className="space-y-2 pl-4 border-l-2 border-border">
                {tests.map((test) => (
                  <div key={test.id} className="flex items-start space-x-3">
                    <Checkbox
                      id={test.id}
                      checked={selectedLabTests.includes(test.id)}
                      onCheckedChange={(checked) => handleTestToggle(test.id, checked as boolean)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor={test.id} className="text-sm font-medium cursor-pointer">
                        {test.name}
                      </Label>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">{test.description}</p>
                        <span className="text-sm font-medium">₦{test.price.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {filteredTests.length === 0 && (
        <p className="text-center text-muted-foreground py-4">No lab tests found matching your search.</p>
      )}
    </div>
  );
}