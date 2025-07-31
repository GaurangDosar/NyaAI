import React, { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Loader, CheckCircle, AlertCircle } from 'lucide-react';

interface Document {
  id: string;
  filename: string;
  status: 'processing' | 'completed' | 'failed';
  summary?: string;
  created_at: string;
}

const DocumentUpload = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Load user documents
  React.useEffect(() => {
    if (user) {
      loadDocuments();
    }
  }, [user]);

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments((data || []) as Document[]);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

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
      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Extract text content for processing
      const textContent = await extractTextFromFile(selectedFile);

      // Save document record to database
      const { data: document, error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          filename: selectedFile.name,
          file_path: fileName,
          file_size: selectedFile.size,
          file_type: selectedFile.type,
          status: 'processing'
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Call AI summarization function
      const { data, error } = await supabase.functions.invoke('document-summarizer', {
        body: {
          documentId: document.id,
          content: textContent
        }
      });

      if (error) throw error;

      toast({
        title: "Document Uploaded",
        description: "Your document has been uploaded and is being processed.",
      });

      // Refresh documents list
      await loadDocuments();
      setSelectedFile(null);

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload document.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Loader className="h-4 w-4 animate-spin text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4" />;
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

      {/* Documents List */}
      {documents.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Your Documents</h3>
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getStatusIcon(doc.status)}
                    <div>
                      <h4 className="font-medium">{doc.filename}</h4>
                      <p className="text-sm text-muted-foreground">
                        Uploaded {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                      {doc.summary && (
                        <div className="mt-3 p-3 bg-muted rounded-lg">
                          <h5 className="font-medium mb-2">AI Summary:</h5>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {doc.summary}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    doc.status === 'completed' ? 'bg-green-100 text-green-800' :
                    doc.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {doc.status}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;