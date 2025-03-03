// src/app/api/email/route.ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import PDFDocument from 'pdfkit';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: Request) {
  try {
    const { email, content, title } = await req.json();

    if (!email || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Collect PDF data
    const buffers: Buffer[] = [];
    doc.on('data', (chunk) => buffers.push(chunk));

    // Add title to the PDF
    if (title) {
      doc.fontSize(18)
        .font('Helvetica-Bold')
        .text(title, { align: 'center' })
        .moveDown(1);
    }

    // Add content to the PDF
    doc.fontSize(12)
      .font('Helvetica')
      .text(content, {
        align: 'left',
        lineGap: 5,
      });

    // Finalize the PDF
    doc.end();

    // Wait for PDF generation to complete
    await new Promise<void>((resolve) => {
      doc.on('end', () => resolve());
    });

    // Convert buffers to base64
    const pdfBuffer = Buffer.concat(buffers);
    const pdfBase64 = pdfBuffer.toString('base64');

    // Send the email with the PDF attachment
    const { data, error } = await resend.emails.send({
      from: `Document Generator <${process.env.RESEND_FROM_EMAIL || 'docs@paperfix.com'}>`,
      to: email,
      subject: title ? `Your Document: ${title}` : 'Your Generated Document',
      text: `Attached is your document${title ? `: ${title}` : ''}. Thank you for using our service.`,
      attachments: [
        {
          filename: `${(title || 'document').replace(/[^a-z0-9]/gi, '_')}.pdf`,
          content: pdfBase64,
        },
      ],
    });

    if (error) {
      console.error('Error sending email:', error);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'Email sent successfully',
      messageId: data?.id 
    });
  } catch (error) {
    console.error('Error in email API route:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}