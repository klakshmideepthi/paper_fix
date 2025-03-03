// src/app/api/generate/route.ts
import { streamText } from 'ai';
import { gemini, GEMINI_MODEL, MODEL_CONFIG } from '@/lib/ai-config';
import { getTemplate } from '@/lib/templates';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { templateId, answers } = await req.json();
    const template = getTemplate(templateId);
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    // Create a prompt based on the template type
    const prompt = `You are an expert legal document writer. Generate a ${
      template.name
    } based on the following information:

${template.questions
  .map((q) => `${q.question}: ${answers[q.id] || 'N/A'}`)
  .join('\n')}

Create a comprehensive, well-structured document that is professional and legally sound. 
Use clear, concise language and proper legal terminology.
Format the document with proper sections, numbering, and hierarchical structure.
Include all necessary clauses and provisions typically found in a ${template.name}.`;
    
    // Option 1: Streaming response
    if (req.headers.get('accept')?.includes('text/event-stream')) {
      try {
        // We'll use the direct Google API approach for streaming
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) {
          throw new Error('Google Generative AI API key is not defined');
        }

        // Create a streaming request to Google's API
        const googleResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey,
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [{ text: prompt }]
                }
              ],
              generationConfig: MODEL_CONFIG,
            }),
          }
        );

        if (!googleResponse.ok) {
          const errorText = await googleResponse.text();
          console.error(`Google API error (${googleResponse.status}): ${errorText}`);
          throw new Error(`Google API error (${googleResponse.status}): ${googleResponse.statusText}`);
        }

        if (!googleResponse.body) {
          throw new Error('Response body is null');
        }

        // Transform the Google API response into SSE format
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const reader = googleResponse.body.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();

        // Process the stream in the background
        (async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              const chunk = decoder.decode(value, { stream: true });
              
              // Parse the JSON chunk (Google API returns newline-delimited JSON)
              const lines = chunk.split('\n').filter(line => line.trim() !== '');
              
              for (const line of lines) {
                try {
                  const data = JSON.parse(line);
                  // Extract the text content
                  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                  if (text) {
                    // Format as SSE
                    const sseData = `data: ${JSON.stringify({ text })}\n\n`;
                    await writer.write(encoder.encode(sseData));
                  }
                } catch (e) {
                  console.error('Error parsing JSON chunk:', e);
                }
              }
            }
            
            // End the stream
            await writer.write(encoder.encode('data: [DONE]\n\n'));
            await writer.close();
          } catch (error) {
            console.error('Error processing stream:', error);
            await writer.close();
          }
        })();
        
        // Return the readable stream
        return new Response(readable, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
          },
        });
      } catch (error) {
        console.error('Error in streaming response:', error);
        throw error;
      }
    } 
    
    // Option 2: Non-streaming response
    else {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }]
              }
            ],
            generationConfig: MODEL_CONFIG,
          }),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          console.error(`Google API error: Status ${response.status}, Message: ${response.statusText}, Body: ${errorBody}`);
          throw new Error(`Google API error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.candidates || data.candidates.length === 0) {
          console.error('No candidates returned from Google API:', JSON.stringify(data));
          throw new Error('No valid response from the AI model');
        }
        
        const generatedText = data.candidates[0]?.content?.parts?.[0]?.text || '';
        
        return new Response(generatedText, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
          },
        });
      } catch (error) {
        console.error('Error in non-streaming response:', error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Unknown error processing your request' },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('Error generating document:', error);
    return NextResponse.json(
      { error: 'Failed to generate document' },
      { status: 500 }
    );
  }
}