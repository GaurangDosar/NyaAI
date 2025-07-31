import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Search, MapPin, Phone, Mail, Briefcase, Clock, Star, Loader } from 'lucide-react';

interface Lawyer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  specialization?: string;
  experience_years?: number;
  license_number?: string;
  availability: boolean;
  ai_recommendation?: string;
}

const LawyerFinder = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [searched, setSearched] = useState(false);

  const [searchData, setSearchData] = useState({
    location: '',
    specialization: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setSearchData(prev => ({ ...prev, [field]: value }));
  };

  const handleSearchLawyers = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);

    try {
      const { data, error } = await supabase.functions.invoke('lawyer-finder', {
        body: {
          location: searchData.location,
          specialization: searchData.specialization
        }
      });

      if (error) throw error;

      setLawyers(data.lawyers || []);
      
      if (data.lawyers && data.lawyers.length > 0) {
        toast({
          title: "Lawyers Found",
          description: `Found ${data.lawyers.length} lawyers in your area.`,
        });
      } else {
        toast({
          title: "No Lawyers Found",
          description: "No lawyers found for your search criteria. Try expanding your search area.",
          variant: "destructive"
        });
      }

    } catch (error: any) {
      console.error('Lawyer search error:', error);
      toast({
        title: "Search Failed",
        description: error.message || "Failed to search for lawyers.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getExperienceColor = (years?: number) => {
    if (!years) return 'text-muted-foreground';
    if (years < 2) return 'text-yellow-600';
    if (years < 5) return 'text-blue-600';
    return 'text-green-600';
  };

  const getExperienceLevel = (years?: number) => {
    if (!years) return 'Not specified';
    if (years < 2) return 'Junior';
    if (years < 5) return 'Mid-level';
    if (years < 10) return 'Senior';
    return 'Expert';
  };

  const isFormValid = searchData.location.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Lawyers
          </CardTitle>
          <CardDescription>
            Search for qualified lawyers in your area by location and specialization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearchLawyers} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location *
                </Label>
                <Input
                  id="location"
                  value={searchData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="e.g., Mumbai, Delhi, Bangalore"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialization" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Specialization (Optional)
                </Label>
                <Select value={searchData.specialization} onValueChange={(value) => handleInputChange('specialization', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Specializations</SelectItem>
                    <SelectItem value="criminal">Criminal Law</SelectItem>
                    <SelectItem value="civil">Civil Law</SelectItem>
                    <SelectItem value="corporate">Corporate Law</SelectItem>
                    <SelectItem value="family">Family Law</SelectItem>
                    <SelectItem value="property">Property Law</SelectItem>
                    <SelectItem value="employment">Employment Law</SelectItem>
                    <SelectItem value="immigration">Immigration Law</SelectItem>
                    <SelectItem value="tax">Tax Law</SelectItem>
                    <SelectItem value="intellectual">Intellectual Property</SelectItem>
                    <SelectItem value="constitutional">Constitutional Law</SelectItem>
                  </SelectContent>
                </Select>
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
                  Searching Lawyers...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Find Lawyers
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
            {lawyers.length > 0 ? `Found ${lawyers.length} Lawyers` : 'No Lawyers Found'}
          </h3>
          
          {lawyers.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No lawyers found in your search area. Try expanding your location or search without specialization filters.
                </p>
              </CardContent>
            </Card>
          )}

          {lawyers.map((lawyer) => (
            <Card key={lawyer.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{lawyer.name}</CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      {lawyer.availability ? (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Available
                        </span>
                      ) : (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                          Unavailable
                        </span>
                      )}
                      {lawyer.experience_years && (
                        <span className={`text-xs font-medium ${getExperienceColor(lawyer.experience_years)}`}>
                          {getExperienceLevel(lawyer.experience_years)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Star className="h-5 w-5 text-yellow-500" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Contact Information */}
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{lawyer.email}</span>
                  </div>
                  {lawyer.phone && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{lawyer.phone}</span>
                    </div>
                  )}
                  {lawyer.location && (
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{lawyer.location}</span>
                    </div>
                  )}
                  {lawyer.experience_years && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{lawyer.experience_years} years experience</span>
                    </div>
                  )}
                </div>

                {/* Specialization */}
                {lawyer.specialization && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Specialization
                    </h4>
                    <p className="text-sm text-muted-foreground">{lawyer.specialization}</p>
                  </div>
                )}

                {/* License Number */}
                {lawyer.license_number && (
                  <div>
                    <h4 className="font-medium mb-1">License Number</h4>
                    <p className="text-sm text-muted-foreground">{lawyer.license_number}</p>
                  </div>
                )}

                {/* AI Recommendation */}
                {lawyer.ai_recommendation && (
                  <div className="p-3 bg-primary/5 rounded-lg">
                    <h4 className="font-medium mb-2 text-primary">Why This Lawyer?</h4>
                    <p className="text-sm text-muted-foreground">{lawyer.ai_recommendation}</p>
                  </div>
                )}

                {/* Contact Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" asChild>
                    <a href={`mailto:${lawyer.email}`}>
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </a>
                  </Button>
                  {lawyer.phone && (
                    <Button variant="outline" className="flex-1" asChild>
                      <a href={`tel:${lawyer.phone}`}>
                        <Phone className="h-4 w-4 mr-2" />
                        Call
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LawyerFinder;