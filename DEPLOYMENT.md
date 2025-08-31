# Deployment Configuration - Bluefin Sushi Platform

## Domain Routing Setup

This application is configured for deployment on Vercel with the following domain mapping:

### Required Domain Configuration
- **menu.bluefinwc.com** → `/menu` route (customer ordering interface)
- **menu.bluefinwc.com/admin** → `/menu/admin` route (restaurant admin panel)
- **orders.bluefinwc.com** → `/kitchen` route (kitchen management system)
- **menu.bluefinwc.com/auth** → `/auth` route (authentication)

## Vercel Configuration

### Files Created/Updated:
- `vercel.json` - Main deployment configuration
- `.env.example` - Environment variables template
- `index.html` - Updated with proper metadata for Bluefin Sushi

### Key Configuration Features:
- **SPA Routing**: All routes redirect to `index.html` for React Router handling
- **Asset Caching**: Static assets cached for 1 year with immutable headers
- **Security Headers**: CSP, XSS protection, and frame options configured
- **Framework Detection**: Configured as Vite framework for optimal builds

## Environment Variables Required

Set these in your Vercel project dashboard:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Safety Protocols Implemented

- **Domain Filtering**: Application only serves data for `bluefinwc.com` domain
- **Bluefin Restaurant Only**: Database queries filtered by domain
- **Additive Changes**: No modification of existing restaurant data
- **Security Headers**: Multiple layers of security protection

## Build Status

✅ Build tested and working
✅ Production optimization enabled
✅ Static asset caching configured
✅ Domain routing ready
✅ Environment variables documented
✅ Security headers implemented

## Deployment Steps

1. Push code to your Vercel-connected repository
2. Set environment variables in Vercel dashboard
3. Configure custom domains in Vercel project settings:
   - Add `menu.bluefinwc.com`
   - Add `orders.bluefinwc.com`
4. Deploy and test all routes

## Route Testing

After deployment, verify these routes work:
- `https://menu.bluefinwc.com/` → Index page
- `https://menu.bluefinwc.com/menu` → Customer menu
- `https://menu.bluefinwc.com/menu/admin` → Admin panel
- `https://orders.bluefinwc.com/` → Should route to kitchen interface
- `https://menu.bluefinwc.com/auth` → Authentication page

All routes should properly load the React application and handle client-side routing.