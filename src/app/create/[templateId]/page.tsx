"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Header } from "@/components/header";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getTemplateFields } from "@/lib/ai-config";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// Define document titles for different templates
const documentTitles: Record<string, string> = {
  "terms-of-service": "Terms of Service",
  "privacy-policy": "Privacy Policy",
  "nda": "Non-Disclosure Agreement",
  "employment-contract": "Employment Contract",
  "service-agreement": "Service Agreement",
  "return-policy": "Return Policy",
};

export default function CreateDocumentPage() {
  const params = useParams<{ templateId: string }>();
  const router = useRouter();
  const templateId = params.templateId;
  const documentTitle = documentTitles[templateId] || "Document";
  
  const [step, setStep] = useState<"form" | "generating" | "preview">("form");
  const [progress, setProgress] = useState(0);
  const [generatedDocument, setGeneratedDocument] = useState<string>("");
  const [editRequest, setEditRequest] = useState<string>("");
  
  // Get template-specific fields
  const templateFields = getTemplateFields(templateId);
  
  // Create a dynamic Zod schema based on template fields
  const formSchema = z.object(
    Object.fromEntries(
      templateFields.map((field) => [
        field.id,
        field.required ? z.string().min(1, "This field is required") : z.string().optional(),
      ])
    )
  );

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: Object.fromEntries(
      templateFields.map((field) => [field.id, ""])
    ),
  });

  // Submit handler
  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Update UI to show generating state
    setStep("generating");
    
    // Simulate progress for better UX
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return prev;
        }
        return prev + 5;
      });
    }, 300);

    try {
      // Make API call to generate document
      const response = await fetch("/api/generate-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateId,
          formData: values,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate document");
      }

      const data = await response.json();
      setGeneratedDocument(data.document);
      
      // Complete progress bar and show preview
      setProgress(100);
      setTimeout(() => {
        setStep("preview");
      }, 500);
      
    } catch (error) {
      console.error("Error generating document:", error);
      // Handle error (could add error state and display)
      setStep("form");
    } finally {
      clearInterval(interval);
    }
  }

  // Handle edit request
  async function handleEditRequest() {
    if (!editRequest.trim()) return;

    try {
      const response = await fetch("/api/update-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          document: generatedDocument,
          editRequest,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update document");
      }

      const data = await response.json();
      setGeneratedDocument(data.updatedDocument);
      setEditRequest("");
    } catch (error) {
      console.error("Error updating document:", error);
      // Handle error
    }
  }

  // Function to handle download
  function handleDownload() {
    const element = document.createElement("a");
    const file = new Blob([generatedDocument], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${documentTitle.toLowerCase().replace(/ /g, "-")}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container max-w-5xl py-8">
          <h1 className="mb-8 text-3xl font-bold">Create {documentTitle}</h1>

          {step === "form" && (
            <Card>
              <CardHeader>
                <CardTitle>Document Information</CardTitle>
                <CardDescription>
                  Fill out the form below to create your customized {documentTitle}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {templateFields.map((field) => (
                      <FormField
                        key={field.id}
                        control={form.control}
                        name={field.id}
                        render={({ field: formField }) => (
                          <FormItem>
                            <FormLabel>{field.label}</FormLabel>
                            <FormControl>
                              {field.type === "text" && (
                                <Input
                                  placeholder={field.placeholder}
                                  {...formField}
                                />
                              )}
                              {field.type === "textarea" && (
                                <Textarea
                                  placeholder={field.placeholder}
                                  {...formField}
                                />
                              )}
                              {field.type === "select" && (
                                <Select
                                  onValueChange={formField.onChange}
                                  defaultValue={formField.value}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select an option" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {field.options?.map((option) => (
                                      <SelectItem
                                        key={option.value}
                                        value={option.value}
                                      >
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                    <Button type="submit" className="w-full">
                      Generate Document
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {step === "generating" && (
            <Card>
              <CardHeader>
                <CardTitle>Generating Your Document</CardTitle>
                <CardDescription>
                  Please wait while we create your customized {documentTitle}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={progress} className="w-full" />
                <p className="text-center text-sm text-muted-foreground">
                  This may take a minute...
                </p>
              </CardContent>
            </Card>
          )}

          {step === "preview" && (
            <div className="space-y-8">
              <Tabs defaultValue="preview">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="edit">Edit</TabsTrigger>
                </TabsList>
                
                <TabsContent value="preview" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>{documentTitle}</CardTitle>
                      <CardDescription>
                        Your customized document is ready. You can export it or make edits.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="whitespace-pre-wrap rounded-md border p-4 font-mono text-sm">
                        {generatedDocument}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" onClick={() => setStep("form")}>
                        Go Back
                      </Button>
                      <div className="space-x-2">
                        <Button onClick={handleDownload}>
                          Download
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                <TabsContent value="edit">
                  <Card>
                    <CardHeader>
                      <CardTitle>Edit Your Document</CardTitle>
                      <CardDescription>
                        Make changes to your document using the chat-based editor.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-md border p-4 font-mono text-sm">
                        {generatedDocument}
                      </div>
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Describe the changes you want to make (e.g., 'Add a section about refunds' or 'Make the language more formal')"
                          value={editRequest}
                          onChange={(e) => setEditRequest(e.target.value)}
                          className="min-h-[100px]"
                        />
                        <Button
                          onClick={handleEditRequest}
                          disabled={!editRequest.trim()}
                          className="w-full"
                        >
                          Apply Changes
                        </Button>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" onClick={() => setStep("form")}>
                        Go Back
                      </Button>
                      <Button onClick={handleDownload}>
                        Download
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}