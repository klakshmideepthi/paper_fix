import { NextResponse } from "next/server";
import { generateDocument } from "@/lib/ai-config";

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    const { templateId, formData } = body;

    // Validate inputs
    if (!templateId || !formData) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate document
    const document = await generateDocument(templateId, formData);

    // Return the generated document
    return NextResponse.json({ document });
  } catch (error) {
    console.error("Error in generate-document API:", error);
    return NextResponse.json(
      { error: "Failed to generate document" },
      { status: 500 }
    );
  }
}