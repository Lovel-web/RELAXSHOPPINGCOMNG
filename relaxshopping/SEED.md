# RelaxShopping - Database Seeding Guide

## Supabase Database Schema

Run these SQL migrations in Supabase SQL Editor to create the database schema.

### Step 1: Create Role Enum

```sql
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('customer', 'vendor', 'staff', 'admin', 'superadmin');
```

### Step 2: Create Tables

```sql
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  state TEXT,
  lga_id UUID,
  estate_id UUID,
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)
);

-- LGAs table
CREATE TABLE public.lgas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  created_by_admin_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Estates table
CREATE TABLE public.estates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  lga_id UUID REFERENCES public.lgas(id) ON DELETE CASCADE,
  created_by_admin_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendors table
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  bank_name TEXT,
  account_number TEXT,
  account_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  description TEXT,
  unit TEXT DEFAULT 'piece',
  stock INTEGER DEFAULT 0,
  image_url TEXT,
  lga_id UUID REFERENCES public.lgas(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  items JSONB NOT NULL,
  subtotal NUMERIC NOT NULL,
  delivery_fee NUMERIC DEFAULT 0,
  vat NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  estate_id UUID,
  lga_id UUID,
  batch_id TEXT,
  batch_date TEXT,
  batch_slot TEXT,
  payment_ref TEXT,
  payment_status TEXT DEFAULT 'pending',
  status TEXT DEFAULT 'pending',
  serial_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payouts table
CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  order_id UUID REFERENCES public.orders(id),
  batch_id TEXT,
  status TEXT DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  processed_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  roles TEXT[],
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings table
CREATE TABLE public.settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  delivery_fee_ngn NUMERIC DEFAULT 400,
  batch_times TEXT[] DEFAULT ARRAY['10:00', '12:00', '16:00'],
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin logs table
CREATE TABLE public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  actor_name TEXT,
  action_type TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Step 3: Enable Row Level Security

```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lgas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
```

### Step 4: Create Security Definer Function

```sql
-- Function to check user role (prevents infinite recursion in RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;
```

### Step 5: Create RLS Policies

```sql
-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins and superadmins can view all profiles" ON public.profiles
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'superadmin')
  );

CREATE POLICY "Superadmins can update profiles" ON public.profiles
  FOR UPDATE USING (public.has_role(auth.uid(), 'superadmin'));

-- User roles policies
CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view roles in their state" ON public.user_roles
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'superadmin')
  );

CREATE POLICY "Users can insert own role" ON public.user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Superadmins can update roles" ON public.user_roles
  FOR UPDATE USING (public.has_role(auth.uid(), 'superadmin'));

-- LGAs policies
CREATE POLICY "Anyone can view LGAs" ON public.lgas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage LGAs" ON public.lgas
  FOR ALL USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'superadmin')
  );

-- Estates policies
CREATE POLICY "Anyone can view estates" ON public.estates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage estates" ON public.estates
  FOR ALL USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'superadmin')
  );

-- Products policies
CREATE POLICY "Anyone can view products" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Vendors can manage own products" ON public.products
  FOR ALL USING (
    vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
  );

-- Orders policies
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can view orders in their LGA" ON public.orders
  FOR SELECT USING (
    public.has_role(auth.uid(), 'staff') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'superadmin')
  );

CREATE POLICY "Staff can update orders" ON public.orders
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'staff') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'superadmin')
  );

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Settings policies
CREATE POLICY "Anyone can view settings" ON public.settings
  FOR SELECT USING (true);

CREATE POLICY "Superadmins can update settings" ON public.settings
  FOR UPDATE USING (public.has_role(auth.uid(), 'superadmin'));

-- Admin logs policies
CREATE POLICY "Admins can view logs" ON public.admin_logs
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'superadmin')
  );

CREATE POLICY "Admins can create logs" ON public.admin_logs
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'superadmin')
  );

-- Vendors policies
CREATE POLICY "Users can view vendors" ON public.vendors
  FOR SELECT USING (true);

CREATE POLICY "Vendors can manage own vendor profile" ON public.vendors
  FOR ALL USING (auth.uid() = user_id);

