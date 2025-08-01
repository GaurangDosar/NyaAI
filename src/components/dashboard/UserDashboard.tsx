import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, MessageSquare, Users, FileCheck, LogOut } from 'lucide-react';
import Navigation from '@/components/Navigation';
import DocumentUpload from './components/DocumentUpload';
import AIChat from './components/AIChat';
import GovernmentSchemes from './components/GovernmentSchemes';
import LawyerFinder from './components/LawyerFinder';

const UserDashboard = () => {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('documents');

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
              <h1 className="text-3xl font-bold mb-2">Welcome back, {profile?.name}!</h1>
              <p className="text-muted-foreground">Access all your legal AI tools in one place</p>
            </div>
            <Button variant="outline" onClick={handleSignOut} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              AI Lawyer
            </TabsTrigger>
            <TabsTrigger value="schemes" className="flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Gov Schemes
            </TabsTrigger>
            <TabsTrigger value="lawyers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Find Lawyers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Legal Document Summarizer
                </CardTitle>
                <CardDescription>
                  Upload PDF or DOCX legal documents to get AI-powered summaries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentUpload />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  AI Legal Consultation
                </CardTitle>
                <CardDescription>
                  Chat with our AI lawyer for legal guidance and advice
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AIChat />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schemes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  Government Schemes Advisor
                </CardTitle>
                <CardDescription>
                  Find government schemes you're eligible for based on your profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GovernmentSchemes />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lawyers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Nearby Lawyer Finder
                </CardTitle>
                <CardDescription>
                  Find qualified lawyers in your area based on specialization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LawyerFinder />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserDashboard;