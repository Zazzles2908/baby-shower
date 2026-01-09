-- Add roast column to pool_predictions table for AI-generated content
-- This allows AI roasts to be displayed to users after pool submissions
-- Date: 2026-01-09

ALTER TABLE baby_shower.pool_predictions 
ADD COLUMN IF NOT EXISTS roast TEXT;

-- Add comment to document the purpose
COMMENT ON COLUMN baby_shower.pool_predictions.roast IS 'AI-generated witty comment about baby prediction';
