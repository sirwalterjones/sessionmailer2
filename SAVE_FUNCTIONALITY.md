# Save Functionality Documentation

## Overview

SessionMailer now includes comprehensive project saving functionality that allows users to save their generated email templates with all customization settings.

## Features

### ✅ **Save Projects**
- Save generated email templates with custom names
- Store all color and typography customizations
- Preserve original URLs used for generation
- Automatic timestamp tracking

### ✅ **Load Projects**
- Restore saved projects with all customizations
- One-click loading of previous work
- Maintains URL inputs and generated content

### ✅ **Manage Projects**
- View all saved projects in a beautiful interface
- Delete unwanted projects
- Copy HTML directly from saved projects
- Search and filter capabilities

### ✅ **Security**
- Row Level Security (RLS) ensures users only see their own projects
- Secure API endpoints with user authentication
- Protected routes and data validation

## Database Schema

### `saved_projects` Table
```sql
CREATE TABLE public.saved_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  email_html TEXT NOT NULL,
  customization JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Customization Data Structure
```typescript
type ProjectCustomization = {
  primaryColor: string
  secondaryColor: string
  headingTextColor: string
  paragraphTextColor: string
  headingFont: string
  paragraphFont: string
  headingFontSize: number
  paragraphFontSize: number
}
```

## API Endpoints

### `GET /api/projects?userId={userId}`
Fetch all saved projects for a user.

**Response:**
```json
{
  "projects": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "Project Name",
      "url": "https://book.usesession.com/s/...",
      "email_html": "<html>...</html>",
      "customization": { ... },
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### `POST /api/projects`
Save a new project.

**Request Body:**
```json
{
  "userId": "uuid",
  "name": "Project Name",
  "url": "https://book.usesession.com/s/...",
  "emailHtml": "<html>...</html>",
  "customization": { ... }
}
```

### `PUT /api/projects`
Update an existing project.

### `DELETE /api/projects?projectId={id}&userId={userId}`
Delete a project.

## Components

### `SaveProjectDialog`
Beautiful modal dialog for saving projects with:
- Project name input with validation
- Character count and helpful hints
- Loading states and error handling
- Modern glass morphism design

### `SavedProjects`
Comprehensive project management interface with:
- Grid layout of saved projects
- Load, copy, and delete actions
- Customization indicators
- Empty state handling
- Responsive design

### Updated `Dashboard`
Enhanced with save functionality:
- Save button integration
- Project loading capabilities
- State management for saved projects
- Error handling and user feedback

## User Experience

### Saving a Project
1. Generate an email template
2. Customize colors and fonts as desired
3. Click "Save Project" button
4. Enter a descriptive project name
5. Project is saved with all customizations

### Loading a Project
1. View saved projects in the dashboard
2. Click "Load" on any saved project
3. All customizations are restored
4. Email preview updates automatically
5. Continue editing or generate new variations

### Managing Projects
1. View all projects with timestamps and URLs
2. Copy HTML directly to clipboard
3. Delete unwanted projects
4. Projects are automatically organized by date

## Migration

If you have an existing SessionMailer installation, run this SQL in your Supabase dashboard:

```sql
-- Add customization column to existing saved_projects table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'saved_projects' 
    AND column_name = 'customization'
  ) THEN
    ALTER TABLE public.saved_projects ADD COLUMN customization JSONB;
  END IF;
END $$;
```

## Security Considerations

- All API endpoints validate user authentication
- Row Level Security prevents unauthorized access
- Input validation on all user data
- SQL injection protection through parameterized queries
- XSS protection through proper HTML escaping

## Performance

- Efficient database queries with proper indexing
- Lazy loading of saved projects
- Optimized JSON storage for customization data
- Minimal API calls with smart caching

## Future Enhancements

- [ ] Project sharing capabilities
- [ ] Project templates and duplicating
- [ ] Bulk operations (delete multiple, export)
- [ ] Project search and filtering
- [ ] Project categories and tags
- [ ] Version history for projects
- [ ] Collaborative editing features

## Troubleshooting

### Common Issues

1. **"Please sign in to save projects"**
   - Ensure user is authenticated
   - Check Supabase authentication setup

2. **"Failed to save project"**
   - Verify database connection
   - Check RLS policies are correctly set up
   - Ensure customization column exists

3. **Projects not loading**
   - Check API endpoint accessibility
   - Verify user permissions in database
   - Check browser console for errors

### Debug Steps

1. Check browser console for JavaScript errors
2. Verify Supabase connection in Network tab
3. Test API endpoints directly
4. Check database logs in Supabase dashboard
5. Verify environment variables are set correctly 