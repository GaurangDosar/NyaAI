import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { lazy, Suspense } from "react";

// Lazy load pages for better initial load performance
const Auth = lazy(() => import("./pages/Auth"));
const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AIChatbot = lazy(() => import("./pages/AIChatbot"));
const DocumentSummarizer = lazy(() => import("./pages/DocumentSummarizer"));
const GovernmentSchemes = lazy(() => import("./pages/GovernmentSchemes"));
const FindLawyers = lazy(() => import("./pages/FindLawyers"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-3"></div>
      <p className="text-sm text-muted-foreground">Loading page...</p>
    </div>
  </div>
);

// Protected Route Component - Requires Authentication
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-3"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

// Public Route Component - Redirects to dashboard if already logged in
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-3"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  // If user is already logged in and tries to access auth page, redirect to home
  if (user && window.location.pathname === '/auth') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// Main App Router
const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/" 
          element={
            <PublicRoute>
              <Index />
            </PublicRoute>
          } 
        />
        <Route 
          path="/auth" 
          element={
            <PublicRoute>
              <Auth />
            </PublicRoute>
          } 
        />
        
        {/* Protected Routes - Require Authentication */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/ai-chat" 
          element={
            <ProtectedRoute>
              <AIChatbot />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/document-summarizer" 
          element={
            <ProtectedRoute>
              <DocumentSummarizer />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/government-schemes" 
          element={
            <ProtectedRoute>
              <GovernmentSchemes />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/find-lawyers" 
          element={
            <ProtectedRoute>
              <FindLawyers />
            </ProtectedRoute>
          } 
        />
        
        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
