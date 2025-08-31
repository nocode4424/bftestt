-- Migration: Restore modifier groups for hibachi products
-- Date: 2025-01-12
-- Description: Re-establishes the connection between hibachi dinner products and their protein choice modifier groups

-- Add protein choice modifier group to the Delicious Hibachi Dinner
INSERT INTO product_modifier_groups (product_id, modifier_group_id, sort_order)
VALUES 
    ('547e6bf0-5f7f-415d-822d-3315ec4a4233', '65a4b0a5-4775-41fb-adcc-47e140c74093', 1)
ON CONFLICT (product_id, modifier_group_id) DO NOTHING;

-- Add protein choice modifier group to Filet Mignon Hibachi  
INSERT INTO product_modifier_groups (product_id, modifier_group_id, sort_order)
VALUES 
    ('8b9c0d1e-2f3a-4b56-7c89-0abcdef23456', '65a4b0a5-4775-41fb-adcc-47e140c74093', 1)
ON CONFLICT (product_id, modifier_group_id) DO NOTHING;

-- Add protein choice modifier group to L1. Hibachi Shrimp
INSERT INTO product_modifier_groups (product_id, modifier_group_id, sort_order)
VALUES 
    ('81fd66f0-ea10-4208-bd49-0af2e581a358', '65a4b0a5-4775-41fb-adcc-47e140c74093', 1)
ON CONFLICT (product_id, modifier_group_id) DO NOTHING;

-- Add protein choice modifier group to L2. Hibachi Chicken
INSERT INTO product_modifier_groups (product_id, modifier_group_id, sort_order)
VALUES 
    ('a26572f4-3b14-4dd9-b347-afe911ae6352', '65a4b0a5-4775-41fb-adcc-47e140c74093', 1)
ON CONFLICT (product_id, modifier_group_id) DO NOTHING;

-- Add protein choice modifier group to L3. Hibachi Steak
INSERT INTO product_modifier_groups (product_id, modifier_group_id, sort_order)
VALUES 
    ('d2802f6c-57ed-4916-aeba-f9b1e0207b17', '65a4b0a5-4775-41fb-adcc-47e140c74093', 1)
ON CONFLICT (product_id, modifier_group_id) DO NOTHING;

-- Add protein choice modifier group to L4. Hibachi Vegetable
INSERT INTO product_modifier_groups (product_id, modifier_group_id, sort_order)
VALUES 
    ('c8795758-8723-4a61-9b0e-b2e8dd7e006c', '65a4b0a5-4775-41fb-adcc-47e140c74093', 1)
ON CONFLICT (product_id, modifier_group_id) DO NOTHING;

-- Note: The modifier group '65a4b0a5-4775-41fb-adcc-47e140c74093' contains the following protein options:
-- - Vegetable ($0)
-- - Chicken (+$2)
-- - Salmon (+$7)
-- - Steak (+$9)
-- - Shrimp (+$8)