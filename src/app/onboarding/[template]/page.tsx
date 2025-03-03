"use client";

import React, { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup } from "@/components/ui/radio";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getTemplate } from "@/lib/templates";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";

// Safe encode function that won't cause URI errors
const safeEncodeURIComponent = (str: string) => {
  try {
    // Simple encode for basic characters
    return encodeURIComponent(str);
  } catch (e) {
    console.error("Error encoding URI component:", e);
    
    // If encoding fails, try to sanitize the string
    return str
      .replace(/[\u007F-\uFFFF]/g, chr => {
        // For non-ASCII characters, replace with HTML entity
        return "&#" + chr.charCodeAt(0) + ";";
      })
      .replace(/[<>"'&]/g, chr => {
        // Replace HTML special chars
        switch (chr) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '"': return '&quot;';
          case "'": return '&#39;';
          case '&': return '&amp;';
          default: return chr;
        }
      });
  }
};

// Main component with suspense boundary
export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="container px-4 py-16 flex justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}

// Actual content component that uses useParams
function OnboardingContent() {
  // Use the useParams hook to get the template parameter
  const params = useParams();
  const templateId = params.template as string;
  
  const router = useRouter();
  const template = getTemplate(templateId);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState("");
  const [generationError, setGenerationError] = useState<string | null>(null);

  if (!template) {
    return (
      <div className="container px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Template Not Found</h1>
        <p className="mb-8">The requested template does not exist.</p>
        <Button onClick={() => router.push("/templates")}>
          Back to Templates
        </Button>
      </div>
    );
  }

  const currentQuestion = template.questions[currentStep];

  const handleAnswer = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const handleNext = async () => {
    if (currentStep < template.questions.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setIsGenerating(true);
      setGenerationError(null);
      setGenerationProgress("Initiating document generation...");
      
      try {
        // Update progress message
        setGenerationProgress("Processing your answers...");
        
        setTimeout(() => {
          setGenerationProgress("Creating your document with AI...");
        }, 1500);
        
        setTimeout(() => {
          setGenerationProgress("Formatting and finalizing document...");
        }, 3000);
        
        // Send answers to the API and get the generated document
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            templateId: templateId,
            answers,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to generate document: ${response.statusText}`);
        }

        // Get the text content
        setGenerationProgress("Document generated! Preparing preview...");
        const documentText = await response.text();
        
        // Safely encode the document text and answers
        const safeDocumentText = safeEncodeURIComponent(documentText);
        const safeAnswers = safeEncodeURIComponent(JSON.stringify(answers));

        // Navigate to preview with generated content and template info
        router.push(
          `/preview?templateId=${templateId}&answers=${safeAnswers}&content=${safeDocumentText}`
        );
      } catch (error) {
        console.error("Error generating document:", error);
        setGenerationError("Failed to generate document. Please try again.");
      } finally {
        // Don't set isGenerating to false - we'll redirect instead
        // This keeps the loading state until we navigate away
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else {
      router.push("/templates");
    }
  };

  const renderQuestionInput = () => {
    const value = answers[currentQuestion.id] || "";

    switch (currentQuestion.type) {
      case "text":
        return (
          <Input
            placeholder={currentQuestion.placeholder}
            value={value}
            onChange={(e) => handleAnswer(e.target.value)}
          />
        );
      case "textarea":
        return (
          <Textarea
            placeholder={currentQuestion.placeholder}
            value={value}
            onChange={(e) => handleAnswer(e.target.value)}
          />
        );
      case "select":
        return (
          <Select
            options={currentQuestion.options || []}
            value={value}
            onChange={(e) => handleAnswer(e.target.value)}
          />
        );
      case "radio":
        return (
          <RadioGroup
            name={currentQuestion.id}
            options={currentQuestion.options || []}
            value={value}
            onChange={handleAnswer}
          />
        );
      default:
        return null;
    }
  };

  // If generating, show a full-screen loading UI
  if (isGenerating) {
    return (
      <div className="fixed inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="max-w-md w-full bg-card p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold mb-6">Generating Your Document</h2>
          
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-6"></div>
          
          <p className="text-lg mb-4">{generationProgress}</p>
          
          <div className="w-full bg-secondary rounded-full h-2 mb-6">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-1000"
              style={{
                width: generationProgress.includes("Initiating") ? "20%" :
                       generationProgress.includes("Processing") ? "40%" :
                       generationProgress.includes("Creating") ? "60%" :
                       generationProgress.includes("Formatting") ? "80%" :
                       generationProgress.includes("Preparing") ? "90%" : "10%"
              }}
            />
          </div>
          
          <p className="text-sm text-muted-foreground">
            This may take up to a minute depending on document complexity.
          </p>
          
          {generationError && (
            <div className="mt-6 p-3 bg-red-50 text-red-600 rounded-md text-left">
              <p className="font-medium">Error:</p>
              <p>{generationError}</p>
              <Button 
                variant="outline" 
                className="mt-2"
                onClick={() => setIsGenerating(false)}
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-16 md:px-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{template.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress indicator */}
          <div className="w-full bg-secondary rounded-full h-2 mb-6">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentStep + 1) / template.questions.length) * 100}%`,
              }}
            />
          </div>

          {/* Question */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">
              {currentQuestion.question}
            </h2>
            {currentQuestion.required && (
              <span className="text-sm text-destructive">* Required</span>
            )}
            {renderQuestionInput()}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={
              isGenerating || (currentQuestion.required && !answers[currentQuestion.id])
            }
          >
            {isGenerating
              ? "Generating..."
              : currentStep === template.questions.length - 1
              ? "Generate Document"
              : "Next"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}