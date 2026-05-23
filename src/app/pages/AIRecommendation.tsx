import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Brain, Search, Pill, AlertCircle, CheckCircle } from 'lucide-react';
import { Badge } from '../components/ui/badge';

interface Recommendation {
  id: number;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  precautions: string[];
  sideEffects: string[];
  price: number;
  availability: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

const symptomDatabase: Record<string, Recommendation[]> = {
  'fever': [
    {
      id: 1,
      medicineName: 'Paracetamol',
      dosage: '500mg',
      frequency: 'Every 6 hours',
      duration: '3-5 days',
      precautions: ['Take after meals', 'Avoid alcohol'],
      sideEffects: ['Nausea', 'Skin rash (rare)'],
      price: 207.50,
      availability: 'In Stock'
    },
    {
      id: 2,
      medicineName: 'Ibuprofen',
      dosage: '400mg',
      frequency: 'Every 8 hours',
      duration: '3-5 days',
      precautions: ['Take with food', 'Not for stomach ulcer patients'],
      sideEffects: ['Stomach upset', 'Headache'],
      price: 290.50,
      availability: 'Low Stock'
    }
  ],
  'cough': [
    {
      id: 3,
      medicineName: 'Dextromethorphan Syrup',
      dosage: '10ml',
      frequency: 'Every 6 hours',
      duration: '5-7 days',
      precautions: ['Shake well before use', 'Avoid dairy before taking'],
      sideEffects: ['Drowsiness', 'Dizziness'],
      price: 498.00,
      availability: 'In Stock'
    }
  ],
  'cold': [
    {
      id: 4,
      medicineName: 'Cetirizine',
      dosage: '10mg',
      frequency: 'Once daily',
      duration: '5-7 days',
      precautions: ['May cause drowsiness', 'Avoid driving'],
      sideEffects: ['Dry mouth', 'Fatigue'],
      price: 166.00,
      availability: 'In Stock'
    }
  ],
  'headache': [
    {
      id: 5,
      medicineName: 'Aspirin',
      dosage: '75mg',
      frequency: 'As needed',
      duration: '1-3 days',
      precautions: ['Take with water', 'Not for children under 12'],
      sideEffects: ['Stomach irritation'],
      price: 124.50,
      availability: 'In Stock'
    }
  ],
  'diabetes': [
    {
      id: 6,
      medicineName: 'Metformin',
      dosage: '500mg',
      frequency: 'Twice daily',
      duration: 'As prescribed',
      precautions: ['Regular blood sugar monitoring', 'Take with meals'],
      sideEffects: ['Nausea', 'Diarrhea', 'Vitamin B12 deficiency'],
      price: 498.00,
      availability: 'Low Stock'
    }
  ],
  'pain': [
    {
      id: 7,
      medicineName: 'Paracetamol',
      dosage: '500mg',
      frequency: 'Every 6 hours',
      duration: 'As needed',
      precautions: ['Do not exceed 4g per day'],
      sideEffects: ['Rare allergic reactions'],
      price: 207.50,
      availability: 'In Stock'
    }
  ]
};

export function AIRecommendation() {
  const navigate = useNavigate();
  const [symptoms, setSymptoms] = useState('');
  const [disease, setDisease] = useState('');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = () => {
    setIsLoading(true);
    setSearched(true);
    
    // Simulate AI processing
    setTimeout(() => {
      const searchTerm = (symptoms + ' ' + disease).toLowerCase();
      let results: Recommendation[] = [];
      
      // Search through symptom database
      Object.keys(symptomDatabase).forEach(key => {
        if (searchTerm.includes(key)) {
          results = [...results, ...symptomDatabase[key]];
        }
      });

      // Remove duplicates
      results = results.filter((item, index, self) =>
        index === self.findIndex((t) => t.id === item.id)
      );

      setRecommendations(results);
      setIsLoading(false);
    }, 1500);
  };

  const handleAddToBill = (recommendation: Recommendation) => {
    const medicine = {
      transferId: `${recommendation.id}-${Date.now()}`,
      name: `${recommendation.medicineName} ${recommendation.dosage}`.trim(),
      price: recommendation.price,
    };

    localStorage.setItem("pendingBillMedicine", JSON.stringify(medicine));
    navigate("/dashboard/billing", { state: { medicine } });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 mb-2">
          <Brain className="w-8 h-8 text-purple-600" />
          <h1 className="text-2xl font-semibold text-gray-800">AI Medicine Recommendations</h1>
        </div>
        <p className="text-gray-600">Get intelligent medicine suggestions based on symptoms and diseases</p>
      </div>

      {/* Info Banner */}
      <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-purple-900 mb-1">Important Notice</h3>
            <p className="text-sm text-purple-800">
              These are AI-generated recommendations for reference only. Always consult a qualified healthcare professional before taking any medication. This system is designed to assist, not replace, professional medical advice.
            </p>
          </div>
        </div>
      </Card>

      {/* Search Form */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Enter Symptoms or Disease</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="symptoms">Symptoms</Label>
            <Textarea 
              id="symptoms"
              placeholder="e.g., fever, headache, body pain, fatigue..."
              rows={3}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="disease">Known Disease (Optional)</Label>
            <Input 
              id="disease"
              placeholder="e.g., Diabetes, Hypertension, Asthma..."
              value={disease}
              onChange={(e) => setDisease(e.target.value)}
            />
          </div>

          <Button 
            onClick={handleSearch}
            disabled={!symptoms && !disease}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            <Search className="w-4 h-4 mr-2" />
            Get AI Recommendations
          </Button>
        </div>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            <p className="text-gray-600">Analyzing symptoms and generating recommendations...</p>
          </div>
        </Card>
      )}

      {/* Results */}
      {!isLoading && searched && (
        <>
          {recommendations.length === 0 ? (
            <Card className="p-8">
              <div className="text-center text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <h3 className="font-medium text-gray-700 mb-2">No Recommendations Found</h3>
                <p className="text-sm">
                  Try different symptoms or keywords. Common searches: fever, cold, cough, headache, pain, diabetes
                </p>
              </div>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">
                  Recommended Medicines ({recommendations.length})
                </h3>
                <Badge className="bg-green-100 text-green-700">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  AI Verified
                </Badge>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {recommendations.map((rec) => (
                  <Card key={rec.id} className="p-5 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Pill className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{rec.medicineName}</h4>
                          <p className="text-sm text-gray-600">{rec.dosage}</p>
                        </div>
                      </div>
                      <Badge 
                        className={
                          rec.availability === 'In Stock' ? 'bg-green-100 text-green-700' :
                          rec.availability === 'Low Stock' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }
                      >
                        {rec.availability}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Frequency</p>
                          <p className="text-sm font-medium text-gray-800">{rec.frequency}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Duration</p>
                          <p className="text-sm font-medium text-gray-800">{rec.duration}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 mb-1">Precautions</p>
                        <ul className="space-y-1">
                          {rec.precautions.map((precaution, index) => (
                            <li key={index} className="text-sm text-gray-700 flex items-start">
                              <span className="text-orange-500 mr-2">•</span>
                              {precaution}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 mb-1">Possible Side Effects</p>
                        <ul className="space-y-1">
                          {rec.sideEffects.map((effect, index) => (
                            <li key={index} className="text-sm text-gray-700 flex items-start">
                              <span className="text-red-500 mr-2">•</span>
                              {effect}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                        <span className="text-lg font-semibold text-gray-800">₹{rec.price.toFixed(2)}</span>
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleAddToBill(rec)}
                          disabled={rec.availability === 'Out of Stock'}
                        >
                          Add to Bill
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Quick Search Suggestions */}
      {!searched && (
        <Card className="p-5">
          <h3 className="font-semibold text-gray-800 mb-3">Quick Search Suggestions</h3>
          <div className="flex flex-wrap gap-2">
            {['Fever', 'Headache', 'Cough', 'Cold', 'Pain', 'Diabetes'].map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                onClick={() => {
                  setSymptoms(suggestion);
                }}
                className="hover:bg-purple-50 hover:border-purple-300"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600 mb-1">Total Recommendations Generated</p>
          <p className="text-2xl font-semibold text-gray-800">1,245</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 mb-1">Accuracy Rate</p>
          <p className="text-2xl font-semibold text-green-600">94.5%</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 mb-1">Medicines in Database</p>
          <p className="text-2xl font-semibold text-gray-800">850+</p>
        </Card>
      </div>
    </div>
  );
}
