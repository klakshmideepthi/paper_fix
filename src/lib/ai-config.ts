// src/lib/ai-config.ts
import { createGoogleGenerativeAI, google } from '@ai-sdk/google';

// Export the model creation function from the AI SDK
export const gemini = google;

// Create a customized Google Generative AI provider with your API key
export const googleAI = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
});

// Update to correct model name - gemini-1.5-flash is widely supported
// Models have specific naming conventions that need to be followed exactly
export const GEMINI_MODEL = 'gemini-2.0-flash';

// Optional: More detailed model configuration
export const MODEL_CONFIG = {
  temperature: 0.5,
  topP: 0.8,
  topK: 40,
  maxOutputTokens: 8192,
};