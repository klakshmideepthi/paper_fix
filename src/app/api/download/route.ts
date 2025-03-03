// src/app/api/download/route.ts
import PDFDocument from 'pdfkit';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { content, title } = await req.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Missing document content' },
        { status: 400 }
      );
    }

    // Create a PDF document
    const doc = new PDFDocument({
      margins: { top: 50, bottom: 50, left: 72, right: 72 },
      info: {
        Title: title || 'Generated Document',
      }
    });

    // Set up response to return PDF
    const chunks: Buffer[] = [];
    // Initialize result here to avoid "used before assigned" error
    let result: Buffer = Buffer.from([]);

    // Collect chunks of PDF data
    doc.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    // When the PDF is finalized, combine chunks and return
    doc.on('end', () => {
      result = Buffer.concat(chunks);
    });

    // Add title to the PDF
    if (title) {
      doc.fontSize(18)
        .font('Helvetica-Bold')
        .text(title, { align: 'center' })
        .moveDown(1);
    }

    // Add content to the PDF with proper formatting
    doc.fontSize(12)
      .font('Helvetica')
      .text(content, {
        align: 'left',
        lineGap: 5,
      });

    // Finalize the PDF and collect data
    doc.end();

    // Wait for the PDF to be generated
    await new Promise<void>((resolve) => {
      doc.on('end', () => {
        resolve();
      });
    });

    // Here the result is guaranteed to be assigned because we waited for doc.end() event
    return new Response(result, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${(title || 'document').replace(/[^a-z0-9]/gi, '_')}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}