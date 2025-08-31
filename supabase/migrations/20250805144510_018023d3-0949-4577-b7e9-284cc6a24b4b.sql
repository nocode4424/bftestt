-- Add item indicators table for tracking special labels like best sellers, spicy, etc.
CREATE TABLE public.item_indicators (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    indicator_type TEXT NOT NULL, -- 'best_seller', 'spicy', 'new', etc.
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.item_indicators ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view item indicators" 
ON public.item_indicators 
FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their product indicators" 
ON public.item_indicators 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM products 
    JOIN restaurants ON restaurants.id = products.restaurant_id 
    WHERE products.id = item_indicators.product_id 
    AND restaurants.user_id = auth.uid()
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_item_indicators_updated_at
BEFORE UPDATE ON public.item_indicators
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create variant groups for the menu items that need size/protein options
INSERT INTO public.variant_groups (name, description, restaurant_id, display_type, min_selections, max_selections, is_required) 
SELECT 
    'Cooking Style' as name,
    'Choose your cooking preference' as description,
    restaurants.id as restaurant_id,
    'radio' as display_type,
    1 as min_selections,
    1 as max_selections,
    true as is_required
FROM restaurants 
WHERE restaurants.name ILIKE '%sushi%' OR restaurants.name ILIKE '%japanese%'
LIMIT 1;

INSERT INTO public.variant_groups (name, description, restaurant_id, display_type, min_selections, max_selections, is_required) 
SELECT 
    'Protein Choice' as name,
    'Select your protein' as description,
    restaurants.id as restaurant_id,
    'radio' as display_type,
    1 as min_selections,
    1 as max_selections,
    true as is_required
FROM restaurants 
WHERE restaurants.name ILIKE '%sushi%' OR restaurants.name ILIKE '%japanese%'
LIMIT 1;

-- Create modifiers for cooking styles and proteins
INSERT INTO public.modifiers (name, description, modifier_group_id, price_adjustment, is_default, sort_order)
SELECT 
    'Steamed' as name,
    'Steamed preparation' as description,
    vg.id as modifier_group_id,
    0 as price_adjustment,
    true as is_default,
    1 as sort_order
FROM variant_groups vg 
WHERE vg.name = 'Cooking Style';

INSERT INTO public.modifiers (name, description, modifier_group_id, price_adjustment, is_default, sort_order)
SELECT 
    'Fried' as name,
    'Fried preparation' as description,
    vg.id as modifier_group_id,
    0 as price_adjustment,
    false as is_default,
    2 as sort_order
FROM variant_groups vg 
WHERE vg.name = 'Cooking Style';

-- Protein modifiers
INSERT INTO public.modifiers (name, description, modifier_group_id, price_adjustment, is_default, sort_order)
SELECT 
    'Vegetable' as name,
    'Fresh vegetables' as description,
    vg.id as modifier_group_id,
    0 as price_adjustment,
    true as is_default,
    1 as sort_order
FROM variant_groups vg 
WHERE vg.name = 'Protein Choice';

INSERT INTO public.modifiers (name, description, modifier_group_id, price_adjustment, is_default, sort_order)
SELECT 
    'Chicken' as name,
    'Tender chicken' as description,
    vg.id as modifier_group_id,
    2.00 as price_adjustment,
    false as is_default,
    2 as sort_order
FROM variant_groups vg 
WHERE vg.name = 'Protein Choice';

INSERT INTO public.modifiers (name, description, modifier_group_id, price_adjustment, is_default, sort_order)
SELECT 
    'Salmon' as name,
    'Fresh salmon' as description,
    vg.id as modifier_group_id,
    7.00 as price_adjustment,
    false as is_default,
    3 as sort_order
FROM variant_groups vg 
WHERE vg.name = 'Protein Choice';

INSERT INTO public.modifiers (name, description, modifier_group_id, price_adjustment, is_default, sort_order)
SELECT 
    'Steak' as name,
    'Premium beef steak' as description,
    vg.id as modifier_group_id,
    9.00 as price_adjustment,
    false as is_default,
    4 as sort_order
FROM variant_groups vg 
WHERE vg.name = 'Protein Choice';

INSERT INTO public.modifiers (name, description, modifier_group_id, price_adjustment, is_default, sort_order)
SELECT 
    'Shrimp' as name,
    'Fresh shrimp' as description,
    vg.id as modifier_group_id,
    8.00 as price_adjustment,
    false as is_default,
    5 as sort_order
FROM variant_groups vg 
WHERE vg.name = 'Protein Choice';