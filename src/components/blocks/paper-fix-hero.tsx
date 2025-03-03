"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Mockup, MockupFrame } from "@/components/ui/mockup";
import { Glow } from "@/components/ui/glow";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useTheme } from "next-themes";

export function PaperFixHeroSection() {
  const { resolvedTheme } = useTheme();
  
  // Determine which image to use based on the theme
  const imageSrc = resolvedTheme === "dark" ? "/dark.png" : "/light.png";
  
  return (
    <section
      className={cn(
        "bg-background text-foreground",
        "fade-bottom overflow-hidden pb-0"
      )}
    >
      <div className="mx-auto flex max-w-container flex-col gap-12 pt-16 sm:gap-24">
        <div className="flex flex-col items-center gap-6 text-center sm:gap-12">
          {/* Badge */}
          <Badge variant="outline" className="animate-appear gap-2">
            <span className="text-muted-foreground">AI-Powered Document Generation</span>
            <Link href="/technology" className="flex items-center gap-1">
              How it works
              <ArrowRightIcon className="h-3 w-3" />
            </Link>
          </Badge>

          {/* Title */}
          <h1 className="relative z-10 inline-block animate-appear text-4xl font-semibold leading-tight text-foreground sm:text-6xl sm:leading-tight md:text-8xl md:leading-tight">
            Professional Documents in Minutes
          </h1>

          {/* Description */}
          <p className="text-md relative z-10 max-w-[550px] animate-appear font-medium text-muted-foreground opacity-0 delay-100 sm:text-xl">
            Generate customized legal and business documents with AI. Answer a few simple questions and get legally-sound documents tailored to your specific needs.
          </p>

          {/* Actions */}
          <div className="relative z-10 flex animate-appear justify-center gap-4 opacity-0 delay-300">
            <Button
              size="lg"
              asChild
              className="bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100"
            >
              <Link href="/templates" className="flex items-center gap-2">
                Get Started
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="border-gray-300 text-gray-900 hover:bg-gray-100 dark:border-white dark:text-white dark:hover:bg-white/10"
            >
              <Link href="/templates" className="flex items-center gap-2">
                View Templates
              </Link>
            </Button>
          </div>

          {/* Image with Mockup - Now using conditional image */}
          <div className="relative pt-12">
            <MockupFrame
              className="animate-appear opacity-0 delay-700"
              size="small"
            >
              <Mockup type="responsive">
                <Image
                  src={imageSrc}
                  alt="UI Components Preview"
                  width={1248}
                  height={765}
                  priority
                />
              </Mockup>
            </MockupFrame>
            <Glow
              variant="top"
              className="animate-appear-zoom opacity-0 delay-1000"
            />
          </div>
        </div>
      </div>
    </section>
  );
}