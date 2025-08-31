# Vercel Deployment Guide - Bluefin Multi-Domain Setup

## 🌐 Domain Configuration

This project uses **3 custom domains** for the Bluefin restaurant system:

- **menu.bluefinwc.com** - Customer ordering interface
- **admin.bluefinwc.com** - Analytics dashboard (NEW!)
- **orders.bluefinwc.com** - Kitchen display system

## 📋 Step-by-Step Vercel Setup

### 1. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy project
vercel --prod

# Link to existing project (if already created)
vercel link
```

### 2. Add Custom Domains in Vercel Dashboard

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Domains**
3. Add these 3 domains:

```
menu.bluefinwc.com
admin.bluefinwc.com
orders.bluefinwc.com
```

### 3. DNS Configuration

Set up DNS records with your domain provider:

```dns
# CNAME Records
menu.bluefinwc.com    → cname.vercel-dns.com
admin.bluefinwc.com   → cname.vercel-dns.com
orders.bluefinwc.com  → cname.vercel-dns.com
```

### 4. Environment Variables

Set these in Vercel dashboard under **Settings** → **Environment Variables**:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_MENU_DOMAIN=menu.bluefinwc.com
VITE_ADMIN_DOMAIN=admin.bluefinwc.com
VITE_KITCHEN_DOMAIN=orders.bluefinwc.com
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
ADMIN_JWT_SECRET=your-secure-jwt-secret
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
```

### 5. Google OAuth Setup

Set up Google OAuth for authentication:

1. **Go to Google Cloud Console** → APIs & Services → Credentials
2. **Create OAuth 2.0 Client ID** (Web application)
3. **Add Authorized Redirect URIs**:
   ```
   https://admin.bluefinwc.com/auth/callback
   https://menu.bluefinwc.com/auth/callback
   https://orders.bluefinwc.com/auth/callback
   http://localhost:8081/auth/callback
   ```
4. **Add Authorized Origins**:
   ```
   https://admin.bluefinwc.com
   https://menu.bluefinwc.com
   https://orders.bluefinwc.com
   http://localhost:8081
   ```
5. **Copy Client ID** and set as `VITE_GOOGLE_CLIENT_ID` in Vercel

### 6. Verify Domain Routing

After deployment, test each domain:

- **https://menu.bluefinwc.com** → Customer menu interface with Google Sign-In
- **https://admin.bluefinwc.com** → Analytics dashboard with Google OAuth
- **https://orders.bluefinwc.com** → Kitchen display system

## 🔧 Advanced Configuration

### Vercel CLI Commands

```bash
# Check deployment status
vercel ls

# View domain configuration  
vercel domains ls

# Add domain via CLI
vercel domains add menu.bluefinwc.com
vercel domains add admin.bluefinwc.com
vercel domains add orders.bluefinwc.com

# Set environment variables
vercel env add VITE_ADMIN_DOMAIN
```

### SSL Certificates

Vercel automatically provisions SSL certificates for custom domains. No manual setup required.

### Performance Optimization

The `vercel.json` includes:
- Static asset caching (1 year)
- Security headers
- Proper routing for SPA
- Domain-specific environment variables

## 📊 Analytics Dashboard Setup

After deployment, set up the admin user:

```bash
# On your local machine
npm run setup-admin bluefin_admin mypassword123 "Bluefin Administrator" admin@bluefinwc.com
```

Then access: **https://admin.bluefinwc.com**

## 🚀 Production Checklist

- [ ] All 3 domains added in Vercel
- [ ] DNS CNAME records configured
- [ ] Environment variables set
- [ ] SSL certificates active (auto)
- [ ] Admin user created
- [ ] Test each domain routing
- [ ] Supabase connection working
- [ ] Payment processing configured

## 🔍 Troubleshooting

### Domain Not Working
1. Check DNS propagation: `nslookup menu.bluefinwc.com`
2. Verify CNAME points to `cname.vercel-dns.com`
3. Check Vercel domain status in dashboard

### Wrong Page Loading
1. Verify environment variables are set
2. Check domain routing in `src/App.tsx`
3. Redeploy if environment changes made

### Analytics Dashboard Issues
1. Confirm `ADMIN_JWT_SECRET` is set
2. Check Supabase connection
3. Verify admin user exists in database

## 📞 Support

For deployment issues:
- Vercel Docs: https://vercel.com/docs
- Domain Setup: https://vercel.com/docs/concepts/projects/domains
- Environment Variables: https://vercel.com/docs/concepts/projects/environment-variables