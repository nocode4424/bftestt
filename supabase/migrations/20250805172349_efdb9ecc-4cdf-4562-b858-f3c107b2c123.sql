-- Fix modifier groups and link them to correct products

-- Delete existing modifier groups that might have wrong names or links
DELETE FROM product_modifier_groups WHERE product_id IN (
  '4e05974a-4a37-4374-9b27-ff9b00511bc8', -- Gyoza
  '1069c619-f6db-48f7-a8fa-3432c30ebc33', -- Katsu  
  'bb696874-46f0-42ed-80b2-9531571130c7', -- Teriyaki
  'a8b1377a-7bb4-44e6-aa4d-2d9877a54764', -- Tempura
  '2b639de6-7cd0-42b9-be5d-d1be04806712'  -- Udon
);

DELETE FROM modifiers WHERE modifier_group_id IN (
  SELECT id FROM modifier_groups 
  WHERE restaurant_id = '3b29861a-5ade-4800-b269-d0a03c351eb6' 
  AND name IN ('Gyoza Style', 'Teriyaki Protein', 'Katsuya Protein', 'Katsu Protein', 'Tempura Style', 'Udon Protein')
);

DELETE FROM modifier_groups 
WHERE restaurant_id = '3b29861a-5ade-4800-b269-d0a03c351eb6' 
AND name IN ('Gyoza Style', 'Teriyaki Protein', 'Katsuya Protein', 'Katsu Protein', 'Tempura Style', 'Udon Protein');

-- Create Gyoza Style modifier group
INSERT INTO modifier_groups (id, restaurant_id, name, description, min_selections, max_selections, is_required, display_type)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '3b29861a-5ade-4800-b269-d0a03c351eb6',
  'Cooking Style',
  'Choose your preferred cooking style',
  1,
  1,
  true,
  'radio'
);

-- Add Gyoza modifiers
INSERT INTO modifiers (modifier_group_id, name, price_adjustment, is_default, sort_order) VALUES
('11111111-1111-1111-1111-111111111111', 'Steamed', 0, true, 1),
('11111111-1111-1111-1111-111111111111', 'Fried', 0, false, 2);

-- Link Gyoza to its modifier group
INSERT INTO product_modifier_groups (product_id, modifier_group_id, sort_order)
VALUES ('4e05974a-4a37-4374-9b27-ff9b00511bc8', '11111111-1111-1111-1111-111111111111', 1);

-- Create Teriyaki Protein modifier group
INSERT INTO modifier_groups (id, restaurant_id, name, description, min_selections, max_selections, is_required, display_type)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '3b29861a-5ade-4800-b269-d0a03c351eb6',
  'Protein Choice',
  'Choose your protein',
  1,
  1,
  true,
  'radio'
);

-- Add Teriyaki modifiers
INSERT INTO modifiers (modifier_group_id, name, price_adjustment, is_default, sort_order) VALUES
('22222222-2222-2222-2222-222222222222', 'Vegetable', 0, true, 1),
('22222222-2222-2222-2222-222222222222', 'Chicken', 2, false, 2),
('22222222-2222-2222-2222-222222222222', 'Salmon', 7, false, 3),
('22222222-2222-2222-2222-222222222222', 'Steak', 9, false, 4),
('22222222-2222-2222-2222-222222222222', 'Shrimp', 8, false, 5);

-- Link Teriyaki to its modifier group
INSERT INTO product_modifier_groups (product_id, modifier_group_id, sort_order)
VALUES ('bb696874-46f0-42ed-80b2-9531571130c7', '22222222-2222-2222-2222-222222222222', 1);

-- Create Katsu Protein modifier group
INSERT INTO modifier_groups (id, restaurant_id, name, description, min_selections, max_selections, is_required, display_type)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  '3b29861a-5ade-4800-b269-d0a03c351eb6',
  'Protein Choice',
  'Choose your protein',
  1,
  1,
  true,
  'radio'
);

-- Add Katsu modifiers
INSERT INTO modifiers (modifier_group_id, name, price_adjustment, is_default, sort_order) VALUES
('33333333-3333-3333-3333-333333333333', 'Pork', 0, true, 1),
('33333333-3333-3333-3333-333333333333', 'Chicken', 1, false, 2);

-- Link Katsu to its modifier group
INSERT INTO product_modifier_groups (product_id, modifier_group_id, sort_order)
VALUES ('1069c619-f6db-48f7-a8fa-3432c30ebc33', '33333333-3333-3333-3333-333333333333', 1);

-- Create Tempura Style modifier group
INSERT INTO modifier_groups (id, restaurant_id, name, description, min_selections, max_selections, is_required, display_type)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  '3b29861a-5ade-4800-b269-d0a03c351eb6',
  'Style Choice',
  'Choose your tempura style',
  1,
  1,
  true,
  'radio'
);

-- Add Tempura modifiers
INSERT INTO modifiers (modifier_group_id, name, price_adjustment, is_default, sort_order) VALUES
('44444444-4444-4444-4444-444444444444', 'Chicken with Vegetable', 0, true, 1),
('44444444-4444-4444-4444-444444444444', 'Shrimp with Vegetable', 1, false, 2);

-- Link Tempura to its modifier group
INSERT INTO product_modifier_groups (product_id, modifier_group_id, sort_order)
VALUES ('a8b1377a-7bb4-44e6-aa4d-2d9877a54764', '44444444-4444-4444-4444-444444444444', 1);

-- Create Udon Protein modifier group
INSERT INTO modifier_groups (id, restaurant_id, name, description, min_selections, max_selections, is_required, display_type)
VALUES (
  '55555555-5555-5555-5555-555555555555',
  '3b29861a-5ade-4800-b269-d0a03c351eb6',
  'Protein Choice',
  'Choose your protein',
  1,
  1,
  true,
  'radio'
);

-- Add Udon modifiers
INSERT INTO modifiers (modifier_group_id, name, price_adjustment, is_default, sort_order) VALUES
('55555555-5555-5555-5555-555555555555', 'Chicken', 0, true, 1),
('55555555-5555-5555-5555-555555555555', 'Shrimp', 1, false, 2);

-- Link Udon to its modifier group
INSERT INTO product_modifier_groups (product_id, modifier_group_id, sort_order)
VALUES ('2b639de6-7cd0-42b9-be5d-d1be04806712', '55555555-5555-5555-5555-555555555555', 1);