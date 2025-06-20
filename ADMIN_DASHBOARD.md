# Admin Dashboard - SessionMailer

A comprehensive admin dashboard for managing users, viewing analytics, and overseeing SessionMailer operations.

## Features

### 🔐 **Admin Authentication**
- Secure admin-only access with middleware protection
- Admin status stored in user profiles
- Automatic admin assignment for `walterjonesjr@gmail.com`

### 👥 **User Management**
- View all registered users with detailed information
- See user activity: project counts, last login, registration date
- Manage user permissions:
  - Toggle premium status
  - Grant/revoke admin access
  - Reset user passwords
  - Delete user accounts
- User status indicators (Premium, Admin, Verified)

### 📊 **Analytics & Insights**
- **Overview Dashboard**:
  - Total users, premium users, active users
  - Project creation statistics
  - User registration trends
  - Template sharing metrics

- **User Activity Distribution**:
  - Users with no projects
  - Users with 1 project
  - Users with 2-5 projects
  - Users with 6-10 projects
  - Power users with 10+ projects

- **Domain Analytics**:
  - Most popular websites being processed
  - Usage patterns across different domains

- **Trend Analysis**:
  - 30-day user registration trends
  - 30-day project creation trends
  - Weekly and monthly growth metrics

### 🎯 **Business Metrics**
- Premium conversion rate
- Average projects per user
- Template sharing engagement
- User retention insights

## Setup Instructions

### 1. Database Migration
Run the admin migration in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of migration-add-admin.sql
-- This will:
-- - Add is_admin column to profiles table
-- - Set walterjonesjr@gmail.com as admin
-- - Create admin policies for data access
-- - Update the user registration function
```

### 2. Environment Variables
Ensure you have the required Supabase environment variables in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. Access the Dashboard
1. Sign in as `walterjonesjr@gmail.com`
2. Navigate to `/admin` or use the "Admin Dashboard" link in the user dropdown
3. Enjoy comprehensive admin capabilities!

## Security Features

### 🛡️ **Route Protection**
- Middleware automatically checks admin status
- Non-admin users redirected to dashboard
- Unauthenticated users redirected to sign-in

### 🔒 **Database Security**
- Row Level Security (RLS) policies
- Admin-only data access patterns
- Secure API endpoints with permission checks

### 🚫 **Admin Safeguards**
- Admins cannot remove their own admin status
- Primary admin account cannot be deleted
- All actions are logged and traceable

## API Endpoints

### `GET /api/admin/users`
Fetch all users with profiles and project counts.

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "created_at": "2024-01-15T10:30:00Z",
      "last_sign_in_at": "2024-01-20T14:22:00Z",
      "email_confirmed_at": "2024-01-15T10:35:00Z",
      "profile": { "full_name": "User Name" },
      "project_count": 5,
      "is_premium": false,
      "is_admin": false
    }
  ],
  "total": 156
}
```

### `PUT /api/admin/users`
Update user permissions and settings.

**Actions:**
- `reset_password` - Generate password reset link
- `toggle_premium` - Enable/disable premium status
- `toggle_admin` - Grant/revoke admin access
- `delete_user` - Delete user account and data

### `GET /api/admin/analytics`
Fetch comprehensive analytics data.

**Response:**
```json
{
  "overview": {
    "totalUsers": 156,
    "premiumUsers": 23,
    "activeUsers": 89,
    "totalProjects": 342,
    "newUsers30Days": 34,
    "newProjects30Days": 67
  },
  "trends": {
    "userRegistrationTrend": [...],
    "projectCreationTrend": [...]
  },
  "insights": {
    "topDomains": [...],
    "activityDistribution": {...},
    "premiumConversionRate": "14.7",
    "averageProjectsPerUser": "3.8"
  }
}
```

## User Interface

### 📱 **Responsive Design**
- Beautiful, modern interface built with Tailwind CSS
- Mobile-friendly responsive layout
- Intuitive navigation with tabs and cards

### 🎨 **Visual Elements**
- Color-coded status badges
- Interactive charts and progress bars
- Loading states and error handling
- Confirmation dialogs for destructive actions

### ⚡ **Performance**
- Efficient data loading with proper caching
- Optimized queries for large datasets
- Smooth animations and transitions

## Monitoring & Maintenance

### 📈 **Growth Tracking**
- Monitor user acquisition trends
- Track feature adoption rates
- Identify popular content domains

### 🔧 **User Support**
- Quick access to user information
- Password reset capabilities
- Account management tools

### 💰 **Business Intelligence**
- Premium conversion tracking
- User engagement metrics
- Revenue optimization insights

## Future Enhancements

- [ ] Advanced filtering and search
- [ ] Export capabilities (CSV, PDF)
- [ ] Email notification system
- [ ] Advanced charts with Chart.js/Recharts
- [ ] Audit log for admin actions
- [ ] Bulk user operations
- [ ] Custom analytics date ranges
- [ ] Real-time notifications
- [ ] A/B testing management
- [ ] Revenue tracking integration

## Troubleshooting

### Common Issues

1. **"Access Denied" Error**
   - Ensure user has admin status in profiles table
   - Check middleware configuration
   - Verify environment variables

2. **API Endpoints Not Working**
   - Confirm SUPABASE_SERVICE_ROLE_KEY is set
   - Check database policies are created
   - Verify API route files exist

3. **Missing Data**
   - Run the migration script completely
   - Check RLS policies are active
   - Ensure user profiles are created

### Support

For technical support or questions about the admin dashboard:
1. Check the browser console for errors
2. Verify Supabase connection in Network tab
3. Review the migration script execution
4. Contact the development team

---

**Admin Dashboard Version:** 1.0.0  
**Last Updated:** January 2024  
**Compatible with:** SessionMailer v2.0+ 