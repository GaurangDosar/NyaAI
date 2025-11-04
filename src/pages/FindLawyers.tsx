import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

const FindLawyers = () => {
  const { user, loading } = useAuth();

  if (loading) {
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
        <Card className="max-w-4xl mx-auto glass">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <CardTitle className="text-3xl">Find Lawyers</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                Find Lawyers feature coming soon. This is where users will search for and connect with lawyers.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FindLawyers;
