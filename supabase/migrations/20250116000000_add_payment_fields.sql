-- Add payment_mode and transaction_id fields to bookings table
ALTER TABLE bookings 
ADD COLUMN payment_mode TEXT,
ADD COLUMN transaction_id TEXT;

-- Add index for better query performance
CREATE INDEX idx_bookings_payment_mode ON bookings(payment_mode);
CREATE INDEX idx_bookings_transaction_id ON bookings(transaction_id);

-- Update existing bookings to have default values
UPDATE bookings 
SET payment_mode = 'stripe', 
    transaction_id = stripe_payment_intent_id 
WHERE stripe_payment_intent_id IS NOT NULL;

UPDATE bookings 
SET payment_mode = 'mock', 
    transaction_id = 'MOCK-' || id 
WHERE stripe_payment_intent_id IS NULL;
