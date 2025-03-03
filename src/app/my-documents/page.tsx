"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentRepository } from "@/lib/document-repository";
import { useAuth } from "@/components/auth/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Document } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MyDocumentsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [drafts, setDrafts] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("documents");

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!loading && user) {
        setIsLoading(true);
        try {
          // Fetch finalized documents
          const docs = await DocumentRepository.getDocumentsByUser(user.id, false);
          setDocuments(docs);
          
          // Fetch draft documents
          const draftDocs = await DocumentRepository.getDraftDocuments(user.id);
          setDrafts(draftDocs);
        } catch (error) {
          console.error("Error fetching documents:", error);
        } finally {
          setIsLoading(false);
        }
      } else if (!loading && !user) {
        // If not logged in, redirect to home
        router.push("/");
      }
    };

    fetchDocuments();
  }, [user, loading, router]);

  const handleOpenDocument = (id: string, isDraft: boolean, editMode: 'standard' | 'ai' = 'standard') => {
    if (isDraft) {
      router.push(`/preview?documentId=${id}`);
    } else if (editMode === 'ai') {
      router.push(`/edit/${id}`);
    } else {
      router.push(`/document/${id}`);
    }
  };

  const handleDeleteDocument = async (id: string, isDraft: boolean) => {
    if (confirm("Are you sure you want to delete this document?")) {
      const success = await DocumentRepository.deleteDocument(id);
      if (success) {
        if (isDraft) {
          setDrafts(drafts.filter(doc => doc.id !== id));
        } else {
          setDocuments(documents.filter(doc => doc.id !== id));
        }
      } else {
        alert("Failed to delete document. Please try again.");
      }
    }
  };

  if (loading || (isLoading && user)) {
    return (
      <div className="container px-4 py-16 flex justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
        <p className="mb-8">Please login to view your documents.</p>
        <Button onClick={() => router.push("/login")}>
          Go to Login
        </Button>
      </div>
    );
  }

  const renderDocumentGrid = (docs: Document[], isDraftSection: boolean) => {
    if (docs.length === 0) {
      return (
        <div className="text-center p-12 bg-muted rounded-lg">
          <h2 className="text-xl font-medium mb-4">No {isDraftSection ? "Drafts" : "Documents"} Found</h2>
          <p className="mb-6">You haven&apos;t created {isDraftSection ? "drafts" : "documents"} yet.</p>
          <Button onClick={() => router.push("/templates")}>
            Create Your First Document
          </Button>
        </div>
      );
    }

    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {docs.map((doc) => (
          <Card key={doc.id} className="flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="truncate">{doc.title}</CardTitle>
                {isDraftSection && (
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">Draft</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date(doc.created_at).toLocaleDateString()}
              </p>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground">
                Template: {doc.template_id.replace(/-/g, " ")}
              </p>
              <div className="mt-2 h-24 overflow-hidden text-ellipsis">
                <p className="text-sm whitespace-pre-wrap">
                  {doc.content.substring(0, 150)}...
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between flex-wrap gap-2">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleOpenDocument(doc.id, isDraftSection)}
                >
                  {isDraftSection ? "Continue Editing" : "Open"}
                </Button>
                {!isDraftSection && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleOpenDocument(doc.id, isDraftSection, 'ai')}
                    className="bg-secondary hover:bg-secondary/90 text-white"
                  >
                    Edit with AI
                  </Button>
                )}
              </div>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => handleDeleteDocument(doc.id, isDraftSection)}
              >
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="container px-4 py-16 md:px-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Documents</h1>
        <Button onClick={() => router.push("/templates")}>
          Create New Document
        </Button>
      </div>

      <Tabs defaultValue="documents" onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="documents">
            Completed Documents ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="drafts">
            Drafts ({drafts.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="documents">
          {renderDocumentGrid(documents, false)}
        </TabsContent>
        
        <TabsContent value="drafts">
          {renderDocumentGrid(drafts, true)}
        </TabsContent>
      </Tabs>
    </div>
  );
}