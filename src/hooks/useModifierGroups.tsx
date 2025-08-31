import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ModifierGroup {
  id: string;
  name: string;
  modifiers: Modifier[];
}

interface Modifier {
  id: string;
  name: string;
  price_adjustment: number;
  is_default: boolean;
}

export const useModifierGroups = (productId: string) => {
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);

  useEffect(() => {
    const fetchModifierGroups = async () => {
      try {
        const { data, error } = await supabase
          .from('product_modifier_groups')
          .select(`
            modifier_groups (
              id,
              name,
              modifiers (
                id,
                name,
                price_adjustment,
                is_default
              )
            )
          `)
          .eq('product_id', productId);

        if (error) {
          console.error('Error fetching modifier groups:', error);
          return;
        }

        const groups = data?.map(item => item.modifier_groups).filter(Boolean) || [];
        setModifierGroups(groups);
      } catch (error) {
        console.error('Error fetching modifier groups:', error);
      }
    };

    if (productId) {
      fetchModifierGroups();
    }
  }, [productId]);

  const hasVariablePricing = () => {
    return modifierGroups.some(group => 
      group.modifiers.some(modifier => modifier.price_adjustment > 0)
    );
  };

  const getBasePrice = (originalPrice: number) => {
    // Find the lowest possible price (default selections)
    let lowestPrice = originalPrice;
    
    modifierGroups.forEach(group => {
      const defaultModifier = group.modifiers.find(mod => mod.is_default);
      if (defaultModifier) {
        lowestPrice += defaultModifier.price_adjustment;
      }
    });

    return Math.max(lowestPrice, originalPrice);
  };

  return {
    modifierGroups,
    hasVariablePricing,
    getBasePrice
  };
};