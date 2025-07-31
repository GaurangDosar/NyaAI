import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import UserDashboard from '@/components/dashboard/UserDashboard';
import LawyerDashboard from '@/components/dashboard/LawyerDashboard';
import { Navigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/auth" replace />;
  }

  if (profile.role === 'lawyer') {
    return <LawyerDashboard />;
  }

  return <UserDashboard />;
};

export default Dashboard;