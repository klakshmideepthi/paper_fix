import { Button } from "@/components/ui/button";
import { PaperFixHeroSection } from "@/components/blocks/paper-fix-hero";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center text-center">
      <PaperFixHeroSection />
      <div className="max-w-5xl w-full space-y-8">
        {/* Features section with colored cards */}
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          <div className="space-y-4 p-6 rounded-xl bg-primary/10 shadow-sm gradient-card-hover">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center mb-4 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground">
                <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-center">Fast & Easy</h2>
            <p className="text-muted-foreground">
              Generate professional documents in minutes by answering simple questions
            </p>
          </div>
          
          <div className="space-y-4 p-6 rounded-xl bg-secondary/10 shadow-sm gradient-card-hover">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary-foreground">
                <path d="M12 2a10 10 0 1 0 10 10H12V2Z"/>
                <path d="M20 12a8 8 0 1 0-16 0"/>
                <path d="M12 12v-2"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-center">AI-Powered</h2>
            <p className="text-muted-foreground">
              Leveraging advanced AI to create high-quality, customized documents
            </p>
          </div>
          
          <div className="space-y-4 p-6 rounded-xl bg-accent/10 shadow-sm gradient-card-hover">
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-4 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-foreground">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-center">Professional</h2>
            <p className="text-muted-foreground">
              Get legally sound documents tailored to your specific needs
            </p>
          </div>
        </div>

        <div className="mt-16 p-6 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            Note: AI-generated documents should be reviewed by legal professionals.
            This tool is designed to assist in document creation but does not replace
            legal advice.
          </p>
        </div>
      </div>
    </main>
  );
}