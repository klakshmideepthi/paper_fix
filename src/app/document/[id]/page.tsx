"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentRepository } from "@/lib/document-repository";
import { useAuth } from "@/components/auth/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export default function DocumentViewPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();
  const { user, loading } = useAuth();
  const [document, setDocument] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchDocument = async () => {
      if (!loading) {
        if (!user) {
          router.push("/login");
          return;
        }

        setIsLoading(true);
        try {
          const doc = await DocumentRepository.getDocument(id);
          if (doc) {
            setDocument(doc);
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

    fetchDocument();
  }, [id, user, loading, router]);

  const handleSave = async () => {
    if (!user || !document) return;

    setIsSaving(true);
    try {
      const updated = await DocumentRepository.updateDocument(id, {
        title,
        content,
        updated_at: new Date().toISOString(),
      });

      if (updated) {
        setDocument(updated);
        setIsEditing(false);
      } else {
        alert("Failed to update document. Please try again.");
      }
    } catch (error) {
      console.error("Error updating document:", error);
      alert("Failed to update document. Please try again.");
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

  if (isLoading) {
    return (
      <div className="container px-4 py-16 flex justify-center">
        <p>Loading document...</p>
      </div>
    );
  }

  if (!document) {
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
    <div className="container px-4 py-16 md:px-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>
            {isEditing ? (
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="font-bold text-xl"
              />
            ) : (
              title
            )}
          </CardTitle>
          <div className="flex flex-col text-sm text-muted-foreground">
            <span>Created: {new Date(document.created_at).toLocaleString()}</span>
            <span>Last updated: {new Date(document.updated_at).toLocaleString()}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[500px] font-mono"
            />
          ) : (
            <div className="p-4 bg-muted rounded-md">
              <pre className="whitespace-pre-wrap font-mono">{content}</pre>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between flex-wrap gap-2">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/my-documents")}>
              Back to Documents
            </Button>
            <Button onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? "Cancel Edit" : "Edit Document"}
            </Button>
            {isEditing && (
              <Button
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            )}
            <Button 
              variant="default" 
              onClick={() => router.push(`/edit/${id}`)}
              className="bg-secondary hover:bg-secondary/90 text-white"
            >
              Edit with AI
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownload}>
              Download
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}