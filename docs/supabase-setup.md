# Supabase Integration Setup

This document outlines the steps needed to complete the Supabase integration for authentication and database functionality.

## Steps to Complete Setup

1. Create a Supabase Project:
   - Go to https://supabase.com
   - Create a new project
   - Get your project URL and anon key from the project settings -> API

2. Set Environment Variables:
   Add these to your `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. Database Setup:
   - Go to the SQL editor in your Supabase dashboard
   - Copy and paste the contents of `supabase/schema.sql`
   - Run the SQL to create the tables and set up Row Level Security (RLS)

4. Enable Auth Providers:
   - Go to Authentication -> Providers in your Supabase dashboard
   - Enable Email provider
   - (Optional) Configure additional providers like GitHub

5. Configure Email Templates:
   - Go to Authentication -> Email Templates
   - Customize the email templates for:
     - Confirmation
     - Reset password
     - Magic link (if using)

## Features Implemented

- ✅ User authentication (sign up, sign in, sign out)
- ✅ Password reset functionality
- ✅ Protected routes with middleware
- ✅ User profiles
- ✅ Document storage with RLS
- ✅ Template management

## Database Schema

The following tables are created:

- `documents`: Stores user-created documents
- `templates`: Stores document templates
- `profiles`: Stores additional user information

Row Level Security (RLS) is enabled on all tables to ensure data privacy and security.

## Authentication Flow

1. Users can sign up with email/password
2. Email verification is required
3. Users can reset their password via email
4. Protected routes redirect to login
5. Session management is handled via cookies

## API Routes

- `/auth/login` - Handles user sign in
- `/auth/register` - Handles user registration
- `/auth/reset-password` - Handles password reset requests
- `/api/delete-document` - Protected route for document deletion
