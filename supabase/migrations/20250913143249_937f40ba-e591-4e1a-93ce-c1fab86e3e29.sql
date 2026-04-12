-- Create enum types for better data integrity
CREATE TYPE vehicle_size AS ENUM ('compact', 'standard', 'large', 'motorcycle');
CREATE TYPE ev_type AS ENUM ('none', 'level1', 'level2', 'dc_fast');
CREATE TYPE user_role AS ENUM ('user', 'admin', 'owner');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'checked_in', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  vehicle_plate TEXT,
  preferred_ev_type ev_type DEFAULT 'none',
  preferred_size vehicle_size DEFAULT 'standard',
  role user_role DEFAULT 'user',
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

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
  width_inches INTEGER DEFAULT 96, -- Standard parking space width
  length_inches INTEGER DEFAULT 192, -- Standard parking space length
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

-- Create admin_settings table for pricing and configuration
CREATE TABLE public.admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

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

-- RLS Policies for admin_settings
CREATE POLICY "Only admins can manage settings" ON public.admin_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_parking_lots_updated_at
  BEFORE UPDATE ON public.parking_lots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_slots_updated_at
  BEFORE UPDATE ON public.slots  
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default admin settings
INSERT INTO public.admin_settings (key, value, description) VALUES
  ('default_hourly_rate', '5.00', 'Default hourly parking rate in USD'),
  ('booking_window_hours', '168', 'Maximum hours in advance users can book (default: 1 week)'),
  ('cancellation_window_hours', '1', 'Minimum hours before booking start time to allow cancellation'),
  ('reminder_hours_before', '1', 'Hours before booking to send reminder notification'),
  ('company_name', '"Easy Park"', 'Company name for notifications and receipts'),
  ('support_email', '"support@easypark.com"', 'Support email address'),
  ('support_phone', '"+1-555-PARK-NOW"', 'Support phone number');

-- Create some sample data for testing
INSERT INTO public.parking_lots (name, address, latitude, longitude, owner_id, total_slots, hourly_rate) VALUES
  ('Downtown Plaza', '123 Main St, Downtown', 40.7128, -74.0060, (SELECT id FROM auth.users LIMIT 1), 50, 8.00),
  ('Airport Parking', '456 Airport Blvd, Terminal A', 40.6892, -74.1745, (SELECT id FROM auth.users LIMIT 1), 200, 12.00),
  ('Shopping Center', '789 Mall Ave, West Side', 40.7282, -73.7949, (SELECT id FROM auth.users LIMIT 1), 100, 3.00);

-- Create sample slots for the first parking lot
INSERT INTO public.slots (lot_id, slot_number, price_per_hour, ev_supported, is_covered, is_accessible)
SELECT 
  (SELECT id FROM public.parking_lots WHERE name = 'Downtown Plaza'),
  'A' || generate_series(1, 20)::text,
  8.00,
  CASE WHEN generate_series(1, 20) % 5 = 0 THEN 'level2'::ev_type ELSE 'none'::ev_type END,
  generate_series(1, 20) % 3 = 0,
  generate_series(1, 20) % 10 = 0;