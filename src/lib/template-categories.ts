// src/lib/template-categories.ts

// Predefined categories for document templates
export const documentCategories = [
    { id: "all", name: "All" },
    { id: "business", name: "Business Documents" },
    { id: "legal", name: "Legal Documents" },
    { id: "real-estate", name: "Real Estate Documents" },
    { id: "personal", name: "Personal Documents" },
    { id: "employment", name: "Employment & HR" },
    { id: "technology", name: "Technology & Startup" },
    { id: "creative", name: "Creative & Media" },
    { id: "financial", name: "Financial Documents" },
    { id: "educational", name: "Educational & Nonprofit" },
    { id: "miscellaneous", name: "Miscellaneous" },
  ];
  
  // Map template IDs to their respective categories
  export const templateCategoryMap: Record<string, string> = {
    "terms-of-service": "legal",
    "privacy-policy": "privacy",
    // Add mappings for any other templates you create
  };
  
  // Function to get the category for a template
  export function getTemplateCategory(templateId: string): string {
    return templateCategoryMap[templateId] || "miscellaneous";
  }
  
  // Function to get template style based on template ID
  export function getTemplateStyle(templateId: string): string {
    const styles: Record<string, string> = {
      "terms-of-service": "from-primary/30 to-primary/5",
      "privacy-policy": "from-secondary/30 to-secondary/5",
      // Add more styles as needed
    };
    
    return styles[templateId] || "from-accent/30 to-accent/5";
  }