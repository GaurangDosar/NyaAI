import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Loader, CheckCircle, AlertCircle } from 'lucide-react';

const DocumentUpload = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<string>('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF or DOCX file.",
          variant: "destructive"
        });
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 10MB.",
          variant: "destructive"
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result as string;
        // For demo purposes, we'll extract basic text content
        // In production, you'd use proper PDF/DOCX parsing libraries
        resolve(content.substring(0, 15000)); // Limit to first 15k characters
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setUploading(true);
    try {
      // Extract text content for processing
      const textContent = await extractTextFromFile(selectedFile);

      // Call AI summarization function
      const { data, error } = await fetch('/api/summarize-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: textContent,
          filename: selectedFile.name
        })
      }).then(res => res.json());

      if (error) throw new Error(error);

      setSummary(data.summary || "Document processed successfully.");

      toast({
        title: "Document Processed",
        description: "Your document has been analyzed and summarized.",
      });

      setSelectedFile(null);

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Processing Failed",
        description: error.message || "Failed to process document.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="border-dashed border-2 border-border/50">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Upload Legal Document</h3>
              <p className="text-muted-foreground mb-4">
                Supported formats: PDF, DOCX (Max 10MB)
              </p>
              <Input
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileSelect}
                className="max-w-sm mx-auto"
              />
            </div>
            {selectedFile && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Selected: {selectedFile.name}
                </p>
                <Button 
                  onClick={handleUpload} 
                  disabled={uploading}
                  className="w-full max-w-sm"
                >
                  {uploading ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload & Summarize
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Display */}
      {summary && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
              <div className="flex-1">
                <h4 className="font-medium mb-2">Document Summary</h4>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {summary}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DocumentUpload;