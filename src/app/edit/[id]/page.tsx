"use client";

import * as React from "react";
import { Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { DocumentChatEditor } from "@/components/DocumentChatEditor";
import { DocumentRepository } from "@/lib/document-repository";
import { useAuth } from "@/components/auth/AuthContext";
import { Document as SupabaseDocument } from "@/lib/supabase";

// Main component with Suspense boundary
export default function EditPage() {
  return (
    <Suspense fallback={
      <div className="container px-4 py-16 md:px-6 flex justify-center items-center">
        <div className="text-center">
          <p className="mb-4">Loading document...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    }>
      <EditPageContent />
    </Suspense>
  );
}

// Inner component using client-side hooks
function EditPageContent() {
  // Use the useParams hook to get the id parameter
  const params = useParams();
  const documentId = params.id as string;
  
  const router = useRouter();
  const { user, loading } = useAuth();
  
  const [documentData, setDocumentData] = React.useState<SupabaseDocument | null>(null);
  const [content, setContent] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState("");
  const [showPreview, setShowPreview] = React.useState(false);

  // Handle document update from chat
  const handleDocumentUpdate = (newContent: string) => {
    setContent(newContent);
    setDocumentData(prev => prev ? { ...prev, content: newContent } : null);
    autoSave(newContent, title);
  };

  // Auto-save function
  const autoSave = async (newContent: string, newTitle: string) => {
    if (!user || !documentId) return;
    
    setSaveStatus("Saving...");
    
    try {
      const success = await DocumentRepository.saveDocumentProgress(
        documentId,
        newContent,
        newTitle
      );
      
      if (success) {
        setSaveStatus("Saved");
        setTimeout(() => setSaveStatus(""), 2000);
      } else {
        setSaveStatus("Failed to save");
        setTimeout(() => setSaveStatus(""), 2000);
      }
    } catch (error) {
      console.error("Error auto-saving document:", error);
      setSaveStatus("Failed to save");
      setTimeout(() => setSaveStatus(""), 2000);
    }
  };

  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    autoSave(content, newTitle);
  };

  // Load document on initial render
  React.useEffect(() => {
    const fetchDocument = async () => {
      if (!loading) {
        if (!user) {
          router.push("/login");
          return;
        }

        setIsLoading(true);
        try {
          const doc = await DocumentRepository.getDocument(documentId);
          if (doc) {
            setDocumentData(doc);
            setTitle(doc.title);
            setContent(doc.content);
          } else {
            router.push("/my-documents");
          }
        } catch (error) {
          console.error("Error fetching document:", error);
          router.push("/my-documents");
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (documentId) {
      fetchDocument();
    }
  }, [documentId, user, loading, router]);

  // Download document as text
  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "document"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download document as PDF
  const handleDownloadPDF = async () => {
    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          title
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      // Get the PDF as a blob
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Create a link to download the PDF
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title || "document"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  // Save and finalize document
  const handleSave = async () => {
    if (!user || !documentData) return;

    setIsSaving(true);
    try {
      let updatedDoc: SupabaseDocument | null = null;
      
      if (documentData.is_draft) {
        // Finalize the document if it's a draft
        updatedDoc = await DocumentRepository.finalizeDraftDocument(documentId, title);
      } else {
        // Otherwise just update it
        updatedDoc = await DocumentRepository.updateDocument(documentId, {
          title,
          content,
          updated_at: new Date().toISOString(),
        });
      }

      if (updatedDoc) {
        setDocumentData(updatedDoc);
        setSaveStatus("Document saved successfully!");
        setTimeout(() => setSaveStatus(""), 3000);
      } else {
        alert("Failed to save document. Please try again.");
      }
    } catch (error) {
      console.error("Error saving document:", error);
      alert("Failed to save document. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Email document
  const handleEmail = async () => {
    const email = prompt("Enter your email address to receive the document:");
    
    if (!email) return;
    
    try {
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          content,
          title
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      alert(`Document successfully sent to ${email}`);
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Error sending email. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="container px-4 py-16 md:px-6 flex justify-center items-center">
        <div className="text-center">
          <p className="mb-4">Loading document...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!documentData) {
    return (
      <div className="container px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Document Not Found</h1>
        <p className="mb-8">The requested document could not be found.</p>
        <Button onClick={() => router.push("/my-documents")}>
          Back to My Documents
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-16 max-w-full px-0 md:px-4">
      {/* Title and toolbar */}
      <div className="px-4 md:px-6 mb-4 flex items-center justify-between">
        <div className="flex-1 mr-4">
          <Input
            value={title}
            onChange={handleTitleChange}
            className="font-bold text-xl"
            placeholder="Document Title"
          />
        </div>
        <div className="flex items-center space-x-2">
          {saveStatus && (
            <span className="text-sm text-muted-foreground">{saveStatus}</span>
          )}
          {documentData.is_draft && (
            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">Draft</span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/my-documents")}
          >
            Back
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100"
            >
            {isSaving ? "Saving..." : (documentData.is_draft ? "Save & Finalize" : "Save")}
          </Button>
        </div>
      </div>

      {/* Split view layout */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-13rem)]">
        {/* AI Chat panel */}
        <div className="lg:w-1/2 p-4 h-full overflow-hidden">
          <DocumentChatEditor
            documentContent={content}
            onDocumentUpdate={handleDocumentUpdate}
          />
        </div>

        {/* Document content panel */}
        <div className="lg:w-1/2 p-4 border-r border-border h-full overflow-y-auto">
          <Card className="h-full flex flex-col">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-lg flex justify-between items-center">
                <span>Document Content</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? "Edit Mode" : "Preview Mode"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex-grow overflow-y-auto">
              {showPreview ? (
                <div className="p-4 bg-muted rounded-md min-h-full">
                  <pre className="whitespace-pre-wrap font-mono">{content}</pre>
                </div>
              ) : (
                <textarea
                  value={content}
                  onChange={(e) => handleDocumentUpdate(e.target.value)}
                  className="w-full h-full min-h-[500px] p-4 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary resize-none font-mono bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              )}
            </CardContent>
            <CardFooter className="py-3 px-4 border-t">
              <div className="flex gap-2 w-full justify-end">
                <Button variant="outline" size="sm" onClick={handleEmail}>
                  Email
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                  PDF
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  Download
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}