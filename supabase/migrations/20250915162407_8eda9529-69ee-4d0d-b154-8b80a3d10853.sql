-- Fix function search path security issue
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

-- Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at columns
DROP TRIGGER IF EXISTS update_parking_lots_updated_at ON public.parking_lots;
CREATE TRIGGER update_parking_lots_updated_at
  BEFORE UPDATE ON public.parking_lots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_slots_updated_at ON public.slots;
CREATE TRIGGER update_slots_updated_at
  BEFORE UPDATE ON public.slots  
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert parking configuration settings
INSERT INTO public.admin_settings (key, value, description) VALUES
  ('parking_default_rate', '5.00', 'Default hourly parking rate'),
  ('parking_booking_window', '168', 'Max hours in advance to book'),
  ('parking_company_name', '"Easy Park"', 'Company name'),
  ('parking_support_email', '"support@easypark.com"', 'Support email')
ON CONFLICT (key) DO NOTHING;