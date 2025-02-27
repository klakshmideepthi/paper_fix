import { Header } from "@/components/header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Define the document templates available in the system
const documentTemplates = [
  {
    id: "terms-of-service",
    title: "Terms of Service",
    description: "A document outlining the rules and guidelines for using your website or service.",
    icon: "📝",
  },
  {
    id: "privacy-policy",
    title: "Privacy Policy",
    description: "A document explaining how you collect, use, and manage user data.",
    icon: "🔒",
  },
  {
    id: "nda",
    title: "Non-Disclosure Agreement",
    description: "A legal contract to keep sensitive information confidential.",
    icon: "🤐",
  },
  {
    id: "employment-contract",
    title: "Employment Contract",
    description: "A contract defining the relationship between employer and employee.",
    icon: "👥",
  },
  {
    id: "service-agreement",
    title: "Service Agreement",
    description: "A contract outlining services to be provided and payment terms.",
    icon: "🤝",
  },
  {
    id: "return-policy",
    title: "Return Policy",
    description: "A document outlining how customers can return products and receive refunds.",
    icon: "🔄",
  },
];

export default function TemplatesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Choose a Document Template
                </h1>
                <p className="max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Select the type of document you want to create. We'll guide you through the process.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
              {documentTemplates.map((template) => (
                <Card key={template.id} className="overflow-hidden">
                  <CardHeader className="space-y-1">
                    <div className="text-4xl">{template.icon}</div>
                    <CardTitle className="text-xl">{template.title}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link href={`/create/${template.id}`}>
                        Select Template
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}