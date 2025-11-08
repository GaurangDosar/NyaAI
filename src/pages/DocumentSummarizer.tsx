import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Upload, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import * as pdfjsLib from 'pdfjs-dist';

const DocumentSummarizer = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [dragActive, setDragActive] = useState(false);

  // Set up PDF.js worker on component mount
  useEffect(() => {
    // Use unpkg CDN which is more reliable than cdnjs
    const workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
    console.log('PDF.js worker configured:', workerSrc);
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
        setResult(null);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file",
          variant: "destructive",
        });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setResult(null);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file",
          variant: "destructive",
        });
      }
    }
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        useWorkerFetch: false,
        isEvalSupported: false,
      });
      
      const pdf = await loadingTask.promise;
      let fullText = '';

      console.log(`PDF loaded. Total pages: ${pdf.numPages}`);

      // Extract text from each page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n\n';
        
        console.log(`Extracted page ${i}/${pdf.numPages}`);
      }

      console.log(`Total text extracted: ${fullText.length} characters`);
      return fullText;
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a PDF file first",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    setResult(null);

    try {
      // Extract text from PDF
      toast({
        title: "Extracting text...",
        description: "Reading PDF content",
      });
      
      const pdfText = await extractTextFromPDF(file);
      console.log('Extracted text length:', pdfText.length, 'chars');

      // Convert extracted text to base64 for transmission
      const base64Content = btoa(unescape(encodeURIComponent(pdfText)));

      // Get the session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      toast({
        title: "Analyzing document...",
        description: "AI is reviewing your legal document",
      });

      console.log('Sending extracted text to Groq, size:', base64Content.length, 'chars');

      // Call edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/document-summarizer`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pdf_base64: base64Content,
          }),
        }
      );

      const data = await response.json();
      console.log('Received response:', data);
      
      // Set the entire response data (includes summary, raw_response, success, error)
      setResult(data);

      if (data.success && data.summary) {
        toast({
          title: "Success!",
          description: "Document processed successfully",
        });
      } else if (data.error) {
        toast({
          title: "AWS Error",
          description: data.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Processing complete",
          description: "Check the response below",
        });
      }
    } catch (error) {
      console.error('Error processing document:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to process document',
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

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
              <FileText className="h-8 w-8 text-primary" />
              <CardTitle className="text-3xl">Document Summarizer</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">
                {file ? file.name : 'Drop your PDF here or click to browse'}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Supports PDF files only
              </p>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf"
                onChange={handleFileChange}
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                Choose File
              </Button>
            </div>

            {/* Submit Button */}
            {file && !result && (
              <Button
                onClick={handleSubmit}
                disabled={processing}
                className="w-full"
                size="lg"
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Process Document
                  </>
                )}
              </Button>
            )}

            {/* Reset Button */}
            {result && (
              <Button
                onClick={() => {
                  setFile(null);
                  setResult(null);
                }}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Process Another Document
              </Button>
            )}

            {/* Results Display */}
            {result && (
              <div className="space-y-4">
                {/* Error Display */}
                {result.error && (
                  <Card className="bg-destructive/10 border-destructive/50">
                    <CardHeader>
                      <CardTitle className="text-xl text-destructive flex items-center gap-2">
                        <span className="text-2xl">⚠️</span>
                        AWS Processing Error
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="bg-destructive/5 p-4 rounded-lg border border-destructive/20">
                        <p className="text-sm font-semibold text-destructive mb-2">
                          Error Message:
                        </p>
                        <p className="text-sm text-destructive/90">
                          {result.error}
                        </p>
                      </div>
                      
                      {result.error.includes('Pipeline') && (
                        <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
                          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">
                            💡 AWS Lambda Configuration Issue:
                          </p>
                          <p className="text-sm text-blue-600/90 dark:text-blue-400/90 mb-3">
                            This is an AWS Lambda code issue. The Lambda function is reusing pipeline components 
                            between requests instead of creating new instances.
                          </p>
                          <div className="bg-blue-500/5 p-3 rounded border border-blue-500/10">
                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                              Required Fix (AWS Admin):
                            </p>
                            <ul className="text-xs text-blue-600/90 dark:text-blue-400/90 space-y-1 list-disc list-inside">
                              <li>Move pipeline initialization inside the request handler</li>
                              <li>Create new pipeline instances for each request</li>
                              <li>Avoid global/shared pipeline objects</li>
                              <li>Use request_id from payload to ensure isolation</li>
                            </ul>
                          </div>
                          <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-3">
                            Frontend workaround attempted: Sending unique request IDs, but Lambda code needs updating.
                          </p>
                        </div>
                      )}

                      {result.status && (
                        <p className="text-xs text-muted-foreground">
                          AWS Status Code: {result.status}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Summary Display */}
                {result.summary && (
                  <Card className="bg-card/50">
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <span className="text-2xl">✅</span>
                        Document Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {result.summary}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Raw Response (Collapsible) */}
                <details className="group">
                  <summary className="cursor-pointer">
                    <Card className="bg-card/50 hover:bg-card/70 transition-colors">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <span className="group-open:rotate-90 transition-transform">▶</span>
                          Technical Details (Click to expand)
                        </CardTitle>
                      </CardHeader>
                    </Card>
                  </summary>
                  <Card className="bg-card/50 mt-2">
                    <CardContent className="pt-6">
                      <pre className="whitespace-pre-wrap text-xs bg-background/50 p-4 rounded-lg overflow-auto max-h-96 font-mono">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </details>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DocumentSummarizer;
