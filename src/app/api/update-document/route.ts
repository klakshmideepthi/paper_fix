import { NextResponse } from "next/server";
import { updateDocument } from "@/lib/ai-config";

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    const { document, editRequest } = body;

    // Validate inputs
    if (!document || !editRequest) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update document
    const updatedDocument = await updateDocument(document, editRequest);

    // Return the updated document
    return NextResponse.json({ updatedDocument });
  } catch (error) {
    console.error("Error in update-document API:", error);
    return NextResponse.json(
      { error: "Failed to update document" },
      { status: 500 }
    );
  }
}