# RelaxShopping - Complete Setup Guide

This guide walks you through setting up RelaxShopping from scratch, step-by-step, even if you're new to web development.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Supabase Setup](#supabase-setup)
3. [Local Development](#local-development)
4. [Deploying to Netlify](#deploying-to-netlify)
5. [Paystack Configuration](#paystack-configuration)
6. [Creating Your First Admin](#creating-your-first-admin)

---

## Prerequisites

### What You Need

1. **Node.js and npm** (JavaScript runtime):
   - Download from: https://nodejs.org/ (choose LTS version 18+)
   - Installation guide: https://nodejs.org/en/download/package-manager/
   - Verify installation: Open terminal/command prompt and run:
     ```bash
     node --version  # Should show v18.x.x or higher
     npm --version   # Should show 9.x.x or higher
     ```

2. **Git** (version control):
   - Download from: https://git-scm.com/downloads
   - Verify: `git --version`

3. **Code Editor** (recommended):
   - VS Code: https://code.visualstudio.com/

4. **Accounts** (all free):
   - GitHub: https://github.com/signup
   - Supabase: https://supabase.com (use GitHub account)
   - Netlify: https://netlify.com (can sign in with GitHub)
   - Paystack: https://dashboard.paystack.com/signup (Nigerian business)

---

## Supabase Setup

### Step 1: Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New project"
3. Enter project name: `relaxshopping` (or your choice)
4. Set a strong database password (save this!)
5. Select region closest to Nigeria (e.g., Frankfurt)
6. Click "Create new project"
7. Wait for setup to complete (1-2 minutes)

### Step 2: Run Database Migrations

1. In Supabase Dashboard, click "SQL Editor" in left sidebar
2. Click "New query"
3. Copy all SQL from `SEED.md` and paste into the editor
4. Click "Run" to execute each section

**Important**: Run the SQL sections in order:
1. Create Role Enum
2. Create Tables
3. Enable Row Level Security
4. Create Security Definer Function
5. Create RLS Policies
6. Create Auto-User Trigger
7. Enable Realtime
8. Insert Default Settings

### Step 3: Get Supabase Configuration

1. Click "Project Settings" (gear icon) in left sidebar
2. Click "API" under Configuration
3. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** key: `eyJhbGciOiJIUzI1NiIs...`
4. Save these values - you'll need them in `.env` file

### Step 4: Configure Authentication

1. Go to Authentication → Providers
2. Ensure "Email" provider is enabled (it is by default)
3. Optional: Go to Authentication → URL Configuration
   - Set Site URL to your production URL later

---

## Local Development

### Step 1: Clone the Repository

```bash
# Clone from GitHub (replace with your repo URL)
git clone https://github.com/your-username/relaxshopping.git

# Navigate into the project
cd relaxshopping
```

### Step 2: Install Dependencies

```bash
# This downloads all required packages
npm install

# Wait for installation to complete (may take 2-5 minutes)
```

### Step 3: Create Environment File

1. Create a file named `.env` in the project root (same level as `package.json`)
2. Copy contents from `.env.example`:

```bash
# Create .env file
cp .env.example .env
```

3. Open `.env` in your code editor
4. Replace placeholder values with your Supabase config:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Leave Paystack key for now, we'll add it later
VITE_PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
```

5. Save the file

**CRITICAL**: Never commit `.env` to Git! It's already in `.gitignore`.

### Step 4: Run Local Development Server

```bash
# Option 1: With Netlify Dev (recommended - includes serverless functions)
npm install -g netlify-cli
netlify dev

# Option 2: Standard Vite (faster, but no serverless functions)
npm run dev
```

**Open in browser:**
- Netlify Dev: http://localhost:8080
- Vite Dev: http://localhost:5173

You should see the RelaxShopping homepage with the aqua-blue & purple theme!

---

## Deploying to Netlify

### Step 1: Push Code to GitHub

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - RelaxShopping"

# Create GitHub repository (via GitHub website)
# Then connect and push:
git remote add origin https://github.com/your-username/your-repo-name.git
git branch -M main
git push -u origin main
```

### Step 2: Connect Netlify to GitHub

1. Go to [Netlify](https://netlify.com)
2. Sign up or log in (use "Sign up with GitHub" for easier integration)
3. Click "Add new site" → "Import an existing project"
4. Click "GitHub" under "Connect to Git provider"
5. Authorize Netlify to access your GitHub
6. Select your repository: `your-username/relaxshopping`

### Step 3: Configure Build Settings

Netlify should auto-detect settings. Verify:

- **Branch to deploy**: `main`
- **Build command**: `npm run build`
- **Publish directory**: `dist`

Click "Deploy site"

**Wait**: First deployment takes 2-5 minutes.

### Step 4: Add Environment Variables to Netlify

**CRITICAL STEP**: Your app won't work without these!

1. Go to Site configuration → Environment variables
2. Click "Add a variable" → "Add a single variable"
3. Add each variable one by one:

**Client Variables** (add all from your `.env`):
```
Key: VITE_SUPABASE_URL
Value: https://your-project-id.supabase.co

Key: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIs...

Key: VITE_PAYSTACK_PUBLIC_KEY
Value: pk_test_your_paystack_public_key
```

**Server Variables** (these are SECRET - NEVER add VITE_ prefix):
```
Key: SUPABASE_SERVICE_ROLE_KEY
Value: your_service_role_key_from_supabase

Key: PAYSTACK_SECRET_KEY
Value: sk_test_your_paystack_secret_key

Key: PAYSTACK_WEBHOOK_SECRET
Value: your_webhook_secret_from_paystack

Key: DELIVERY_FEE_NGN
Value: 400
```

4. After adding all variables, click "Save"
5. Go to Deploys → Trigger deploy → "Deploy site"
6. Wait for redeploy to complete

### Step 5: Configure Supabase Auth Redirects

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Set **Site URL** to your Netlify URL: `https://your-site.netlify.app`
3. Add Redirect URL: `https://your-site.netlify.app/*`

### Step 6: Test Your Deployed Site

1. Click on your site URL (e.g., `https://relaxshopping-xyz123.netlify.app`)
2. You should see the homepage
3. Try signing up as a customer
4. Check Supabase Dashboard → Authentication - you should see the new user

**If you see errors**: Check the browser console (F12) and Netlify function logs.

---

## Paystack Configuration

### Step 1: Create Paystack Account

1. Go to [Paystack](https://dashboard.paystack.com/signup)
2. Sign up with business email
3. Verify your email
4. Complete business verification (required for live mode, not for testing)

### Step 2: Get Test API Keys

1. Log in to [Paystack Dashboard](https://dashboard.paystack.com/)
2. Click "Settings" in sidebar
3. Click "API Keys & Webhooks"
4. Make sure you're in **Test Mode** (toggle in top right)
5. Copy **Test Public Key** (starts with `pk_test_`)
6. Copy **Test Secret Key** (starts with `sk_test_`) - click "Show" to reveal

### Step 3: Add Keys to Netlify

1. Go back to Netlify Site configuration → Environment variables
2. Update these variables:
   ```
   VITE_PAYSTACK_PUBLIC_KEY = pk_test_your_actual_key
   PAYSTACK_SECRET_KEY = sk_test_your_actual_key
   ```
3. Save and redeploy

### Step 4: Configure Webhook

1. In Paystack Dashboard → Settings → API Keys & Webhooks
2. Scroll to "Webhook URL"
3. Enter your Netlify function URL:
   ```
   https://your-site-name.netlify.app/.netlify/functions/paystack-webhook
   ```
4. Click "Save Changes"
5. Copy the **Webhook Secret** shown
6. Add to Netlify environment variables:
   ```
   PAYSTACK_WEBHOOK_SECRET = your_webhook_secret
   ```
7. Save and redeploy

### Step 5: Test Payment Flow

1. Go to your deployed site
2. Sign up as a customer
3. Browse shops and add items to cart
4. Proceed to checkout
5. Use Paystack test card:
   - **Card Number**: `4084 0840 8408 4081`
   - **Expiry**: Any future date (e.g., `12/25`)
   - **CVV**: `123`
   - **PIN**: `1234`
6. Complete payment
7. Check Supabase → Table Editor → orders - your order should appear with `payment_status: 'paid'`

---

## Creating Your First Admin

### Method 1: Via Supabase Dashboard (Easiest)

1. Sign up via your site at `/auth/signup`
2. Select role: "Admin" (will be pending approval)
3. Go to [Supabase Dashboard](https://supabase.com/dashboard)
4. Navigate to SQL Editor
5. Run these queries (find your user ID first):

```sql
-- Find your user by email
SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- Copy the ID and run (replace 'your-user-id'):
UPDATE public.profiles 
SET approved = true, state = 'Lagos', full_name = 'Super Admin'
WHERE id = 'your-user-id';

UPDATE public.user_roles 
SET role = 'superadmin'
WHERE user_id = 'your-user-id';
```

6. Reload your site - you now have Superadmin access!

### Method 2: Via Table Editor

1. Go to Supabase Dashboard → Table Editor
2. Open `profiles` table, find your user, set `approved = true`
3. Open `user_roles` table, find your user, change `role` to `superadmin`

---

## Next Steps

### For Testing

1. **Create test users** for each role:
   - Customer (instant approval)
   - Vendor (needs admin approval)
   - Staff (needs admin approval)
   - Admin (needs superadmin approval)

2. **As Superadmin**:
   - Create LGAs and Estates via Admin Dashboard
   - Approve pending vendor accounts

3. **As Vendor**:
   - Add products with images
   - Test CSV bulk upload

4. **As Customer**:
   - Browse products
   - Add to cart
   - Complete checkout with test card

5. **As Staff**:
   - View batches
   - Mark orders as processing/delivered

### Going to Production

1. **Supabase**: Upgrade to Pro plan if needed for more resources
2. **Paystack**: Complete business verification to go live
3. **Switch to Live Mode**:
   - Update Paystack keys to live keys (`pk_live_`, `sk_live_`)
   - Test thoroughly in staging first
4. **Custom Domain**: Add via Netlify Site settings → Domain management
5. **Monitoring**: Set up error tracking (e.g., Sentry)

---

## Troubleshooting

### "Auth error" or login not working
- Check `.env` file exists and has correct Supabase URL and key
- Verify Supabase URL Configuration has correct redirect URLs
- Redeploy Netlify with environment variables

### "Payment initialization failed"
- Check `PAYSTACK_SECRET_KEY` is set in Netlify (not `.env`)
- Verify Paystack test mode is enabled
- Check Netlify function logs for errors

### "404 on page refresh"
- Ensure `netlify.toml` has redirect rule
- Check build deployed successfully
- Verify `dist` folder contains `index.html`

### User profile not created on signup
- Check the database trigger exists in Supabase
- Verify RLS policies allow profile creation
- Check Supabase logs for errors

---

## Support

- **Documentation**: See [README.md](./README.md)
- **Supabase**: https://supabase.com/docs
- **Netlify**: https://docs.netlify.com
- **Paystack**: https://paystack.com/docs

**Happy Building! 🚀**
