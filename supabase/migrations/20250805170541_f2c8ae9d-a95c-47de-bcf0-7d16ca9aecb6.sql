-- Create modifier groups for the menu items that need cooking style and protein options
INSERT INTO public.modifier_groups (name, description, restaurant_id, display_type, min_selections, max_selections, is_required) 
SELECT 
    'Cooking Style' as name,
    'Choose your cooking preference' as description,
    restaurants.id as restaurant_id,
    'radio' as display_type,
    1 as min_selections,
    1 as max_selections,
    true as is_required
FROM restaurants 
WHERE restaurants.name ILIKE '%sushi%' OR restaurants.name ILIKE '%japanese%' OR EXISTS (
    SELECT 1 FROM categories c 
    WHERE c.restaurant_id = restaurants.id 
    AND c.name ILIKE '%appetizer%'
)
LIMIT 1;

INSERT INTO public.modifier_groups (name, description, restaurant_id, display_type, min_selections, max_selections, is_required) 
SELECT 
    'Protein Choice' as name,
    'Select your protein' as description,
    restaurants.id as restaurant_id,
    'radio' as display_type,
    1 as min_selections,
    1 as max_selections,
    true as is_required
FROM restaurants 
WHERE restaurants.name ILIKE '%sushi%' OR restaurants.name ILIKE '%japanese%' OR EXISTS (
    SELECT 1 FROM categories c 
    WHERE c.restaurant_id = restaurants.id 
    AND c.name ILIKE '%entree%'
)
LIMIT 1;

-- Create modifiers for cooking styles
INSERT INTO public.modifiers (name, description, modifier_group_id, price_adjustment, is_default, sort_order)
SELECT 
    'Steamed' as name,
    'Steamed preparation' as description,
    mg.id as modifier_group_id,
    0 as price_adjustment,
    true as is_default,
    1 as sort_order
FROM modifier_groups mg 
WHERE mg.name = 'Cooking Style'
AND NOT EXISTS (
    SELECT 1 FROM modifiers m 
    WHERE m.modifier_group_id = mg.id 
    AND m.name = 'Steamed'
);

INSERT INTO public.modifiers (name, description, modifier_group_id, price_adjustment, is_default, sort_order)
SELECT 
    'Fried' as name,
    'Fried preparation' as description,
    mg.id as modifier_group_id,
    0 as price_adjustment,
    false as is_default,
    2 as sort_order
FROM modifier_groups mg 
WHERE mg.name = 'Cooking Style'
AND NOT EXISTS (
    SELECT 1 FROM modifiers m 
    WHERE m.modifier_group_id = mg.id 
    AND m.name = 'Fried'
);

-- Protein modifiers
INSERT INTO public.modifiers (name, description, modifier_group_id, price_adjustment, is_default, sort_order)
SELECT 
    'Vegetable' as name,
    'Fresh vegetables' as description,
    mg.id as modifier_group_id,
    0 as price_adjustment,
    true as is_default,
    1 as sort_order
FROM modifier_groups mg 
WHERE mg.name = 'Protein Choice'
AND NOT EXISTS (
    SELECT 1 FROM modifiers m 
    WHERE m.modifier_group_id = mg.id 
    AND m.name = 'Vegetable'
);

INSERT INTO public.modifiers (name, description, modifier_group_id, price_adjustment, is_default, sort_order)
SELECT 
    'Chicken' as name,
    'Tender chicken' as description,
    mg.id as modifier_group_id,
    2.00 as price_adjustment,
    false as is_default,
    2 as sort_order
FROM modifier_groups mg 
WHERE mg.name = 'Protein Choice'
AND NOT EXISTS (
    SELECT 1 FROM modifiers m 
    WHERE m.modifier_group_id = mg.id 
    AND m.name = 'Chicken'
);

INSERT INTO public.modifiers (name, description, modifier_group_id, price_adjustment, is_default, sort_order)
SELECT 
    'Pork' as name,
    'Premium pork' as description,
    mg.id as modifier_group_id,
    0 as price_adjustment,
    false as is_default,
    3 as sort_order
FROM modifier_groups mg 
WHERE mg.name = 'Protein Choice'
AND NOT EXISTS (
    SELECT 1 FROM modifiers m 
    WHERE m.modifier_group_id = mg.id 
    AND m.name = 'Pork'
);

INSERT INTO public.modifiers (name, description, modifier_group_id, price_adjustment, is_default, sort_order)
SELECT 
    'Salmon' as name,
    'Fresh salmon' as description,
    mg.id as modifier_group_id,
    7.00 as price_adjustment,
    false as is_default,
    4 as sort_order
FROM modifier_groups mg 
WHERE mg.name = 'Protein Choice'
AND NOT EXISTS (
    SELECT 1 FROM modifiers m 
    WHERE m.modifier_group_id = mg.id 
    AND m.name = 'Salmon'
);

INSERT INTO public.modifiers (name, description, modifier_group_id, price_adjustment, is_default, sort_order)
SELECT 
    'Steak' as name,
    'Premium beef steak' as description,
    mg.id as modifier_group_id,
    9.00 as price_adjustment,
    false as is_default,
    5 as sort_order
FROM modifier_groups mg 
WHERE mg.name = 'Protein Choice'
AND NOT EXISTS (
    SELECT 1 FROM modifiers m 
    WHERE m.modifier_group_id = mg.id 
    AND m.name = 'Steak'
);

INSERT INTO public.modifiers (name, description, modifier_group_id, price_adjustment, is_default, sort_order)
SELECT 
    'Shrimp' as name,
    'Fresh shrimp' as description,
    mg.id as modifier_group_id,
    8.00 as price_adjustment,
    false as is_default,
    6 as sort_order
FROM modifier_groups mg 
WHERE mg.name = 'Protein Choice'
AND NOT EXISTS (
    SELECT 1 FROM modifiers m 
    WHERE m.modifier_group_id = mg.id 
    AND m.name = 'Shrimp'
);