-- Get the Japanese restaurant ID first
DO $$
DECLARE
    restaurant_uuid UUID;
    gyoza_id UUID;
    teriyaki_id UUID;
    katsuya_id UUID;
    tempura_id UUID;
    udon_id UUID;
    
    -- Modifier group IDs
    gyoza_cooking_group UUID;
    teriyaki_protein_group UUID;
    katsuya_protein_group UUID;
    tempura_style_group UUID;
    udon_protein_group UUID;
BEGIN
    -- Get restaurant ID
    SELECT id INTO restaurant_uuid FROM restaurants WHERE domain IS NOT NULL LIMIT 1;
    
    -- Get product IDs
    SELECT id INTO gyoza_id FROM products WHERE name = 'Gyoza' AND restaurant_id = restaurant_uuid;
    SELECT id INTO teriyaki_id FROM products WHERE name = 'Teriyaki' AND restaurant_id = restaurant_uuid;
    SELECT id INTO katsuya_id FROM products WHERE name = 'Katsuya' AND restaurant_id = restaurant_uuid;
    SELECT id INTO tempura_id FROM products WHERE name = 'Tempura' AND restaurant_id = restaurant_uuid;
    SELECT id INTO udon_id FROM products WHERE name = 'Udon' AND restaurant_id = restaurant_uuid;
    
    -- Create modifier groups
    
    -- 1. Gyoza cooking style
    INSERT INTO modifier_groups (id, restaurant_id, name, description, is_required, min_selections, max_selections, display_type, sort_order)
    VALUES (gen_random_uuid(), restaurant_uuid, 'Cooking Style', 'Choose your cooking preference', true, 1, 1, 'radio', 0)
    RETURNING id INTO gyoza_cooking_group;
    
    -- Add Gyoza cooking modifiers
    INSERT INTO modifiers (modifier_group_id, name, description, price_adjustment, is_default, sort_order) VALUES
    (gyoza_cooking_group, 'Steamed', 'Steamed dumplings', 0, true, 0),
    (gyoza_cooking_group, 'Fried', 'Pan-fried dumplings', 0, false, 1);
    
    -- 2. Teriyaki protein choices
    INSERT INTO modifier_groups (id, restaurant_id, name, description, is_required, min_selections, max_selections, display_type, sort_order)
    VALUES (gen_random_uuid(), restaurant_uuid, 'Protein Choice', 'Select your protein', true, 1, 1, 'radio', 0)
    RETURNING id INTO teriyaki_protein_group;
    
    -- Add Teriyaki protein modifiers
    INSERT INTO modifiers (modifier_group_id, name, description, price_adjustment, is_default, sort_order) VALUES
    (teriyaki_protein_group, 'Vegetable', 'Fresh mixed vegetables', 0, true, 0),
    (teriyaki_protein_group, 'Chicken', 'Grilled chicken breast', 2.00, false, 1),
    (teriyaki_protein_group, 'Salmon', 'Fresh grilled salmon', 7.00, false, 2),
    (teriyaki_protein_group, 'Steak', 'Premium beef steak', 9.00, false, 3),
    (teriyaki_protein_group, 'Shrimp', 'Fresh grilled shrimp', 8.00, false, 4);
    
    -- 3. Katsuya protein choices
    INSERT INTO modifier_groups (id, restaurant_id, name, description, is_required, min_selections, max_selections, display_type, sort_order)
    VALUES (gen_random_uuid(), restaurant_uuid, 'Protein Choice', 'Select your protein', true, 1, 1, 'radio', 0)
    RETURNING id INTO katsuya_protein_group;
    
    -- Add Katsuya protein modifiers
    INSERT INTO modifiers (modifier_group_id, name, description, price_adjustment, is_default, sort_order) VALUES
    (katsuya_protein_group, 'Pork', 'Traditional pork katsu', 0, true, 0),
    (katsuya_protein_group, 'Chicken', 'Chicken katsu', 1.00, false, 1);
    
    -- 4. Tempura style choices
    INSERT INTO modifier_groups (id, restaurant_id, name, description, is_required, min_selections, max_selections, display_type, sort_order)
    VALUES (gen_random_uuid(), restaurant_uuid, 'Tempura Style', 'Choose your tempura style', true, 1, 1, 'radio', 0)
    RETURNING id INTO tempura_style_group;
    
    -- Add Tempura style modifiers
    INSERT INTO modifiers (modifier_group_id, name, description, price_adjustment, is_default, sort_order) VALUES
    (tempura_style_group, 'Chicken with Vegetable', 'Chicken and mixed vegetable tempura', 0, true, 0),
    (tempura_style_group, 'Shrimp with Vegetable', 'Shrimp and mixed vegetable tempura', 1.00, false, 1);
    
    -- 5. Udon protein choices
    INSERT INTO modifier_groups (id, restaurant_id, name, description, is_required, min_selections, max_selections, display_type, sort_order)
    VALUES (gen_random_uuid(), restaurant_uuid, 'Protein Choice', 'Select your protein', true, 1, 1, 'radio', 0)
    RETURNING id INTO udon_protein_group;
    
    -- Add Udon protein modifiers
    INSERT INTO modifiers (modifier_group_id, name, description, price_adjustment, is_default, sort_order) VALUES
    (udon_protein_group, 'Chicken', 'Tender chicken pieces', 0, true, 0),
    (udon_protein_group, 'Shrimp', 'Fresh shrimp', 1.00, false, 1);
    
    -- Link products to modifier groups
    IF gyoza_id IS NOT NULL THEN
        INSERT INTO product_modifier_groups (product_id, modifier_group_id, sort_order)
        VALUES (gyoza_id, gyoza_cooking_group, 0);
    END IF;
    
    IF teriyaki_id IS NOT NULL THEN
        INSERT INTO product_modifier_groups (product_id, modifier_group_id, sort_order)
        VALUES (teriyaki_id, teriyaki_protein_group, 0);
    END IF;
    
    IF katsuya_id IS NOT NULL THEN
        INSERT INTO product_modifier_groups (product_id, modifier_group_id, sort_order)
        VALUES (katsuya_id, katsuya_protein_group, 0);
    END IF;
    
    IF tempura_id IS NOT NULL THEN
        INSERT INTO product_modifier_groups (product_id, modifier_group_id, sort_order)
        VALUES (tempura_id, tempura_style_group, 0);
    END IF;
    
    IF udon_id IS NOT NULL THEN
        INSERT INTO product_modifier_groups (product_id, modifier_group_id, sort_order)
        VALUES (udon_id, udon_protein_group, 0);
    END IF;
    
END $$;