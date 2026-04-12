-- Add parking columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS vehicle_plate TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_ev_type ev_type DEFAULT 'none';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_size vehicle_size DEFAULT 'standard';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Create parking_lots table
CREATE TABLE IF NOT EXISTS public.parking_lots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_slots INTEGER DEFAULT 0,
  hourly_rate DECIMAL(10,2) DEFAULT 5.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for parking_lots
ALTER TABLE public.parking_lots ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for parking_lots
DROP POLICY IF EXISTS "Anyone can view active parking lots" ON public.parking_lots;
CREATE POLICY "Anyone can view active parking lots" ON public.parking_lots
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Owners can manage their lots" ON public.parking_lots;
CREATE POLICY "Owners can manage their lots" ON public.parking_lots
  FOR ALL USING (owner_id = auth.uid());

-- Create slots table  
CREATE TABLE IF NOT EXISTS public.slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lot_id UUID NOT NULL REFERENCES public.parking_lots(id) ON DELETE CASCADE,
  slot_number TEXT NOT NULL,
  price_per_hour DECIMAL(10,2) NOT NULL DEFAULT 5.00,
  ev_supported ev_type DEFAULT 'none',
  is_covered BOOLEAN DEFAULT false,
  is_accessible BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  width_inches INTEGER DEFAULT 96,
  length_inches INTEGER DEFAULT 192,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(lot_id, slot_number)
);

-- Enable RLS for slots
ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for slots
DROP POLICY IF EXISTS "Anyone can view available slots" ON public.slots;
CREATE POLICY "Anyone can view available slots" ON public.slots
  FOR SELECT USING (is_available = true);

-- Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  slot_id UUID NOT NULL REFERENCES public.slots(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status booking_status DEFAULT 'pending',
  payment_status payment_status DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL,
  stripe_payment_intent_id TEXT,
  qr_code_url TEXT,
  vehicle_plate TEXT,
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_out_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT valid_booking_times CHECK (end_time > start_time)
);

-- Enable RLS for bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for bookings
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create their own bookings" ON public.bookings;
CREATE POLICY "Users can create their own bookings" ON public.bookings
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
CREATE POLICY "Users can update their own bookings" ON public.bookings
  FOR UPDATE USING (user_id = auth.uid());