# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SessionMailer is a Next.js application that creates professional email templates for photographers from their usesession.com photo sessions. It features user authentication, project saving, customization options, and admin management capabilities.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server  
npm start
```

## Architecture & Stack

- **Framework**: Next.js 14 with App Router
- **Database**: Supabase (PostgreSQL with real-time features)
- **Authentication**: Supabase Auth with custom middleware protection
- **UI**: Tailwind CSS + shadcn/ui components
- **Web Scraping**: Playwright for session data extraction
- **Deployment**: Fly.io with Docker

## Key Components & Files

### Core Application Logic
- `src/app/api/extract-session/route.ts` - Main session extraction logic using Playwright
- `src/components/Dashboard.tsx` - Primary user interface with email customization
- `src/components/EmailPreview.tsx` - Real-time email template preview
- `src/middleware.ts` - Route protection and admin access control

### Authentication & Database
- `src/contexts/AuthContext.tsx` - Global auth state management
- `src/lib/supabase*.ts` - Database client configurations
- `supabase-schema.sql` - Database schema and RLS policies

### Admin Features
- `src/app/admin/page.tsx` - Admin dashboard for user management
- `src/app/api/admin/` - Admin API endpoints for analytics and user management
- `migration-add-admin.sql` - Admin permissions setup

## Database Schema

### Key Tables
- `profiles` - User profiles with premium/admin status
- `saved_projects` - User's saved email templates with customization settings

### Important Fields
- `profiles.is_premium` - Premium feature access
- `profiles.is_admin` - Admin dashboard access
- `saved_projects.customization` - JSONB field storing color/font preferences

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key  
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Key Features

### Session Extraction
- Scrapes usesession.com URLs using Playwright
- Extracts images, titles, and content for email templates
- Supports both single and multiple session URLs
- Converts to email-compatible HTML with inline styles

### Customization System
- Color customization (primary, secondary, text colors)
- Typography options (fonts and sizes)
- Real-time preview updates
- Saves customization settings with projects

### User Management
- Standard and premium user tiers
- Admin users can manage all users and view analytics
- Row Level Security (RLS) for data protection

### Project Management
- Save/load email templates with all customizations
- Share functionality with public URLs
- Copy-to-clipboard for email clients

## Authentication Flow

1. Middleware checks auth status on protected routes (`/dashboard`, `/admin`)
2. Admin routes require `is_admin = true` in user profile
3. Unauthenticated users redirected to `/auth/signin`
4. New users auto-create profiles via database trigger

## Common Development Patterns

### API Route Structure
```typescript
// Validate authentication
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

// Database operations with RLS
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('user_id', user.id)
```

### Component Patterns
- Use `useAuth()` context for user state
- Shadcn/ui components for consistent styling
- Loading states and error handling throughout

## Deployment

- Fly.io configuration in `fly.toml`
- Docker build with `output: 'standalone'` in Next.js config
- Environment variables managed through Fly.io dashboard
- Database migrations run manually in Supabase dashboard

## Important Notes

- Primary admin email: `walterjonesjr@gmail.com`
- Only usesession.com URLs are supported for extraction
- Playwright requires specific browser args for production deployment
- All user data protected by Supabase RLS policies