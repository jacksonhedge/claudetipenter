-- Update Receipts Table for Approval Workflow
-- This script adds approval-related columns to the receipts table

-- Add approval_status column
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS approval_status TEXT;

-- Add approved_at column
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Add approved_by column
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS approved_by TEXT;

-- Add rejected_at column
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE;

-- Add rejected_by column
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS rejected_by TEXT;

-- Add rejection_reason column
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create index on approval_status for faster queries
CREATE INDEX IF NOT EXISTS idx_receipts_approval_status ON receipts (approval_status);

-- Update RLS policies to allow admins to update approval status
CREATE POLICY "Admins can update receipt approval status" 
  ON receipts FOR UPDATE 
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin' OR role = 'manager'
    )
  )
  WITH CHECK (
    (approval_status IS NOT NULL) AND
    (auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin' OR role = 'manager'
    ))
  );

-- Create a view for pending receipts
CREATE OR REPLACE VIEW pending_receipts AS
SELECT r.*, p.full_name, p.email, p.establishment
FROM receipts r
JOIN profiles p ON r.user_id = p.id
WHERE r.approval_status IS NULL
ORDER BY r.created_at DESC;

-- Create a view for approved receipts
CREATE OR REPLACE VIEW approved_receipts AS
SELECT r.*, p.full_name, p.email, p.establishment
FROM receipts r
JOIN profiles p ON r.user_id = p.id
WHERE r.approval_status = 'approved'
ORDER BY r.created_at DESC;

-- Create a view for rejected receipts
CREATE OR REPLACE VIEW rejected_receipts AS
SELECT r.*, p.full_name, p.email, p.establishment
FROM receipts r
JOIN profiles p ON r.user_id = p.id
WHERE r.approval_status = 'rejected'
ORDER BY r.created_at DESC;

-- Add a function to get receipt counts by status
CREATE OR REPLACE FUNCTION get_receipt_counts()
RETURNS TABLE (
  pending_count BIGINT,
  approved_count BIGINT,
  rejected_count BIGINT,
  total_count BIGINT
) LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT
    COUNT(*) FILTER (WHERE approval_status IS NULL) AS pending_count,
    COUNT(*) FILTER (WHERE approval_status = 'approved') AS approved_count,
    COUNT(*) FILTER (WHERE approval_status = 'rejected') AS rejected_count,
    COUNT(*) AS total_count
  FROM receipts;
$$;

-- Add a function to calculate total approved tips
CREATE OR REPLACE FUNCTION get_total_approved_tips()
RETURNS DECIMAL LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT COALESCE(SUM(
    CASE
      WHEN tip ~ '^\\$?[0-9]+(\\.[0-9]+)?$' THEN
        REPLACE(REPLACE(tip, '$', ''), ',', '')::DECIMAL
      ELSE
        0
    END
  ), 0) AS total_tips
  FROM receipts
  WHERE approval_status = 'approved';
$$;
