import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { User, MapPin, Phone, Mail, Briefcase, FileText, Clock, CheckCircle, LogOut, Star, MessageSquare, Users } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Chat from './components/Chat';
import { supabase } from '@/integrations/supabase/client';

const LawyerDashboard = () => {
  const { profile, updateProfile, signOut, user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [selectedClient, setSelectedClient] = useState(null);
  
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    location: profile?.location || '',
    specialization: profile?.specialization || '',
    license_number: profile?.license_number || '',
    experience_years: profile?.experience_years || 0,
    availability: profile?.availability ?? true,
  });

  React.useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        location: profile.location || '',
        specialization: profile.specialization || '',
        license_number: profile.license_number || '',
        experience_years: profile.experience_years || 0,
        availability: profile.availability ?? true,
      });
    }
  }, [profile]);

  useEffect(() => {
    if (user && profile?.role === 'lawyer') {
      loadClients();
      loadRatings();
    }
  }, [user, profile]);

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          user_id,
          last_contacted,
          profiles!contacts_user_id_fkey (
            name,
            email
          )
        `)
        .eq('lawyer_id', user?.id)
        .order('last_contacted', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadRatings = async () => {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select(`
          *,
          profiles!ratings_user_id_fkey (
            name
          )
        `)
        .eq('lawyer_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRatings(data || []);
      
      // Calculate average rating
      if (data && data.length > 0) {
        const total = data.reduce((sum, rating) => sum + rating.rating, 0);
        setAverageRating(total / data.length);
      }
    } catch (error) {
      console.error('Error loading ratings:', error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await updateProfile(formData);
      
      if (error) {
        toast({
          title: "Update Failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Profile Updated",
          description: "Your profile has been successfully updated.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Spline 3D Background */}
      <div className="absolute inset-0 z-0">
        <iframe 
          src="https://my.spline.design/worldplanet-CMjrskBh7SPlIOLUf4luIIay/" 
          frameBorder="0" 
          width="100%" 
          height="100%"
          className="w-full h-full"
        />
      </div>
      <div className="absolute inset-0 bg-background/10 z-[1]" />
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Lawyer Dashboard</h1>
              <p className="text-muted-foreground">Manage your professional profile and client connections</p>
            </div>
            <Button variant="outline" onClick={handleSignOut} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="ratings" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Ratings & Reviews
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Profile Form */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Professional Profile
                    </CardTitle>
                    <CardDescription>
                      Update your professional information to help clients find and connect with you
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      {/* Basic Information */}
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Full Name
                          </Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Enter your full name"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email Address
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="your.email@example.com"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Phone Number
                          </Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+91 98765 43210"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="location" className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Location
                          </Label>
                          <Input
                            id="location"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            placeholder="City, State"
                          />
                        </div>
                      </div>

                      {/* Professional Information */}
                      <Separator />
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Briefcase className="h-5 w-5" />
                          Professional Details
                        </h3>
                        
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="specialization">Specialization</Label>
                            <Select 
                              value={formData.specialization} 
                              onValueChange={(value) => setFormData({ ...formData, specialization: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select your specialization" />
                              </SelectTrigger>
                              <SelectContent>
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
                          <div className="space-y-2">
                            <Label htmlFor="license" className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              License Number
                            </Label>
                            <Input
                              id="license"
                              value={formData.license_number}
                              onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                              placeholder="Bar Council License Number"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="experience" className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Years of Experience
                          </Label>
                          <Input
                            id="experience"
                            type="number"
                            min="0"
                            max="50"
                            value={formData.experience_years}
                            onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
                            placeholder="Number of years"
                          />
                        </div>
                      </div>

                      {/* Availability */}
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-base font-medium">Availability Status</Label>
                          <p className="text-sm text-muted-foreground">
                            Toggle your availability for new client consultations
                          </p>
                        </div>
                        <Switch
                          checked={formData.availability}
                          onCheckedChange={(checked) => setFormData({ ...formData, availability: checked })}
                        />
                      </div>

                      <Button type="submit" disabled={loading} className="w-full">
                        {loading ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            Updating Profile...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Update Profile
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Profile Status & Stats */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Profile Status</CardTitle>
                    <CardDescription>Complete your profile to attract more clients</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Profile Completion</span>
                        <span>{Math.round(
                          (Object.values(formData).filter(value => 
                            value !== '' && value !== 0 && value !== false
                          ).length / Object.keys(formData).length) * 100
                        )}%</span>
                      </div>
                      <Progress 
                        value={
                          (Object.values(formData).filter(value => 
                            value !== '' && value !== 0 && value !== false
                          ).length / Object.keys(formData).length) * 100
                        } 
                        className="h-2"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Availability Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${formData.availability ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="font-medium">
                        {formData.availability ? 'Available for consultations' : 'Currently unavailable'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="clients" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Client Connections
                </CardTitle>
                <CardDescription>
                  Clients who have contacted you previously
                </CardDescription>
              </CardHeader>
              <CardContent>
                {clients.length > 0 ? (
                  <div className="space-y-4">
                    {clients.map((client) => (
                      <div key={client.user_id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{client.profiles?.name}</h4>
                            <p className="text-sm text-muted-foreground">{client.profiles?.email}</p>
                            <p className="text-xs text-muted-foreground">
                              Last contacted: {new Date(client.last_contacted).toLocaleDateString()}
                            </p>
                          </div>
                          <Button 
                            size="sm"
                            onClick={() => {
                              setSelectedClient(client.user_id);
                              setActiveTab('messages');
                            }}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Chat
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No client connections yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Client Messages
                </CardTitle>
                <CardDescription>
                  Communicate with your clients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Chat selectedClient={selectedClient} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ratings" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Rating Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <div className="text-4xl font-bold text-yellow-500 flex items-center justify-center gap-2">
                      <Star className="h-8 w-8 fill-current" />
                      {averageRating.toFixed(1)}
                    </div>
                    <p className="text-muted-foreground">
                      Based on {ratings.length} review{ratings.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  {ratings.length > 0 ? (
                    <div className="space-y-4 max-h-64 overflow-y-auto">
                      {ratings.slice(0, 5).map((rating) => (
                        <div key={rating.id} className="p-3 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex text-yellow-500">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-4 w-4 ${i < rating.rating ? 'fill-current' : ''}`} 
                                />
                              ))}
                            </div>
                            <span className="text-sm font-medium">{rating.profiles?.name}</span>
                          </div>
                          {rating.review && (
                            <p className="text-sm text-muted-foreground">{rating.review}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(rating.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No reviews yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LawyerDashboard;