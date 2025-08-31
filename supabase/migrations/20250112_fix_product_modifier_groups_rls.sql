-- Migration: Fix RLS policy for product_modifier_groups
-- Date: 2025-01-12
-- Issue: Anonymous users (customers) couldn't see modifier groups for products
-- Solution: Add public SELECT policy to allow reading product-modifier associations

-- Add public read policy for product_modifier_groups table
-- This allows anonymous users (customers) to see which modifier groups are associated with products
CREATE POLICY IF NOT EXISTS "Allow anonymous read product_modifier_groups" 
ON product_modifier_groups 
FOR SELECT 
TO public 
USING (true);

-- Note: This policy is essential for the menu customization modal to work properly
-- Without it, the frontend cannot fetch modifier groups for products when customers
-- are browsing the menu (before authentication)