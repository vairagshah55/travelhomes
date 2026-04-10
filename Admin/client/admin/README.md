# Admin Panel

This folder contains all admin-related files organized for easy navigation and maintenance.

## Folder Structure

```
client/admin/
├── components/          # Admin-specific components
│   ├── AdminSidebar.tsx
│   ├── AdminProtectedRoute.tsx
│   ├── AdminProfileDropdown.tsx
│   ├── AdminAnalyticsOverview.tsx
│   └── AdminAnalyticsReport.tsx
├── pages/              # Admin pages
│   ├── AdminLogin.tsx
│   ├── AdminDashboard.tsx
│   ├── AdminAnalytics.tsx
│   ├── AdminAnalyticsReport.tsx
│   ├── AdminCMS.tsx
│   ├── AdminCRM.tsx
│   ├── AdminGlobalSettings.tsx
│   ├── AdminHelpDesk.tsx
│   ├── AdminMarketing.tsx
│   ├── AdminPlugins.tsx
│   ├── AdminStaff.tsx
│   ��── management/     # Management pages
│       ├── ManagementListing.tsx
│       ├── UserManagement.tsx
│       ├── VendorManagement.tsx
│       ├── BookingManagement.tsx
│       └── PaymentManagement.tsx
├── hooks/              # Admin-specific hooks (for future use)
├── index.ts            # Export barrel file
└── README.md           # This documentation
```

## Components

### AdminSidebar
The main navigation sidebar for the admin panel with collapsible menu and responsive design.

### AdminProtectedRoute
Route protection component that ensures only authenticated admins can access admin pages.

### AdminProfileDropdown
User profile dropdown with admin-specific actions like logout and profile settings.

### AdminAnalyticsOverview
Analytics dashboard with metrics cards for different services (Camper Van, Unique Stay, Activity).

### AdminAnalyticsReport
Detailed analytics reporting component with filtering and search capabilities.

## Pages

### Core Admin Pages
- **AdminLogin**: Authentication page for admin users
- **AdminDashboard**: Main admin dashboard with overview statistics
- **AdminAnalytics**: Analytics page with overview and report tabs
- **AdminAnalyticsReport**: Dedicated analytics report page

### Admin Modules
- **AdminCMS**: Content management system interface
- **AdminCRM**: Customer relationship management
- **AdminGlobalSettings**: System-wide configuration
- **AdminHelpDesk**: Support ticket management
- **AdminMarketing**: Marketing campaign management
- **AdminPlugins**: Plugin management interface
- **AdminStaff**: Staff management with roles and permissions

### Management Pages
- **ManagementListing**: Property/listing management
- **UserManagement**: User administration
- **VendorManagement**: Vendor approval and management
- **BookingManagement**: Booking oversight
- **PaymentManagement**: Payment processing and financial management

## Routes

All admin routes are prefixed with `/admin/`:

- `/admin/login` - Admin authentication
- `/admin/dashboard` - Main dashboard
- `/admin/management/*` - Management sections
- `/admin/analytics` - Analytics and reports
- `/admin/cms`, `/admin/crm`, `/admin/help-desk`, etc. - Various admin modules

## Authentication

Admin pages are protected by `AdminProtectedRoute` which checks for a valid admin token in localStorage. The demo credentials are:
- Email: `admin@travelapp.com`
- Password: `admin123`

## Import Patterns

Use these import patterns when working with admin files:

```typescript
// From admin pages to admin components
import AdminSidebar from '../components/AdminSidebar';

// From admin management pages to admin components
import AdminSidebar from '../../components/AdminSidebar';

// For UI components (always use alias)
import { Button } from '@/components/ui/button';

// For shared components that weren't moved
import HelpDeskPopup from '@/components/HelpDeskPopup';
```

## Future Enhancements

The `hooks/` directory is prepared for admin-specific React hooks such as:
- `useAdminAuth()` - Enhanced admin authentication
- `useAdminPermissions()` - Role-based access control
- `useAdminAnalytics()` - Analytics data fetching
