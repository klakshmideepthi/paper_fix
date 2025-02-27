import { OpenAI } from "@vercel/ai";

// Set up the AI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to generate a document based on template and user inputs
export async function generateDocument(
  templateId: string,
  userInputs: Record<string, any>
) {
  const systemPrompt = getSystemPromptForTemplate(templateId);
  
  const userPrompt = `
    Create a professional ${getTemplateName(templateId)} document using the following information:
    
    ${Object.entries(userInputs)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n")}
    
    Format the document professionally with appropriate sections and language.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error generating document:", error);
    throw new Error("Failed to generate document. Please try again.");
  }
}

// Helper function to update a document with user edits
export async function updateDocument(
  documentContent: string,
  userRequest: string
) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: 
            "You are an expert legal document editor. Your task is to modify the provided document according to the user's request. Maintain the professional tone and formatting of the original document. Return the entire updated document.",
        },
        {
          role: "user",
          content: `Here is the current document:\n\n${documentContent}\n\nPlease make the following changes:\n${userRequest}`,
        },
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error updating document:", error);
    throw new Error("Failed to update document. Please try again.");
  }
}

// Helper functions to get template-specific prompts and information
function getSystemPromptForTemplate(templateId: string): string {
  const prompts: Record<string, string> = {
    "terms-of-service": "You are an expert legal document creator specializing in Terms of Service agreements. Create a comprehensive, legally-sound Terms of Service document that clearly outlines the rules, guidelines, and restrictions for using the website or service.",
    "privacy-policy": "You are an expert legal document creator specializing in Privacy Policies. Create a comprehensive, legally-sound Privacy Policy document that clearly explains how user data is collected, used, stored, and protected.",
    "nda": "You are an expert legal document creator specializing in Non-Disclosure Agreements. Create a comprehensive, legally-sound NDA that protects confidential information shared between parties.",
    "employment-contract": "You are an expert legal document creator specializing in Employment Contracts. Create a comprehensive, professionally-written contract that clearly defines the relationship between employer and employee.",
    "service-agreement": "You are an expert legal document creator specializing in Service Agreements. Create a comprehensive, professionally-written agreement that clearly outlines the services to be provided and payment terms.",
    "return-policy": "You are an expert legal document creator specializing in Return Policies. Create a comprehensive, customer-friendly policy that clearly outlines how customers can return products and receive refunds.",
  };

  return prompts[templateId] || "You are an expert legal document creator. Create a comprehensive, professionally-written document based on the information provided.";
}

function getTemplateName(templateId: string): string {
  const names: Record<string, string> = {
    "terms-of-service": "Terms of Service",
    "privacy-policy": "Privacy Policy",
    "nda": "Non-Disclosure Agreement",
    "employment-contract": "Employment Contract",
    "service-agreement": "Service Agreement",
    "return-policy": "Return Policy",
  };

  return names[templateId] || "Document";
}

// Function to determine what fields we need for each template type
export function getTemplateFields(templateId: string): Array<{
  id: string;
  label: string;
  type: "text" | "textarea" | "select";
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
}> {
  switch (templateId) {
    case "terms-of-service":
      return [
        {
          id: "companyName",
          label: "Company/Website Name",
          type: "text",
          placeholder: "Enter your company or website name",
          required: true,
        },
        {
          id: "websiteUrl",
          label: "Website URL",
          type: "text",
          placeholder: "https://yourwebsite.com",
          required: true,
        },
        {
          id: "businessType",
          label: "Type of Business/Service",
          type: "text",
          placeholder: "e.g., E-commerce, SaaS, Marketplace",
          required: true,
        },
        {
          id: "jurisdiction",
          label: "Governing Law (Jurisdiction)",
          type: "text",
          placeholder: "e.g., California, United States",
          required: true,
        },
        {
          id: "userRestrictions",
          label: "User Restrictions",
          type: "textarea",
          placeholder: "Specify any age requirements or regional restrictions",
        },
        {
          id: "additionalTerms",
          label: "Additional Terms",
          type: "textarea",
          placeholder: "Any other specific terms you want to include",
        },
      ];
    case "privacy-policy":
      return [
        {
          id: "companyName",
          label: "Company/Website Name",
          type: "text",
          placeholder: "Enter your company or website name",
          required: true,
        },
        {
          id: "websiteUrl",
          label: "Website URL",
          type: "text",
          placeholder: "https://yourwebsite.com",
          required: true,
        },
        {
          id: "dataCollected",
          label: "Types of Data Collected",
          type: "select",
          options: [
            { value: "basic", label: "Basic (Name, Email, Contact Info)" },
            { value: "extended", label: "Extended (Basic + Demographics, Preferences)" },
            { value: "comprehensive", label: "Comprehensive (Extended + Browsing Behavior, Device Info)" },
          ],
          required: true,
        },
        {
          id: "dataPurpose",
          label: "Purpose of Data Collection",
          type: "textarea",
          placeholder: "Explain why you collect user data",
          required: true,
        },
        {
          id: "thirdPartySharing",
          label: "Third-Party Data Sharing",
          type: "select",
          options: [
            { value: "none", label: "No Third-Party Sharing" },
            { value: "limited", label: "Limited Sharing (Specify partners)" },
            { value: "extensive", label: "Extensive Sharing (Advertising networks, analytics)" },
          ],
          required: true,
        },
        {
          id: "storageLocation",
          label: "Data Storage Location",
          type: "text",
          placeholder: "e.g., United States, European Union",
          required: true,
        },
        {
          id: "retentionPeriod",
          label: "Data Retention Period",
          type: "text",
          placeholder: "e.g., 1 year, Until account deletion",
        },
        {
          id: "additionalInfo",
          label: "Additional Information",
          type: "textarea",
          placeholder: "Any other privacy-related information",
        },
      ];
    // Add similar form definitions for other document types
    default:
      return [
        {
          id: "title",
          label: "Document Title",
          type: "text",
          placeholder: "Enter document title",
          required: true,
        },
        {
          id: "content",
          label: "Document Content",
          type: "textarea",
          placeholder: "Describe what you need in the document",
          required: true,
        },
      ];
  }
}