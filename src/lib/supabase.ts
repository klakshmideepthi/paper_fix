// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// These will be provided when you create your Supabase project
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a single supabase client for the entire app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database tables
export type User = {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  provider?: string;
  created_at: string;
  updated_at: string;
};

export type Document = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  template_id: string;
  template_answers: Record<string, string>;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
};