-- Add missing columns to parts table
ALTER TABLE parts ADD COLUMN IF NOT EXISTS stock_threshold INTEGER DEFAULT 10;
ALTER TABLE parts ADD COLUMN IF NOT EXISTS is_stock_item BOOLEAN DEFAULT true;
ALTER TABLE parts ADD COLUMN IF NOT EXISTS once BOOLEAN DEFAULT false;
ALTER TABLE parts ADD COLUMN IF NOT EXISTS location VARCHAR(255);

-- Update existing parts to have default stock threshold
UPDATE parts SET stock_threshold = 10 WHERE stock_threshold IS NULL;
UPDATE parts SET is_stock_item = true WHERE is_stock_item IS NULL;
UPDATE parts SET once = false WHERE once IS NULL;