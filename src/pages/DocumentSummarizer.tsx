import React, { useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Upload, Loader2, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

const DocumentSummarizer = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [error, setError] = useState<string>('');

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove the data:...;base64, prefix
        const base64String = base64.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleSummarize = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError('');
    setSummary('');

    try {
      const base64String = await convertToBase64(file);

      const response = await fetch('https://c6wexpmuxi.execute-api.us-east-1.amazonaws.com/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdf_base64: base64String
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to summarize document: ${response.statusText}`);
      }

      const data = await response.json();
      setSummary(data.summary);
      
      toast({
        title: 'Success!',
        description: 'Document summarized successfully',
      });
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to process document';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      
      if (validTypes.includes(droppedFile.type)) {
        setFile(droppedFile);
        setSummary('');
        setError('');
      } else {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a PDF, DOC, DOCX, or TXT file',
          variant: 'destructive'
        });
      }
    }
  }, [toast]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setSummary('');
      setError('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-background flex items-center justify-center">
        <div className="absolute inset-0 z-0"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 80%, hsl(var(--primary) / 0.15) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, hsl(var(--primary-glow) / 0.15) 0%, transparent 50%)
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
      {/* Animated background gradients */}
      <div className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 80%, hsl(var(--primary) / 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, hsl(var(--primary-glow) / 0.15) 0%, transparent 50%)
          `
        }}
      />
      
      <Navigation />
      
      <div className="relative z-10 container mx-auto px-4 pt-24 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="max-w-4xl mx-auto glass hover-lift">
            <CardHeader>
              <motion.div 
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="relative">
                  <FileText className="h-8 w-8 text-primary" />
                  <motion.div
                    className="absolute inset-0"
                    animate={{
                      boxShadow: [
                        '0 0 20px hsl(var(--primary) / 0.3)',
                        '0 0 40px hsl(var(--primary) / 0.5)',
                        '0 0 20px hsl(var(--primary) / 0.3)',
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
                <div>
                  <CardTitle className="text-3xl">Document Summarizer</CardTitle>
                  <CardDescription className="mt-2">
                    Upload legal documents and get AI-powered summaries instantly
                  </CardDescription>
                </div>
              </motion.div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Drop Zone */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                className={`
                  relative border-2 border-dashed rounded-lg p-12 text-center transition-all duration-300
                  ${isDragging 
                    ? 'border-primary bg-primary/10 scale-105' 
                    : 'border-border hover:border-primary/50 hover:bg-primary/5'
                  }
                `}
              >
                <AnimatePresence mode="wait">
                  {!file ? (
                    <motion.div
                      key="upload"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Upload className="h-16 w-16 mx-auto text-primary" />
                      </motion.div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">
                          Drop your document here
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          or click to browse
                        </p>
                        <input
                          type="file"
                          id="file-upload"
                          className="hidden"
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={handleFileInput}
                        />
                        <Button
                          onClick={() => document.getElementById('file-upload')?.click()}
                          className="gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          Choose File
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Supported formats: PDF, DOC, DOCX, TXT
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="file"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="space-y-4"
                    >
                      <motion.div
                        initial={{ rotate: 0 }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <CheckCircle2 className="h-16 w-16 mx-auto text-success" />
                      </motion.div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">
                          {file.name}
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <div className="flex gap-3 justify-center">
                          <Button
                            onClick={handleSummarize}
                            disabled={isProcessing}
                            className="gap-2"
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4" />
                                Summarize
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => {
                              setFile(null);
                              setSummary('');
                              setError('');
                            }}
                            variant="outline"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Summary Display */}
              <AnimatePresence>
                {summary && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -20, height: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card className="border-primary/20 bg-primary/5">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-primary" />
                          Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="prose prose-sm dark:prose-invert max-w-none"
                        >
                          <p className="whitespace-pre-wrap text-foreground leading-relaxed">
                            {summary}
                          </p>
                        </motion.div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex items-center gap-2 p-4 border border-destructive/20 bg-destructive/10 rounded-lg"
                  >
                    <XCircle className="h-5 w-5 text-destructive" />
                    <p className="text-destructive">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default DocumentSummarizer;
