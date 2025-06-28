# Supabase Setup for SessionMailer

This guide will help you set up Supabase authentication and database for your SessionMailer application.

## Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. Your SessionMailer project from Jones Web Designs organization

## Step 1: Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Select your organization (Jones Web Designs)
4. Name your project: `sessionmailer`
5. Choose a database password and region
6. Click "Create new project"

## Step 2: Get Your Project Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **Project API Keys** → `anon` `public` key
   - **Project API Keys** → `service_role` `secret` key

## Step 3: Set Environment Variables

Create a `.env.local` file in your project root with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

Replace the placeholder values with your actual Supabase credentials.

## Step 4: Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the contents of `supabase-schema.sql` from your project
4. Click "Run" to execute the SQL

This will create:
- `profiles` table for user information
- `saved_projects` table for saved email templates
- Row Level Security (RLS) policies
- Triggers for automatic profile creation

## Step 5: Configure Authentication

1. In Supabase dashboard, go to **Authentication** → **Settings**
2. Under **Site URL**, add your development URL: `http://localhost:3000`
3. Under **Redirect URLs**, add:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/dashboard`
4. Enable email confirmations if desired (optional for development)

## Step 6: Test the Setup

1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Click "Sign Up" to create a test account
4. Check your Supabase dashboard to see the new user in **Authentication** → **Users**
5. Check the `profiles` table in **Table Editor** to see the auto-created profile

## Features Included

### Authentication
- ✅ Sign up with email/password
- ✅ Sign in with email/password
- ✅ Sign out functionality
- ✅ Protected routes (dashboard requires auth)
- ✅ User profile management
- ✅ Premium status tracking

### Database
- ✅ User profiles with premium status
- ✅ Saved email templates (premium feature)
- ✅ Row Level Security for data protection
- ✅ Automatic profile creation on signup

### UI Components
- ✅ Professional sign-in/sign-up pages
- ✅ Navbar with user dropdown
- ✅ Authentication state management
- ✅ Loading states and error handling

## Troubleshooting

### Common Issues

1. **Environment variables not loading**
   - Make sure `.env.local` is in your project root
   - Restart your development server after adding env vars
   - Check that variable names match exactly

2. **Database connection errors**
   - Verify your Supabase URL and keys are correct
   - Check that your project is active in Supabase dashboard
   - Ensure the database schema was created successfully

3. **Authentication not working**
   - Check that redirect URLs are configured correctly
   - Verify that RLS policies are set up properly
   - Check browser console for any JavaScript errors

4. **Premium features not working**
   - Check that the `profiles` table has the `is_premium` column
   - Verify that the user profile was created automatically
   - Test by manually setting `is_premium = true` in Supabase dashboard

### Getting Help

If you encounter issues:
1. Check the browser console for errors
2. Check the Supabase logs in your dashboard
3. Verify all environment variables are set correctly
4. Ensure the database schema was applied successfully

## Next Steps

Once authentication is working:
1. Test the sign-up and sign-in flows
2. Verify that the dashboard is protected
3. Test premium features (if applicable)
4. Deploy to production with production Supabase URLs

Your SessionMailer app now has full authentication and user management capabilities! 