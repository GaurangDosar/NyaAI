import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Award, Search, CheckCircle2, FileText, Calendar, IndianRupee, User, MapPin, Briefcase, Loader2, Sparkles, Bookmark, BookmarkCheck } from 'lucide-react';

interface Scheme {
  id: string;
  name: string;
  description: string;
  benefits: string;
  category: string;
  state: string;
  eligibility?: string;
  howToApply?: string;
  documents?: string[];
  deadline?: string;
  officialWebsite?: string;
  personalizedReason?: string;
}

const GovernmentSchemes = () => {
  const { user, loading: authLoading, profile } = useAuth();
  const { toast } = useToast();
  const [searching, setSearching] = useState(false);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [totalEligible, setTotalEligible] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [savingScheme, setSavingScheme] = useState<string | null>(null);
  const [savedSchemeIds, setSavedSchemeIds] = useState<Set<string>>(new Set());
  
  const [formData, setFormData] = useState({
    applicantName: profile?.name || '',
    age: '',
    gender: '',
    income: '',
    parentIncome: '',
    occupation: '',
    state: '',
    areaType: '',
    caste: '',
    isDisabled: '',
    isMinority: '',
    isStudent: ''
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.age || !formData.gender || !formData.occupation || !formData.state || !formData.areaType || !formData.caste || !formData.isDisabled || !formData.isMinority || !formData.isStudent) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setSearching(true);
    
    try {
      console.log('Searching for schemes with data:', formData);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }
      
      console.log('Making fetch request to government-schemes function...');
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/government-schemes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicantName: formData.applicantName,
          age: parseInt(formData.age),
          gender: formData.gender,
          income: formData.income ? parseFloat(formData.income) : null,
          parentIncome: formData.parentIncome ? parseFloat(formData.parentIncome) : null,
          occupation: formData.occupation,
          state: formData.state,
          areaType: formData.areaType,
          caste: formData.caste,
          isDisabled: formData.isDisabled === 'yes',
          isMinority: formData.isMinority === 'yes',
          isStudent: formData.isStudent === 'yes'
        }),
      });

      console.log('Response status:', response.status, response.statusText);
      const result = await response.json();
      
      console.log('API Response:', result);
      
      if (result.error) {
        throw new Error(result.error);
      }

      setSchemes(result.schemes || []);
      setTotalEligible(result.total_eligible || 0);
      setShowResults(true);
      
      toast({
        title: "Search Complete!",
        description: result.message || `Found ${result.total_eligible} eligible schemes for you.`,
      });
    } catch (error) {
      console.error('Error searching schemes:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Search Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setSearching(false);
    }
  };

  const handleSaveScheme = async (scheme: Scheme) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to save schemes",
        variant: "destructive"
      });
      return;
    }

    setSavingScheme(scheme.id);

    try {
      // Check if already saved
      const { data: existing } = await supabase
        .from('saved_schemes')
        .select('id')
        .eq('user_id', user.id)
        .eq('scheme_name', scheme.name)
        .single();

      if (existing) {
        toast({
          title: "Already Saved",
          description: "This scheme is already in your saved list",
        });
        setSavedSchemeIds(prev => new Set(prev).add(scheme.id));
        return;
      }

      // Save the scheme
      const { error } = await supabase
        .from('saved_schemes')
        .insert({
          user_id: user.id,
          scheme_name: scheme.name,
          scheme_description: scheme.description,
          scheme_benefits: scheme.benefits,
          scheme_category: scheme.category,
          scheme_state: scheme.state,
          scheme_eligibility: scheme.eligibility,
          scheme_how_to_apply: scheme.howToApply,
          scheme_documents: scheme.documents,
          scheme_deadline: scheme.deadline,
          scheme_official_website: scheme.officialWebsite,
          personalized_reason: scheme.personalizedReason
        });

      if (error) throw error;

      setSavedSchemeIds(prev => new Set(prev).add(scheme.id));
      
      toast({
        title: "Scheme Saved!",
        description: "You can view this scheme in your dashboard",
      });
    } catch (error) {
      console.error('Error saving scheme:', error);
      toast({
        title: "Failed to Save",
        description: error instanceof Error ? error.message : 'Failed to save scheme',
        variant: "destructive"
      });
    } finally {
      setSavingScheme(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-background flex items-center justify-center">
        <div className="absolute inset-0 z-0"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 80%, hsl(280 100% 60% / 0.15) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, hsl(290 80% 70% / 0.15) 0%, transparent 50%)
            `
          }}
        />
        <div className="relative z-10">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Purple radial gradients */}
      <div className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 80%, hsl(280 100% 60% / 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, hsl(290 80% 70% / 0.15) 0%, transparent 50%)
          `
        }}
      />
      
      <Navigation />
      
      <div className="relative z-10 container mx-auto px-4 pt-24 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Award className="h-12 w-12 text-primary" />
              <h1 className="text-4xl font-bold">Government Schemes Advisor</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Discover government schemes you're eligible for based on your profile
            </p>
          </div>

          {/* Search Form */}
          {!showResults && (
            <Card className="glass mb-8">
              <CardHeader>
                <CardTitle className="text-2xl">Your Profile</CardTitle>
                <CardDescription>
                  Tell us about yourself to find schemes tailored for you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearch} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Full Name *
                      </Label>
                      <Input
                        id="name"
                        value={formData.applicantName}
                        onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="age" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Age *
                      </Label>
                      <Input
                        id="age"
                        type="number"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        placeholder="Enter your age"
                        min="1"
                        max="120"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender *</Label>
                      <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
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
                      <Label htmlFor="income" className="flex items-center gap-2">
                        <IndianRupee className="h-4 w-4" />
                        Annual Income (Optional)
                      </Label>
                      <Input
                        id="income"
                        type="number"
                        value={formData.income}
                        onChange={(e) => setFormData({ ...formData, income: e.target.value })}
                        placeholder="Enter annual income"
                        min="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="occupation" className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Occupation *
                      </Label>
                      <Select value={formData.occupation} onValueChange={(value) => setFormData({ ...formData, occupation: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select occupation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="farmer">Farmer</SelectItem>
                          <SelectItem value="self-employed">Self Employed</SelectItem>
                          <SelectItem value="salaried">Salaried</SelectItem>
                          <SelectItem value="unemployed">Unemployed</SelectItem>
                          <SelectItem value="business">Business Owner</SelectItem>
                          <SelectItem value="retired">Retired</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state" className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        State *
                      </Label>
                      <Select value={formData.state} onValueChange={(value) => setFormData({ ...formData, state: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your state" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          <SelectItem value="andhra-pradesh">Andhra Pradesh</SelectItem>
                          <SelectItem value="arunachal-pradesh">Arunachal Pradesh</SelectItem>
                          <SelectItem value="assam">Assam</SelectItem>
                          <SelectItem value="bihar">Bihar</SelectItem>
                          <SelectItem value="chhattisgarh">Chhattisgarh</SelectItem>
                          <SelectItem value="goa">Goa</SelectItem>
                          <SelectItem value="gujarat">Gujarat</SelectItem>
                          <SelectItem value="haryana">Haryana</SelectItem>
                          <SelectItem value="himachal-pradesh">Himachal Pradesh</SelectItem>
                          <SelectItem value="jharkhand">Jharkhand</SelectItem>
                          <SelectItem value="karnataka">Karnataka</SelectItem>
                          <SelectItem value="kerala">Kerala</SelectItem>
                          <SelectItem value="madhya-pradesh">Madhya Pradesh</SelectItem>
                          <SelectItem value="maharashtra">Maharashtra</SelectItem>
                          <SelectItem value="manipur">Manipur</SelectItem>
                          <SelectItem value="meghalaya">Meghalaya</SelectItem>
                          <SelectItem value="mizoram">Mizoram</SelectItem>
                          <SelectItem value="nagaland">Nagaland</SelectItem>
                          <SelectItem value="odisha">Odisha</SelectItem>
                          <SelectItem value="punjab">Punjab</SelectItem>
                          <SelectItem value="rajasthan">Rajasthan</SelectItem>
                          <SelectItem value="sikkim">Sikkim</SelectItem>
                          <SelectItem value="tamil-nadu">Tamil Nadu</SelectItem>
                          <SelectItem value="telangana">Telangana</SelectItem>
                          <SelectItem value="tripura">Tripura</SelectItem>
                          <SelectItem value="uttar-pradesh">Uttar Pradesh</SelectItem>
                          <SelectItem value="uttarakhand">Uttarakhand</SelectItem>
                          <SelectItem value="west-bengal">West Bengal</SelectItem>
                          <SelectItem value="andaman-nicobar">Andaman and Nicobar Islands</SelectItem>
                          <SelectItem value="chandigarh">Chandigarh</SelectItem>
                          <SelectItem value="dadra-nagar-haveli">Dadra and Nagar Haveli and Daman and Diu</SelectItem>
                          <SelectItem value="delhi">Delhi</SelectItem>
                          <SelectItem value="jammu-kashmir">Jammu and Kashmir</SelectItem>
                          <SelectItem value="ladakh">Ladakh</SelectItem>
                          <SelectItem value="lakshadweep">Lakshadweep</SelectItem>
                          <SelectItem value="puducherry">Puducherry</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="areaType">Area Type *</Label>
                      <Select value={formData.areaType} onValueChange={(value) => setFormData({ ...formData, areaType: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select area type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="urban">Urban</SelectItem>
                          <SelectItem value="rural">Rural</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="caste">Caste Category *</Label>
                      <Select value={formData.caste} onValueChange={(value) => setFormData({ ...formData, caste: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select caste category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="obc">Other Backward Class (OBC)</SelectItem>
                          <SelectItem value="sc">Scheduled Caste (SC)</SelectItem>
                          <SelectItem value="st">Scheduled Tribe (ST)</SelectItem>
                          <SelectItem value="pvtg">Particularly Vulnerable Tribal Group (PVTG)</SelectItem>
                          <SelectItem value="dnt">De-Notified, Nomadic, and Semi-Nomadic (DNT)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="isDisabled">Do you identify as a person with a disability? *</Label>
                      <Select value={formData.isDisabled} onValueChange={(value) => setFormData({ ...formData, isDisabled: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="isMinority">Do you belong to a minority? *</Label>
                      <Select value={formData.isMinority} onValueChange={(value) => setFormData({ ...formData, isMinority: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="isStudent">Are you a student? *</Label>
                      <Select value={formData.isStudent} onValueChange={(value) => setFormData({ ...formData, isStudent: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="parentIncome" className="flex items-center gap-2">
                        <IndianRupee className="h-4 w-4" />
                        Parent/Guardian Annual Income (Optional)
                      </Label>
                      <Input
                        id="parentIncome"
                        type="number"
                        value={formData.parentIncome}
                        onChange={(e) => setFormData({ ...formData, parentIncome: e.target.value })}
                        placeholder="Enter parent/guardian annual income"
                        min="0"
                      />
                    </div>
                  </div>

                  <Button type="submit" size="lg" className="w-full" disabled={searching}>
                    {searching ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Searching for Schemes...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-5 w-5" />
                        Find Eligible Schemes
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {showResults && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Your Eligible Schemes</h2>
                  <p className="text-muted-foreground">
                    Found {totalEligible} scheme{totalEligible !== 1 ? 's' : ''} matching your profile
                  </p>
                </div>
                <Button variant="outline" onClick={() => setShowResults(false)}>
                  Modify Search
                </Button>
              </div>

              {schemes.length === 0 ? (
                <Card className="glass">
                  <CardContent className="text-center py-12">
                    <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Schemes Found</h3>
                    <p className="text-muted-foreground">
                      We couldn't find any schemes matching your current profile. Try modifying your search criteria.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {schemes.map((scheme, index) => (
                    <Card key={scheme.id} className="glass hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary">{scheme.category}</Badge>
                              {scheme.state && <Badge variant="outline">{scheme.state}</Badge>}
                            </div>
                            <CardTitle className="text-2xl mb-2">{scheme.name}</CardTitle>
                            <CardDescription className="text-base">{scheme.description}</CardDescription>
                          </div>
                          <div className="flex items-center gap-2 text-primary">
                            <Sparkles className="h-6 w-6" />
                            <span className="text-sm font-medium">#{index + 1}</span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {scheme.personalizedReason && (
                          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                            <h4 className="font-semibold mb-2 flex items-center gap-2 text-primary">
                              <Sparkles className="h-4 w-4" />
                              Why this is perfect for you
                            </h4>
                            <p className="text-sm">{scheme.personalizedReason}</p>
                          </div>
                        )}

                        {scheme.benefits && (
                          <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              Benefits
                            </h4>
                            <p className="text-muted-foreground">{scheme.benefits}</p>
                          </div>
                        )}

                        {scheme.eligibility && (
                          <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Eligibility
                            </h4>
                            <p className="text-muted-foreground text-sm">{scheme.eligibility}</p>
                          </div>
                        )}

                        {scheme.howToApply && (
                          <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              How to Apply
                            </h4>
                            <p className="text-muted-foreground text-sm">{scheme.howToApply}</p>
                          </div>
                        )}

                        {scheme.documents && scheme.documents.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Required Documents</h4>
                            <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
                              {scheme.documents.map((doc, idx) => (
                                <li key={idx}>{doc}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {scheme.deadline && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              <strong>Deadline:</strong> {scheme.deadline}
                            </span>
                          </div>
                        )}

                        <Separator />

                        <div className="flex flex-wrap gap-4">
                          {scheme.officialWebsite && scheme.officialWebsite !== 'Visit nearest government office' && (
                            <Button 
                              className="flex-1" 
                              onClick={() => window.open(scheme.officialWebsite, '_blank')}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Visit Official Website
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleSaveScheme(scheme)}
                            disabled={savingScheme === scheme.id || savedSchemeIds.has(scheme.id)}
                          >
                            {savingScheme === scheme.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : savedSchemeIds.has(scheme.id) ? (
                              <>
                                <BookmarkCheck className="mr-2 h-4 w-4" />
                                Saved
                              </>
                            ) : (
                              <>
                                <Bookmark className="mr-2 h-4 w-4" />
                                Save Scheme
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GovernmentSchemes;
