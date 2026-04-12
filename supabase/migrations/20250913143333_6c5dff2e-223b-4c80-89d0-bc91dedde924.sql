-- Create enum types for parking system
CREATE TYPE vehicle_size AS ENUM ('compact', 'standard', 'large', 'motorcycle');
CREATE TYPE ev_type AS ENUM ('none', 'level1', 'level2', 'dc_fast');
CREATE TYPE user_role AS ENUM ('user', 'admin', 'owner');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'checked_in', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- Add parking-specific columns to existing profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS vehicle_plate TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_ev_type ev_type DEFAULT 'none';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_size vehicle_size DEFAULT 'standard';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Create parking_lots table
CREATE TABLE public.parking_lots (
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

-- Create slots table
CREATE TABLE public.slots (
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

-- Create bookings table
CREATE TABLE public.bookings (
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
  CONSTRAINT valid_booking_times CHECK (end_time > start_time),
  CONSTRAINT no_overlapping_bookings EXCLUDE USING gist (
    slot_id WITH =,
    tsrange(start_time, end_time) WITH &&
  ) WHERE (status IN ('confirmed', 'checked_in'))
);

-- Enable Row Level Security
ALTER TABLE public.parking_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for parking_lots
CREATE POLICY "Anyone can view active parking lots" ON public.parking_lots
  FOR SELECT USING (is_active = true);

CREATE POLICY "Owners can manage their lots" ON public.parking_lots
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Admins can view all lots" ON public.parking_lots
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for slots  
CREATE POLICY "Anyone can view available slots" ON public.slots
  FOR SELECT USING (is_available = true);

CREATE POLICY "Lot owners can manage their slots" ON public.slots
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.parking_lots WHERE id = lot_id AND owner_id = auth.uid())
  );

CREATE POLICY "Admins can manage all slots" ON public.slots
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for bookings
CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own bookings" ON public.bookings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own bookings" ON public.bookings
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Lot owners can view bookings for their slots" ON public.bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.slots s 
      JOIN public.parking_lots pl ON s.lot_id = pl.id 
      WHERE s.id = slot_id AND pl.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all bookings" ON public.bookings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Add updated_at triggers for new tables
CREATE TRIGGER update_parking_lots_updated_at
  BEFORE UPDATE ON public.parking_lots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_slots_updated_at
  BEFORE UPDATE ON public.slots  
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default parking settings
INSERT INTO public.admin_settings (key, value, description) VALUES
  ('parking_default_rate', '5.00', 'Default hourly parking rate in USD'),
  ('parking_booking_window', '168', 'Maximum hours in advance users can book (1 week)'),
  ('parking_cancellation_window', '1', 'Minimum hours before booking to allow cancellation'),
  ('parking_reminder_hours', '1', 'Hours before booking to send reminder'),
  ('parking_company_name', '"Easy Park"', 'Company name for notifications'),
  ('parking_support_email', '"support@easypark.com"', 'Support email'),
  ('parking_support_phone', '"+1-555-PARK-NOW"', 'Support phone number')
ON CONFLICT (key) DO NOTHING;