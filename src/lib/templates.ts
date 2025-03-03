export type Question = {
  id: string;
  question: string;
  type: "text" | "textarea" | "select" | "radio";
  options?: string[];
  placeholder?: string;
  required?: boolean;
};

export type Template = {
  id: string;
  name: string;
  description: string;
  questions: Question[];
};

export const templates: Record<string, Template> = {
  "terms-of-service": {
    id: "terms-of-service",
    name: "Terms of Service",
    description: "Generate a comprehensive Terms of Service agreement for your website or application",
    questions: [
      {
        id: "companyName",
        question: "What is your company's legal name?",
        type: "text",
        placeholder: "e.g., Acme Corporation",
        required: true,
      },
      {
        id: "serviceType",
        question: "What type of service do you provide?",
        type: "select",
        options: [
          "Web Application",
          "Mobile App",
          "SaaS Platform",
          "E-commerce Store",
          "Content Platform",
          "Other",
        ],
        required: true,
      },
      {
        id: "jurisdiction",
        question: "Which country's laws govern this agreement?",
        type: "text",
        placeholder: "e.g., United States",
        required: true,
      },
      {
        id: "userDataCollection",
        question: "Do you collect user data?",
        type: "radio",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "additionalTerms",
        question: "Are there any additional terms or specific requirements you'd like to include?",
        type: "textarea",
        placeholder: "Enter any additional terms or requirements...",
        required: false,
      },
    ],
  },
  "privacy-policy": {
    id: "privacy-policy",
    name: "Privacy Policy",
    description: "Create a detailed Privacy Policy that complies with global privacy regulations",
    questions: [
      {
        id: "companyName",
        question: "What is your company's legal name?",
        type: "text",
        placeholder: "e.g., Acme Corporation",
        required: true,
      },
      {
        id: "dataCollectionPurpose",
        question: "What is the primary purpose of collecting user data?",
        type: "textarea",
        placeholder: "Explain why you collect user data...",
        required: true,
      },
      {
        id: "dataTypes",
        question: "What types of personal data do you collect?",
        type: "select",
        options: [
          "Contact Information",
          "Payment Details",
          "Usage Data",
          "Device Information",
          "Location Data",
          "All of the above",
        ],
        required: true,
      },
      {
        id: "thirdPartySharing",
        question: "Do you share user data with third parties?",
        type: "radio",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "userRights",
        question: "What rights do users have regarding their data?",
        type: "textarea",
        placeholder: "Describe user rights and how they can exercise them...",
        required: true,
      },
    ],
  },
};

export function getTemplate(id: string): Template | null {
  return templates[id] || null;
}
