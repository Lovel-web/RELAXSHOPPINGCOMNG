# RelaxShopping - Premium Scheduled Grocery Delivery Platform

## Current Preview Behavior (Important)

The application may render a blank screen when run without environment variables.

This is expected behavior.

### Reason
- The App component is wrapped in AuthProvider
- AuthProvider depends on Supabase configuration
- When Supabase environment variables are missing:
  - `useAuth().loading` remains true
  - App.tsx intentionally renders a loading / fallback state
  - Routes and pages (including Home.tsx) are not mounted

### Status
- This does NOT indicate a broken UI
- This is a known and documented prototype limitation
- UI components and pages exist but are gated behind auth initialization

No logic or configuration should be modified until prototype-to-MVP conversion begins.

RelaxShopping is a production-ready, full-stack grocery delivery platform designed for Nigeria (estates & hotels), featuring scheduled delivery rounds, role-based access, and secure Paystack integration.

## 🎨 Design & Theme

- **Colors**: Aqua-Blue (#00D4FF) & Purple (#7B61FF) with gold accents (#FFC857)
- **UI**: Modern, responsive design with neon accents, rounded cards, and smooth animations
- **Tech Stack**: React + Vite + TypeScript + Tailwind CSS + shadcn/ui + Framer Motion
- **Backend**: Supabase (Authentication, PostgreSQL Database, Realtime)
- **Payments**: Paystack (test mode)
- **Hosting**: Netlify

## 🚀 Features

### User Roles
- **Customer**: Browse and order products within their LGA
- **Vendor**: Upload/manage products and shop details
- **Staff**: Manage batches and deliveries for assigned LGA
- **Admin**: State-level management (LGAs, estates, vendor approvals)
- **Superadmin**: Global access and settings management

### Core Functionality
- ✅ Role-based authentication with approval workflows
- ✅ Product management with image storage
- ✅ CSV bulk upload for vendors
- ✅ Shopping cart with stock validation
- ✅ Scheduled delivery slots (10 AM, 1 PM, 4 PM)
- ✅ Batch order processing by estate/LGA
- ✅ Secure Paystack payment integration
- ✅ Delivery fee calculation (₦400 base, multiplies for capacity)
- ✅ Real-time notifications system with Supabase Realtime
- ✅ Vendor payment approvals by admin
- ✅ Comprehensive Row Level Security (RLS) policies

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Netlify account (free tier works)
- Paystack test account

## 🛠️ Local Development Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd relaxshopping
npm install
```

### 2. Supabase Setup

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Run the SQL migrations (see SEED.md for complete schema)
4. Get your project credentials:
   - Go to Project Settings → API
   - Copy the **Project URL** and **anon/public** key

### 3. Environment Variables

Create a `.env` file in the project root (NEVER commit this file):

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Paystack Public Key (test)
VITE_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx
```

**Important**: Use the `.env.example` as a template. Never commit real API keys!

### 4. Run Locally

```bash
# Using Netlify Dev (recommended - includes serverless functions)
npm install -g netlify-cli
netlify dev

# Or standard Vite dev server (functions won't work)
npm run dev
```

The app will be available at `http://localhost:8080` (Netlify Dev) or `http://localhost:5173` (Vite).

## 🌐 Netlify Deployment

### 1. Connect to Netlify

1. Push your code to GitHub
2. Go to [Netlify](https://netlify.com) and sign in
3. Click "Add new site" → "Import an existing project"
4. Connect to your GitHub repository
5. Build settings should auto-detect (or use):
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

### 2. Environment Variables in Netlify

**CRITICAL**: Add these environment variables in Netlify Dashboard:

1. Go to Site settings → Environment variables → Add a variable
2. Add each variable:

**Client-side variables** (VITE_ prefix):
```
VITE_SUPABASE_URL = https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY = your_supabase_anon_key
VITE_PAYSTACK_PUBLIC_KEY = pk_test_xxxxxxxxxxxxxxxxxxxxx
```

**Server-side variables** (NO VITE_ prefix - these are SECRET):
```
SUPABASE_SERVICE_ROLE_KEY = your_service_role_key
PAYSTACK_SECRET_KEY = sk_test_xxxxxxxxxxxxxxxxxxxxx
PAYSTACK_WEBHOOK_SECRET = your_webhook_secret
DELIVERY_FEE_NGN = 400
```

3. Click "Save" for each variable
4. Trigger a new deployment: Deploys → Trigger deploy → Deploy site

### 3. Paystack Webhook Setup

1. Go to [Paystack Dashboard](https://dashboard.paystack.com/) → Settings → Webhooks
2. Add your Netlify webhook URL:
   ```
   https://your-site-name.netlify.app/.netlify/functions/paystack-webhook
   ```
3. Copy the webhook secret and add it to Netlify environment variables as `PAYSTACK_WEBHOOK_SECRET`

## 👑 Creating a Superadmin

Since Superadmin requires full access, you must create it manually:

### Method 1: Via Supabase Dashboard (Easiest)

1. Sign up a regular account via the UI
2. Go to Supabase Dashboard → SQL Editor
3. Run the following SQL (replace with actual user ID):
   ```sql
   -- Update profile to approved
   UPDATE profiles SET approved = true WHERE id = 'your-user-id';
   
   -- Update role to superadmin
   UPDATE user_roles SET role = 'superadmin' WHERE user_id = 'your-user-id';
   ```
4. Reload the app - you now have Superadmin access

### Method 2: Via SQL on Signup Trigger

See SEED.md for detailed instructions on database setup.

## 🧪 Testing

### Manual Testing with cURL

**Initialize Payment:**
```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/paystack-init \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "amount": 5000,
    "orderId": "test-order-123",
    "metadata": {"lgaId": "test-lga"}
  }'
```

**Verify Payment:**
```bash
curl "https://your-site.netlify.app/.netlify/functions/paystack-verify?reference=RS-test-order-123-1234567890"
```

### Test Credentials

Use Paystack test cards:
- **Success**: `4084 0840 8408 4081`
- **Insufficient Funds**: `4084 0840 8408 4093`
- **CVV**: Any 3 digits
- **Expiry**: Any future date
- **PIN**: `1234`

## 🖼️ Logo and Assets

The generated logo is a **placeholder**. To replace:

1. Create your custom logo (512x512 recommended)
2. Replace `/public/logo.png` and `/public/favicon.png`
3. Update `index.html` if you add more meta images

Current logo: Neon aqua shopping cart with purple gradient basket and gold accents.

## 📝 Image Storage

Products can store images in Supabase Storage or as URLs.

**Supabase Storage** (recommended):
- Create a `products` bucket in Storage
- Set appropriate RLS policies for uploads
- Store public URLs in the database

## 🔒 Security Best Practices

- ✅ Never commit `.env` file (already in `.gitignore`)
- ✅ Server-side secrets only in Netlify environment variables
- ✅ Row Level Security (RLS) enforces role-based access
- ✅ Roles stored in separate `user_roles` table to prevent privilege escalation
- ✅ Paystack webhook signature verification implemented
- ✅ Input validation on all forms with zod schemas

### If Secrets Are Accidentally Committed

**Immediate Actions:**
1. Rotate all compromised keys (Supabase, Paystack)
2. Update Netlify environment variables
3. Remove from Git history:

```bash
# Install BFG Repo-Cleaner
brew install bfg  # or download from https://rtyley.github.io/bfg-repo-cleaner/

# Remove .env file from history
bfg --delete-files .env

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (WARNING: this rewrites history)
git push origin --force --all
```

## 📚 Additional Resources

- [Setup Guide](./SETUP_GUIDE.md) - Detailed step-by-step guide with screenshots
- [Supabase Documentation](https://supabase.com/docs)
- [Paystack Documentation](https://paystack.com/docs)
- [Netlify Documentation](https://docs.netlify.com)

## 🐛 Troubleshooting

### Build Fails on Netlify

- Check all environment variables are set correctly
- Ensure Node version is 18+ in Netlify settings
- Review build logs for specific errors

### Authentication Not Working

- Verify Supabase URL and anon key in `.env` match Supabase Dashboard
- Check Supabase Authentication is enabled
- Ensure RLS policies allow user profile creation

### Payments Failing

- Verify Paystack keys are test keys for testing
- Check Paystack webhook is configured
- Review Netlify function logs

### 404 Errors on Deployed Site

- Ensure `netlify.toml` has the redirect rule
- Check client-side routing is working

## 📄 License

MIT License - feel free to use for your projects!

## 🤝 Contributing

Contributions welcome! Please open an issue or PR for bugs or features.

---

**Built with ❤️ for Nigerian entrepreneurs**
