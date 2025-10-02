import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award } from 'lucide-react';

const GovernmentSchemes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-8">
        <Card className="max-w-4xl mx-auto glass">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-primary" />
              <CardTitle className="text-3xl">Government Schemes</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                Government Schemes feature coming soon. This is where users will discover schemes they're eligible for.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GovernmentSchemes;
