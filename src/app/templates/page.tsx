"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Upload, FileText } from "lucide-react";
import { templates } from "@/lib/templates";
import { useAuth } from "@/components/auth/AuthContext";
import { documentCategories, getTemplateCategory } from "@/lib/template-categories";
import { TemplateIcon } from "@/components/TemplateIcon";

export default function TemplatesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  // Convert templates object to array for filtering
  const templatesArray = Object.values(templates);

  // Filter templates based on search query and active category
  const filteredTemplates = templatesArray.filter((template) => {
    const matchesSearch = 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const templateCategory = getTemplateCategory(template.id);
    const matchesCategory = activeCategory === "all" || templateCategory === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Determine if we should show the upload card (only in "all" category)
  const showUploadCard = activeCategory === "all" && filteredTemplates.length > 0;

  // Handle template selection
  const handleSelectTemplate = (templateId: string) => {
    router.push(`/onboarding/${templateId}`);
  };

  // Handle upload document (placeholder functionality)
  const handleUploadDocument = () => {
    // This would be implemented with file upload functionality
    alert("Document upload feature will be available soon!");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 bg-clip-text text-foreground dark:text-white">Select a Document Template</h1>
        <p className="text-xl text-muted-foreground dark:text-gray-300">
          Choose from our collection of professional document templates
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search for document templates..."
          className="pl-10 py-6 text-lg bg-background dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Category Tabs */}
      <div className="mb-8 border-b border-gray-200 dark:border-gray-700">
        <Tabs defaultValue="all" onValueChange={setActiveCategory}>
          <TabsList className="w-full flex overflow-x-auto justify-start h-auto bg-transparent">
            {documentCategories.map((category) => (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="px-6 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 dark:data-[state=active]:border-gray-100 data-[state=active]:bg-transparent data-[state=active]:text-foreground font-medium text-muted-foreground dark:text-gray-400 dark:data-[state=active]:text-white"
              >
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {/* Upload Your Own Document Card */}
        {showUploadCard && (
          <div className="aspect-[1/1.414] relative">
            <Card className="absolute inset-0 overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-900 dark:hover:border-gray-400 transition-colors shadow-md hover:shadow-lg bg-card dark:bg-gray-800">
              <CardContent className="p-0 h-full">
                <Button
                  variant="ghost"
                  className="w-full h-full flex flex-col items-center justify-center p-6 space-y-4"
                  onClick={handleUploadDocument}
                >
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <Upload className="h-8 w-8 text-gray-800 dark:text-gray-200" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-lg text-foreground dark:text-white">Upload Your Own Document</h3>
                    <p className="text-muted-foreground dark:text-gray-300 text-sm mt-1">Use your existing document as a template</p>
                  </div>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Document Template Cards */}
        {filteredTemplates.length > 0 ? (
          filteredTemplates.map((template) => {
            // Use grayscale gradient based on theme
            const gradientClass = "bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-700";

            return (
              <div key={template.id} className="aspect-[1/1.414] relative">
                <Card 
                  className={`absolute inset-0 overflow-hidden hover:shadow-lg transition-all hover:scale-105 cursor-pointer ${gradientClass}`}
                  onClick={() => handleSelectTemplate(template.id)}
                >
                  <CardContent className="p-4 h-full flex flex-col">
                    {/* Template icon/image */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-foreground dark:text-white">{template.name}</h3>
                      <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm">
                        <TemplateIcon templateId={template.id} />
                      </div>
                    </div>

                    {/* Template description */}
                    <p className="text-sm text-muted-foreground dark:text-gray-300 mb-4 line-clamp-4">
                      {template.description}
                    </p>
                    
                    <div className="mt-auto">
                      <div className="flex items-center mb-4">
                        <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center mr-2">
                          <span className="text-xs text-gray-800 dark:text-gray-200 font-medium">{template.questions.length}</span>
                        </div>
                        <span className="text-sm text-muted-foreground dark:text-gray-300">questions to complete</span>
                      </div>
                      
                      <Button
                        className="w-full mt-2 bg-background dark:bg-gray-800 text-foreground dark:text-white hover:bg-gray-900 hover:text-white dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectTemplate(template.id);
                        }}
                      >
                        Generate {template.name}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })
        ) : (
          // No results found state
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-xl font-medium text-foreground dark:text-white">No templates found</h3>
            <p className="text-muted-foreground dark:text-gray-400 mt-2">Try adjusting your search or category filter</p>
          </div>
        )}
      </div>
    </div>
  );
}