-- Payouts policies
CREATE POLICY "Vendors can view own payouts" ON public.payouts
  FOR SELECT USING (
    vendor_id IN (SELECT id::text FROM public.vendors WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage payouts" ON public.payouts
  FOR ALL USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'superadmin')
  );
```

### Step 6: Create Auto-User Trigger

```sql
-- Function to auto-create profile and role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, full_name, email, approved)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    CASE 
      WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'customer') = 'customer' THEN TRUE
      ELSE FALSE
    END
  );
  
  -- Create user role (default to customer)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'role', 'customer')::app_role);
  
  RETURN NEW;
END;
$$;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Step 7: Enable Realtime

```sql
-- Enable realtime for orders and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Set replica identity for realtime
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
```

### Step 8: Insert Default Settings

```sql
INSERT INTO public.settings (id, delivery_fee_ngn, batch_times)
VALUES ('global', 400, ARRAY['10:00', '12:00', '16:00']);
```

---

## Creating a Superadmin User

Since the first superadmin cannot be created through the signup flow (it requires superadmin approval), you need to create the first superadmin manually.

### Step 1: Sign Up via the App

1. Go to your deployed app or localhost
2. Sign up with email and password
3. Note your email address

### Step 2: Update User in Supabase

1. Go to Supabase Dashboard → SQL Editor
2. Run the following SQL (replace email):

```sql
-- Find user ID by email
SELECT id FROM auth.users WHERE email = 'your-superadmin@email.com';

-- Copy the ID and run these updates
UPDATE public.profiles 
SET approved = true, state = 'Lagos', full_name = 'Super Admin'
WHERE id = 'paste-user-id-here';

UPDATE public.user_roles 
SET role = 'superadmin'
WHERE user_id = 'paste-user-id-here';
```

### Step 3: Verify Superadmin Access

1. Sign in to RelaxShopping using the superadmin credentials
2. You should be redirected to `/superadmin/dashboard`
3. You can now approve other admins and manage the platform

---

## Test User Accounts

### Admin (State-Level)
- Email: admin@test.com
- Role: admin
- State: Lagos
- Approved: true (after superadmin approval)

### Vendor
- Email: vendor@test.com
- Role: vendor
- State: Lagos
- LGA: [reference to LGA]
- Approved: true (after admin approval)

### Staff (Delivery Staff)
- Email: staff@test.com
- Role: staff
- State: Lagos
- LGA: [reference to LGA]
- Approved: true (after admin approval)

### Customer
- Email: customer@test.com
- Role: customer
- State: Lagos
- LGA: [reference to LGA]
- Estate: [reference to estate]
- Approved: true (auto-approved on signup)

---

## Bulk Product Upload via CSV

After creating a vendor account:

1. Navigate to `/vendor/dashboard`
2. Click on "Bulk Upload" tab
3. Download the sample CSV template
4. Fill in product details
5. Upload the CSV file

### CSV Format

The CSV should have these columns:
```
name,price,description,unit,stock
```

See `/public/sample-products.csv` for a working example.

---

## Testing the Full Workflow

1. **Superadmin creates/approves Admin** → Admin can manage their state
2. **Admin creates LGAs and Estates** → Defines delivery zones
3. **Admin approves Vendors and Staff** → They can access their dashboards
4. **Vendor uploads products** → Products visible to customers in same LGA
5. **Customer places order** → Order assigned to current batch
6. **Staff processes batch** → Marks orders as processing
7. **Staff delivers per estate** → Marks estate delivered, customers notified
8. **Admin approves payout** → Vendor receives payment notification

---

## Environment Variables

Ensure all required environment variables are set in Netlify:

### Client (VITE_ prefix)
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_PAYSTACK_PUBLIC_KEY

### Server (no prefix)
- SUPABASE_SERVICE_ROLE_KEY
- PAYSTACK_SECRET_KEY
- PAYSTACK_WEBHOOK_SECRET
- NODE_ENV=production
- URL=[your-netlify-site-url]

---

## Support

For issues or questions, refer to:
- `README.md` for general setup
- `SETUP_GUIDE.md` for deployment instructions
- Supabase documentation: https://supabase.com/docs
- Paystack documentation: https://paystack.com/docs
