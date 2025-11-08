import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Upload, Loader2, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import * as pdfjsLib from 'pdfjs-dist';
import jsPDF from 'jspdf';

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

  const handleDownloadPDF = () => {
    if (!result || !result.summary) {
      toast({
        title: "No summary available",
        description: "Please process a document first",
        variant: "destructive",
      });
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      const bulletIndent = 5;
      
      // Add title with background
      doc.setFillColor(139, 92, 246); // Purple color
      doc.rect(0, 0, pageWidth, 35, 'F');
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255); // White text
      doc.text('DOCUMENT SUMMARY', pageWidth / 2, 20, { align: 'center' });
      
      // Add metadata section
      doc.setTextColor(0, 0, 0); // Black text
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const date = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text(`Generated: ${date}`, margin, 45);
      
      // Add original filename if available
      if (file) {
        doc.text(`Source: ${file.name}`, margin, 52);
      }
      
      // Add separator line
      doc.setLineWidth(0.3);
      doc.setDrawColor(139, 92, 246);
      doc.line(margin, 58, pageWidth - margin, 58);
      
      // Process summary content - remove emojis and clean formatting
      let summaryText = result.summary;
      
      // Remove emojis (they don't render well in PDF)
      summaryText = summaryText.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
      
      // Remove check marks and other unicode symbols
      summaryText = summaryText.replace(/[✓✔✅❌⚠️💡]/g, '');
      
      // Split by lines first
      const lines = summaryText.split('\n').filter(line => line.trim());
      
      let currentY = 68;
      const normalLineHeight = 6;
      const headingSpacing = 8;
      const bulletSpacing = 5;
      
      lines.forEach((line, index) => {
        line = line.trim();
        if (!line) return;
        
        // Check if it's a heading (typically bold text, section headers)
        // Headings are usually: ALL CAPS, end with colon, or short and bold
        const isHeading = 
          (line.length < 100 && (
            line === line.toUpperCase() || 
            line.endsWith(':') ||
            /^[A-Z][^.!?]*:$/.test(line) ||
            /^\*\*[^*]+\*\*:?$/.test(line)
          ));
        
        // Check if it's a bullet point
        const isBullet = /^[-•*]\s/.test(line) || /^\d+\.\s/.test(line);
        
        // Remove markdown bold markers if present
        line = line.replace(/\*\*/g, '');
        
        // Remove bullet markers for custom rendering
        let bulletText = line;
        if (isBullet) {
          bulletText = line.replace(/^[-•*]\s/, '').replace(/^\d+\.\s/, '');
        }
        
        if (isHeading) {
          // Add extra space before headings (except first one)
          if (index > 0) {
            currentY += headingSpacing;
          }
          
          // Check if heading fits on page
          if (currentY + 15 > pageHeight - 30) {
            doc.addPage();
            currentY = margin;
          }
          
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
          doc.setTextColor(139, 92, 246); // Purple color for headings
          
          const headingLines = doc.splitTextToSize(bulletText, maxWidth);
          headingLines.forEach((hLine: string) => {
            doc.text(hLine, margin, currentY);
            currentY += normalLineHeight + 1;
          });
          
          doc.setTextColor(0, 0, 0); // Reset to black
          currentY += 2;
          
        } else if (isBullet) {
          // Check if bullet fits on page
          if (currentY + 10 > pageHeight - 30) {
            doc.addPage();
            currentY = margin;
          }
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          
          // Draw bullet point
          doc.circle(margin + 2, currentY - 1.5, 0.8, 'F');
          
          // Add bullet text with proper wrapping
          const bulletLines = doc.splitTextToSize(bulletText, maxWidth - bulletIndent - 3);
          bulletLines.forEach((bLine: string, bIndex: number) => {
            doc.text(bLine, margin + bulletIndent, currentY);
            currentY += normalLineHeight;
          });
          
          currentY += bulletSpacing - normalLineHeight;
          
        } else {
          // Regular text
          if (currentY + 10 > pageHeight - 30) {
            doc.addPage();
            currentY = margin;
          }
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          
          const textLines = doc.splitTextToSize(bulletText, maxWidth);
          textLines.forEach((tLine: string) => {
            doc.text(tLine, margin, currentY);
            currentY += normalLineHeight;
          });
          
          currentY += 2;
        }
      });
      
      // Add footer on all pages
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          'Generated by NyaAI Document Summarizer',
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
        doc.text(
          `Page ${i} of ${totalPages}`,
          pageWidth - margin,
          pageHeight - 10,
          { align: 'right' }
        );
      }
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const filename = `document-summary-${timestamp}.pdf`;
      
      // Save the PDF
      doc.save(filename);
      
      toast({
        title: "Success!",
        description: `PDF downloaded as ${filename}`,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
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
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl flex items-center gap-2">
                          <span className="text-2xl">✅</span>
                          Document Summary
                        </CardTitle>
                        <Button
                          onClick={handleDownloadPDF}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download PDF
                        </Button>
                      </div>
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
