"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { DocumentRepository } from "@/lib/document-repository";
import { useAuth } from "@/components/auth/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Document } from "@/lib/supabase";
import Link from "next/link";

// Safe decode URI component function that won't throw errors
const safeDecodeURIComponent = (str: string) => {
  if (!str) return "";
  
  try {
    // First try direct decoding
    return decodeURIComponent(str);
  } catch (e) {
    console.error("Error decoding URI component:", e);
    
    // If that fails, try to fix common encoding issues
    try {
      // Replace problematic character sequences
      const fixedStr = str
        .replace(/%(?![0-9A-Fa-f]{2})/g, '%25') // Fix broken percent encodings
        .replace(/\+/g, '%20');                 // Convert + to space encoding
      
      return decodeURIComponent(fixedStr);
    } catch (e2) {
      console.error("Failed second attempt at URI decoding:", e2);
      // If all else fails, return the original string
      return str;
    }
  }
};

export default function PreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [originalTitle, setOriginalTitle] = useState("");
  const [title, setTitle] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [isDraft, setIsDraft] = useState(true);
  const [contentChanged, setContentChanged] = useState(false);
  const [titleChanged, setTitleChanged] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const { user } = useAuth();
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadCompleted = useRef(false);
  
  // Get template ID and answers from search params
  const templateId = searchParams.get("templateId") || "";
  const existingDocId = searchParams.get("documentId") || null;
  const initialContentParam = searchParams.get("content") || "";
  const answersParam = searchParams.get("answers") || "{}";
  
  // Safely parse JSON for answers
  const answers = (() => {
    try {
      // First try to decode, then parse
      const decodedAnswers = safeDecodeURIComponent(answersParam);
      return JSON.parse(decodedAnswers);
    } catch (e) {
      console.error("Error parsing answers JSON:", e);
      return {};
    }
  })();

  // Handle content change
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setContentChanged(newContent !== originalContent);
  };

  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    setTitleChanged(newTitle !== originalTitle);
  };

  // Function to handle auto-saving (only used for logged-in users)
  const autoSaveDocument = async () => {
    if (!user || !documentId || (!contentChanged && !titleChanged)) return;
    
    setAutoSaveStatus("Saving...");
    
    try {
      const success = await DocumentRepository.saveDocumentProgress(
        documentId,
        content,
        title
      );
      
      if (success) {
        setAutoSaveStatus("Saved");
        setOriginalContent(content);
        setOriginalTitle(title);
        setContentChanged(false);
        setTitleChanged(false);
        setTimeout(() => setAutoSaveStatus(""), 2000);
      } else {
        setAutoSaveStatus("Failed to save");
        setTimeout(() => setAutoSaveStatus(""), 2000);
      }
    } catch (error) {
      console.error("Error auto-saving document:", error);
      setAutoSaveStatus("Failed to save");
      setTimeout(() => setAutoSaveStatus(""), 2000);
    }
  };

  // Create default title based on template
  useEffect(() => {
    if (templateId && !title) {
      const defaultTitle = `${templateId.replace(/-/g, " ")} - ${new Date().toLocaleDateString()}`;
      setTitle(defaultTitle);
      setOriginalTitle(defaultTitle);
    }
  }, [templateId, title]);

  // Handle initial document loading or creation
  useEffect(() => {
    // Prevent this effect from running multiple times
    if (initialLoadCompleted.current) return;
    
    const initializeDocument = async () => {
      setIsLoading(true);
      
      try {
        if (existingDocId && user) {
          // Load existing document if user is logged in
          const doc = await DocumentRepository.getDocument(existingDocId);
          if (doc) {
            setDocumentId(doc.id);
            setTitle(doc.title);
            setOriginalTitle(doc.title);
            setContent(doc.content);
            setOriginalContent(doc.content);
            setIsDraft(doc.is_draft);
            setIsInitialized(true);
          }
        } else if (initialContentParam && templateId) {
          // Process content safely
          let processedContent = initialContentParam;
          
          // Only try to decode if it looks like it might be encoded
          if (initialContentParam.includes('%')) {
            processedContent = safeDecodeURIComponent(initialContentParam);
          }
          
          // Set the content for non-logged-in users without saving to DB
          setContent(processedContent);
          setOriginalContent(processedContent);
          
          // For logged-in users, check for existing drafts
          if (user) {
            const existingDrafts = await DocumentRepository.getDraftsByTemplateId(user.id, templateId);
            
            if (existingDrafts.length > 0) {
              // Use the existing draft
              const existingDraft = existingDrafts[0];
              setDocumentId(existingDraft.id);
              setTitle(existingDraft.title);
              setOriginalTitle(existingDraft.title);
              setContent(existingDraft.content);
              setOriginalContent(existingDraft.content);
              setIsDraft(true);
              setAutoSaveStatus("Existing draft loaded");
              setTimeout(() => setAutoSaveStatus(""), 2000);
              setIsInitialized(true);
            } else {
              // Create a new draft only for logged-in users
              // Make sure we have a title before creating the document
              const docTitle = title || `${templateId.replace(/-/g, " ")} - ${new Date().toLocaleDateString()}`;
              
              const doc = await DocumentRepository.createDraftDocument(
                user.id,
                docTitle,
                processedContent,
                templateId,
                answers
              );
              
              if (doc) {
                setDocumentId(doc.id);
                setTitle(doc.title);
                setOriginalTitle(doc.title);
                setAutoSaveStatus("New draft created");
                setTimeout(() => setAutoSaveStatus(""), 2000);
                setIsInitialized(true);
              }
            }
          } else {
            // For non-logged-in users, just initialize with the content
            const docTitle = title || `${templateId.replace(/-/g, " ")} - ${new Date().toLocaleDateString()}`;
            setTitle(docTitle);
            setOriginalTitle(docTitle);
            setIsInitialized(true);
          }
        }
      } catch (error) {
        console.error("Error initializing document:", error);
      } finally {
        setIsLoading(false);
        initialLoadCompleted.current = true;
      }
    };
    
    initializeDocument();
  }, [user, existingDocId, initialContentParam, templateId, answers, title]);

  // Set up auto-save whenever content or title changes (only for logged-in users)
  useEffect(() => {
    if (!documentId || !user || !isInitialized) return;
    if (!contentChanged && !titleChanged) return;
    
    // Clear any existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    // Set a new timer for auto-save
    autoSaveTimerRef.current = setTimeout(() => {
      autoSaveDocument();
    }, 2000); // Auto-save after 2 seconds of inactivity
    
    // Clean up on unmount
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [content, title, documentId, user, contentChanged, titleChanged, isInitialized]);

  // Navigate to the split-screen edit page
  const handleEditWithAI = () => {
    if (!documentId && user) {
      // Need to save first to get a document ID
      handleSave();
      return;
    } else if (!documentId && !user) {
      // Show login prompt for non-logged in users
      setShowLoginPrompt(true);
      return;
    }
    
    // Navigate to the edit page with the split-screen layout
    router.push(`/edit/${documentId}`);
  };

  const handleEditClick = () => {
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    if (!user) {
      // Show login prompt if not logged in
      setShowLoginPrompt(true);
      return;
    }
    
    setIsSaving(true);
    try {
      let doc: Document | null = null;
      
      if (documentId) {
        // Finalize the existing draft document
        doc = await DocumentRepository.finalizeDraftDocument(documentId, title);
      } else {
        // Create a new document (not a draft)
        doc = await DocumentRepository.createDocument(
          user.id,
          title,
          content,
          templateId,
          answers
        );
      }
      
      if (doc) {
        setDocumentId(doc.id);
        setIsDraft(false);
        setIsSaved(true);
        setIsEditing(false);
        setOriginalContent(content);
        setOriginalTitle(title);
        setContentChanged(false);
        setTitleChanged(false);
        
        // Show success message for 3 seconds
        setTimeout(() => {
          setIsSaved(false);
        }, 3000);
      } else {
        alert("Error saving document. Please try again.");
      }
    } catch (error) {
      console.error("Error saving document:", error);
      alert("Error saving document. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

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

  return (
    <div className="container px-4 py-16 md:px-6">
      {/* Login prompt modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-lg p-6 max-w-md w-full animated-border">
            <h3 className="text-xl font-bold mb-4">Save Your Document</h3>
            <p className="mb-4 text-muted-foreground">You need to create an account or login to save your document.</p>
            <p className="mb-6 text-muted-foreground">Creating an account allows you to:</p>
            <ul className="list-disc pl-5 mb-6 text-muted-foreground">
              <li>Save your documents</li>
              <li>Edit them later</li>
              <li>Create a personal document library</li>
            </ul>
            <div className="flex gap-4 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowLoginPrompt(false)}
                className="border-primary/20 text-primary hover:bg-primary/10"
              >
                Continue Without Saving
              </Button>
              <Button 
                onClick={() => router.push('/register')}
                className="bg-primary text-white hover:bg-primary/90"
              >
                Create Account
              </Button>
            </div>
          </div>
        </div>
      )}

      <Card className="max-w-4xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Document Preview</CardTitle>
          <div className="flex items-center space-x-4">
            {autoSaveStatus && user && (
              <span className="text-sm text-muted-foreground">{autoSaveStatus}</span>
            )}
            {user && isDraft && documentId && (
              <span className="text-sm bg-amber-100 text-amber-800 px-2 py-1 rounded">Draft</span>
            )}
            {!user && (
              <span className="text-sm bg-secondary/10 text-secondary px-2 py-1 rounded">Not Saved</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Document title input */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Document Title
            </label>
            <Input
              id="title"
              value={title}
              onChange={handleTitleChange}
              placeholder="Enter document title"
              className="w-full"
            />
          </div>
          
          {/* Document Content */}
          <div className="mt-4">
            {content ? (
              isEditing ? (
                <Textarea
                  value={content}
                  onChange={handleContentChange}
                  className="min-h-[500px] font-mono"
                />
              ) : (
                <div className="p-4 bg-muted rounded-md">
                  <pre className="whitespace-pre-wrap font-mono">{content}</pre>
                </div>
              )
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                No content available. Please generate a document first.
              </div>
            )}
          </div>

          {/* AI Edit Button */}
          {content && (
            <div className="flex justify-center mt-4">
              <Button 
                onClick={handleEditWithAI}
                className="bg-secondary hover:bg-secondary/90 text-white"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 mr-2" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Edit with AI Assistant
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between flex-wrap gap-2">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/templates")}>
              Back to Templates
            </Button>
            {content && (
              <>
                <Button onClick={handleEditClick}>
                  {isEditing ? "Cancel Edit" : "Edit Document"}
                </Button>
                <Button
                  variant="default"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  {isSaving ? "Saving..." : (
                    user ? (isDraft ? "Save & Finalize" : "Save to My Documents") : "Save Document"
                  )}
                </Button>
              </>
            )}
          </div>
          {content && (
            <div className="flex gap-2">
              {isSaved && (
                <span className="text-sm text-green-600 flex items-center">
                  Document saved successfully!
                </span>
              )}
              <Button variant="outline" onClick={handleEmail}
                className="border-secondary/20 text-secondary hover:bg-secondary hover:text-white">
                Email Document
              </Button>
              <Button variant="outline" onClick={handleDownloadPDF}
                className="border-accent/20 text-accent hover:bg-accent hover:text-white">
                Download PDF
              </Button>
              <Button onClick={handleDownload}
                className="bg-accent hover:bg-accent/90 text-white">
                Download Text
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
      
      {/* Information box for non-logged in users */}
      {!user && content && (
        <div className="max-w-4xl mx-auto mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-start">
            <div className="mr-4 mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4"/>
                <path d="M12 8h.01"/>
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-primary">Document Not Saved</h3>
              <p className="text-sm text-muted-foreground mt-1">
                You're not logged in. You can edit and download this document, but to save it for later access, 
                you'll need to <Link href="/register" className="text-primary hover:underline">create an account</Link>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}