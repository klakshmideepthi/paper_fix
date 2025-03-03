// src/app/api/edit/route.ts
import { streamText } from 'ai';
import { gemini, GEMINI_MODEL } from '@/lib/ai-config';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { content, instruction } = await req.json();

    if (!content || !instruction) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const prompt = `You are an expert legal document editor. Here is the current document content:

---BEGIN DOCUMENT---
${content}
---END DOCUMENT---

User instruction: "${instruction}"

Provide the complete, updated document with the requested changes. 
Maintain the same formatting and structure unless specifically requested to change it.
Return ONLY the updated document content, without any explanations or additional text.`;

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
                  role: 'system',
                  parts: [{ text: 'You are an expert legal document editor that focuses on making precise edits to documents.' }]
                },
                {
                  role: 'user',
                  parts: [{ text: prompt }],
                },
              ],
              generationConfig: {
                temperature: 0.5,
              },
            }),
          }
        );

        if (!googleResponse.ok) {
          const errorText = await googleResponse.text();
          throw new Error(`Google API error (${googleResponse.status}): ${errorText}`);
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
      // Use the Google AI directly with a custom implementation
      try {
        // We'll use the Google API directly
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'system',
                parts: [{ text: 'You are an expert legal document editor that focuses on making precise edits to documents.' }]
              },
              {
                role: 'user',
                parts: [{ text: prompt }]
              }
            ],
            generationConfig: {
              temperature: 0.5,
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`Google API error: ${response.statusText}`);
        }

        const data = await response.json();
        const editedText = data.candidates[0]?.content?.parts[0]?.text || '';
        
        return new Response(editedText, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
          },
        });
      } catch (error) {
        console.error('Error in non-streaming response:', error);
        throw error;
      }
    }
  } catch (error) {
    console.error('Error editing document:', error);
    return NextResponse.json(
      { error: 'Failed to edit document' },
      { status: 500 }
    );
  }
}