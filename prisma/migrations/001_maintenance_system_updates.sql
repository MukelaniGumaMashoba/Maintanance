-- Add stock threshold to parts table
ALTER TABLE parts ADD COLUMN IF NOT EXISTS stock_threshold INTEGER DEFAULT 0;
ALTER TABLE parts ADD COLUMN IF NOT EXISTS is_stock_item BOOLEAN DEFAULT true;

-- Create once_off_parts table for external workshops and one-off parts
CREATE TABLE IF NOT EXISTS once_off_parts (
  id SERIAL PRIMARY KEY,
  job_card_id UUID REFERENCES job_cards(id) ON DELETE CASCADE,
  part_name VARCHAR(255) NOT NULL,
  part_number VARCHAR(100),
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  supplier VARCHAR(255),
  is_external_workshop BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Add driver_id to job_cards table
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS driver_id BIGINT REFERENCES drivers(id);

-- Create rejected_jobs table
CREATE TABLE IF NOT EXISTS rejected_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_job_card_id UUID NOT NULL,
  job_data JSONB NOT NULL,
  rejection_reason TEXT,
  rejected_by UUID REFERENCES auth.users(id),
  rejected_at TIMESTAMP DEFAULT NOW(),
  can_reopen BOOLEAN DEFAULT true,
  reopened_at TIMESTAMP,
  reopened_by UUID REFERENCES auth.users(id),
  new_job_card_id UUID REFERENCES job_cards(id)
);

-- Update job_cards status enum to include new workflow statuses
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(50) DEFAULT 'draft';

-- Create job_card_workflow_history table
CREATE TABLE IF NOT EXISTS job_card_workflow_history (
  id SERIAL PRIMARY KEY,
  job_card_id UUID REFERENCES job_cards(id) ON DELETE CASCADE,
  from_status VARCHAR(50),
  to_status VARCHAR(50) NOT NULL,
  action_by UUID REFERENCES auth.users(id),
  action_at TIMESTAMP DEFAULT NOW(),
  notes TEXT
);

-- Update profiles table to include role-based permissions
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS can_close_jobs BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS can_approve_jobs BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS can_reject_jobs BOOLEAN DEFAULT false;

-- Set default permissions based on role
UPDATE profiles SET 
  can_close_jobs = CASE WHEN role = 'admin' THEN true ELSE false END,
  can_approve_jobs = CASE WHEN role IN ('manager', 'admin') THEN true ELSE false END,
  can_reject_jobs = CASE WHEN role IN ('manager', 'admin') THEN true ELSE false END;

-- Remove close job permission from manager role (as per requirements)
UPDATE profiles SET can_close_jobs = false WHERE role = 'manager';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_once_off_parts_job_card ON once_off_parts(job_card_id);
CREATE INDEX IF NOT EXISTS idx_rejected_jobs_original_job ON rejected_jobs(original_job_card_id);
CREATE INDEX IF NOT EXISTS idx_job_workflow_history_job_card ON job_card_workflow_history(job_card_id);
CREATE INDEX IF NOT EXISTS idx_job_cards_workflow_status ON job_cards(workflow_status);
CREATE INDEX IF NOT EXISTS idx_job_cards_driver_id ON job_cards(driver_id);