import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Scale, UserCheck, Briefcase, Home } from 'lucide-react';

const Auth = () => {
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });

  const [signUpData, setSignUpData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user' as 'user' | 'lawyer',
    // Lawyer specific fields
    licenseNumber: '',
    specialization: '',
    experienceYears: '',
    courtLevel: '',
    barAssociation: '',
    practiceAreas: '',
    phone: '',
    location: ''
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(signInData.email, signInData.password);
      
      if (error) {
        toast({
          title: "Sign In Failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "Successfully signed in.",
        });
        navigate('/');
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (signUpData.password !== signUpData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    if (signUpData.password.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    try {
      const profileData: any = {
        name: signUpData.name,
        role: signUpData.role,
        phone: signUpData.phone,
        location: signUpData.location
      };

      // Add lawyer-specific data if role is lawyer
      if (signUpData.role === 'lawyer') {
        profileData.license_number = signUpData.licenseNumber;
        profileData.specialization = signUpData.specialization;
        profileData.experience_years = signUpData.experienceYears ? parseInt(signUpData.experienceYears) : undefined;
        profileData.court_level = signUpData.courtLevel;
        profileData.bar_association = signUpData.barAssociation;
        profileData.practice_areas = signUpData.practiceAreas;
      }

      const { error } = await signUp(signUpData.email, signUpData.password, profileData);
      
      if (error) {
        toast({
          title: "Sign Up Failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Account Created!",
          description: "Please check your email to verify your account.",
        });
        // Redirect to main page after successful signup
        navigate('/');
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

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
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
      
      {/* Home Button */}
      <Button 
        variant="ghost" 
        size="sm" 
        className="absolute top-4 left-4 z-10 glass border border-border/50 text-foreground hover:text-primary"
        onClick={() => navigate('/')}
      >
        <Home className="h-4 w-4 mr-2" />
        Home
      </Button>
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Scale className="h-16 w-16 text-primary drop-shadow-lg" />
            <span className="text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent drop-shadow-lg">
              NyaAI
            </span>
          </div>
          <h1 className="text-5xl font-bold mb-4 text-foreground drop-shadow-lg">Welcome</h1>
          <p className="text-xl text-foreground/90 font-medium drop-shadow">
            Empowering Justice Through AI
          </p>
        </div>

        <Card className="backdrop-blur-sm bg-card/80 border-border/50">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Get Started</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signInData.email}
                      onChange={(e) => setSignInData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Enter your password"
                      value={signInData.password}
                      onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Enter your full name"
                      value={signUpData.name}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Account Type</Label>
                    <Select value={signUpData.role} onValueChange={(value: 'user' | 'lawyer') => setSignUpData(prev => ({ ...prev, role: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4" />
                            User - Seeking Legal Help
                          </div>
                        </SelectItem>
                        <SelectItem value="lawyer">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            Lawyer - Legal Professional
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password"
                      value={signUpData.password}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={signUpData.confirmPassword}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                     required
                     />
                   </div>

                   {/* Lawyer-specific fields */}
                   {signUpData.role === 'lawyer' && (
                     <>
                       <div className="space-y-4 border-t border-border/50 pt-4 mt-4">
                         <h3 className="text-lg font-semibold text-foreground">Professional Details</h3>
                         
                         <div className="grid grid-cols-2 gap-3">
                           <div className="space-y-2">
                             <Label htmlFor="license-number">License Number *</Label>
                             <Input
                               id="license-number"
                               type="text"
                               placeholder="Bar License No."
                               value={signUpData.licenseNumber}
                               onChange={(e) => setSignUpData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                               required
                             />
                           </div>
                           <div className="space-y-2">
                             <Label htmlFor="experience">Experience (Years)</Label>
                             <Input
                               id="experience"
                               type="number"
                               placeholder="Years"
                               value={signUpData.experienceYears}
                               onChange={(e) => setSignUpData(prev => ({ ...prev, experienceYears: e.target.value }))}
                             />
                           </div>
                         </div>

                         <div className="space-y-2">
                           <Label htmlFor="specialization">Primary Specialization *</Label>
                           <Select value={signUpData.specialization} onValueChange={(value) => setSignUpData(prev => ({ ...prev, specialization: value }))}>
                             <SelectTrigger>
                               <SelectValue placeholder="Select specialization" />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="criminal">Criminal Law</SelectItem>
                               <SelectItem value="civil">Civil Law</SelectItem>
                               <SelectItem value="corporate">Corporate Law</SelectItem>
                               <SelectItem value="family">Family Law</SelectItem>
                               <SelectItem value="property">Property Law</SelectItem>
                               <SelectItem value="labor">Labor Law</SelectItem>
                               <SelectItem value="tax">Tax Law</SelectItem>
                               <SelectItem value="immigration">Immigration Law</SelectItem>
                               <SelectItem value="intellectual">Intellectual Property</SelectItem>
                               <SelectItem value="environmental">Environmental Law</SelectItem>
                             </SelectContent>
                           </Select>
                         </div>

                         <div className="space-y-2">
                           <Label htmlFor="court-level">Court Level Experience</Label>
                           <Select value={signUpData.courtLevel} onValueChange={(value) => setSignUpData(prev => ({ ...prev, courtLevel: value }))}>
                             <SelectTrigger>
                               <SelectValue placeholder="Select court level" />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="district">District Court</SelectItem>
                               <SelectItem value="sessions">Sessions Court</SelectItem>
                               <SelectItem value="high">High Court</SelectItem>
                               <SelectItem value="supreme">Supreme Court</SelectItem>
                               <SelectItem value="tribunal">Tribunal</SelectItem>
                               <SelectItem value="all">All Levels</SelectItem>
                             </SelectContent>
                           </Select>
                         </div>

                         <div className="grid grid-cols-2 gap-3">
                           <div className="space-y-2">
                             <Label htmlFor="phone">Phone Number</Label>
                             <Input
                               id="phone"
                               type="tel"
                               placeholder="Your contact number"
                               value={signUpData.phone}
                               onChange={(e) => setSignUpData(prev => ({ ...prev, phone: e.target.value }))}
                             />
                           </div>
                           <div className="space-y-2">
                             <Label htmlFor="location">City/Location</Label>
                             <Input
                               id="location"
                               type="text"
                               placeholder="Practice location"
                               value={signUpData.location}
                               onChange={(e) => setSignUpData(prev => ({ ...prev, location: e.target.value }))}
                             />
                           </div>
                         </div>

                         <div className="space-y-2">
                           <Label htmlFor="bar-association">Bar Association</Label>
                           <Input
                             id="bar-association"
                             type="text"
                             placeholder="State Bar Council"
                             value={signUpData.barAssociation}
                             onChange={(e) => setSignUpData(prev => ({ ...prev, barAssociation: e.target.value }))}
                           />
                         </div>

                         <div className="space-y-2">
                           <Label htmlFor="practice-areas">Additional Practice Areas</Label>
                           <Textarea
                             id="practice-areas"
                             placeholder="Other areas of practice (optional)"
                             value={signUpData.practiceAreas}
                             onChange={(e) => setSignUpData(prev => ({ ...prev, practiceAreas: e.target.value }))}
                             rows={2}
                           />
                         </div>
                       </div>
                     </>
                   )}

                   <Button type="submit" className="w-full" disabled={loading}>
                     {loading ? 'Creating Account...' : 'Create Account'}
                   </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;