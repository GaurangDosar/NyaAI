import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Search, Award, IndianRupee, Users, Loader } from 'lucide-react';

interface Scheme {
  id: string;
  name: string;
  description: string;
  benefits: string;
  category: string;
  state: string;
  ai_recommendation?: string;
}

const GovernmentSchemes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [searched, setSearched] = useState(false);

  const [formData, setFormData] = useState({
    applicantName: '',
    age: '',
    gender: '',
    income: '',
    occupation: '',
    location: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSearchSchemes = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);

    try {
      const { data, error } = await supabase.functions.invoke('government-schemes', {
        body: {
          applicantName: formData.applicantName,
          age: parseInt(formData.age),
          gender: formData.gender,
          income: formData.income ? parseFloat(formData.income) : null,
          occupation: formData.occupation,
          location: formData.location
        }
      });

      if (error) throw error;

      setSchemes(data.schemes || []);
      
      if (data.schemes && data.schemes.length > 0) {
        toast({
          title: "Schemes Found",
          description: `Found ${data.schemes.length} eligible schemes for you.`,
        });
      } else {
        toast({
          title: "No Schemes Found",
          description: "No eligible schemes found for your profile. Try adjusting your criteria.",
          variant: "destructive"
        });
      }

    } catch (error: any) {
      console.error('Schemes search error:', error);
      toast({
        title: "Search Failed",
        description: error.message || "Failed to search for schemes.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'housing':
        return '🏠';
      case 'agriculture':
        return '🌾';
      case 'health':
        return '🏥';
      case 'education':
        return '📚';
      case 'employment':
        return '💼';
      default:
        return '📋';
    }
  };

  const isFormValid = formData.applicantName && formData.age && formData.gender && formData.occupation && formData.location;

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Eligible Schemes
          </CardTitle>
          <CardDescription>
            Fill in your details to discover government schemes you're eligible for
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearchSchemes} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="applicantName">Full Name *</Label>
                <Input
                  id="applicantName"
                  value={formData.applicantName}
                  onChange={(e) => handleInputChange('applicantName', e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  min="1"
                  max="120"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  placeholder="Enter your age"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="income">Annual Income (₹)</Label>
                <Input
                  id="income"
                  type="number"
                  min="0"
                  value={formData.income}
                  onChange={(e) => handleInputChange('income', e.target.value)}
                  placeholder="Enter annual income (optional)"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="occupation">Occupation *</Label>
                <Select value={formData.occupation} onValueChange={(value) => handleInputChange('occupation', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select occupation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="farmer">Farmer</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="unemployed">Unemployed</SelectItem>
                    <SelectItem value="self-employed">Self Employed</SelectItem>
                    <SelectItem value="salaried">Salaried Employee</SelectItem>
                    <SelectItem value="business">Business Owner</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location (City, State) *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="e.g., Mumbai, Maharashtra"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading || !isFormValid}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Searching Schemes...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Find Eligible Schemes
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searched && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            {schemes.length > 0 ? `Found ${schemes.length} Eligible Schemes` : 'No Schemes Found'}
          </h3>
          
          {schemes.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No schemes match your current profile. Try adjusting your criteria or check back later for new schemes.
                </p>
              </CardContent>
            </Card>
          )}

          {schemes.map((scheme) => (
            <Card key={scheme.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{getCategoryIcon(scheme.category)}</div>
                    <div>
                      <CardTitle className="text-lg">{scheme.name}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                          {scheme.category}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {scheme.state}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Award className="h-5 w-5 text-yellow-500" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{scheme.description}</p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <IndianRupee className="h-4 w-4" />
                    Benefits
                  </h4>
                  <p className="text-sm text-muted-foreground">{scheme.benefits}</p>
                </div>

                {scheme.ai_recommendation && (
                  <div className="p-3 bg-primary/5 rounded-lg">
                    <h4 className="font-medium mb-2 text-primary">AI Recommendation</h4>
                    <p className="text-sm text-muted-foreground">{scheme.ai_recommendation}</p>
                  </div>
                )}

                <div className="pt-2">
                  <Button variant="outline" className="w-full">
                    Learn More & Apply
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default GovernmentSchemes;