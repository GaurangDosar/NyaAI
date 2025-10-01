import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, User, Mail, Phone, MapPin } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { toast } from '@/hooks/use-toast';

const UserDashboard = () => {
  const { profile, signOut, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    location: profile?.location || '',
  });

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(formData);
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
      
      <Navigation />
      
      <div className="relative z-10 container mx-auto px-4 pt-24 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold">My Profile</h1>
            <Button variant="outline" onClick={handleSignOut} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center mb-8">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {getInitials(profile?.name || 'User')}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-semibold">{profile?.name}</h2>
                <p className="text-muted-foreground capitalize">{profile?.role}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Enter your email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Location
                    </Label>
                    <Input
                      id="location"
                      value={formData.location || ''}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Enter your location"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  {!isEditing ? (
                    <Button type="button" onClick={() => setIsEditing(true)} className="w-full">
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button type="submit" className="flex-1">
                        Save Changes
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({
                            name: profile?.name || '',
                            email: profile?.email || '',
                            phone: profile?.phone || '',
                            location: profile?.location || '',
                          });
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;