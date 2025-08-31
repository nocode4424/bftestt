import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Modifier {
  id: string;
  name: string;
  description?: string;
  price_adjustment: number;
  is_default: boolean;
  sort_order: number;
}

interface ModifierGroup {
  id: string;
  name: string;
  description?: string;
  min_selections: number;
  max_selections?: number;
  is_required: boolean;
  display_type: string;
  modifiers: Modifier[];
}

export const useModifierGroups = (productId: string) => {
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModifierGroups = async () => {
      if (!productId) return;

      try {
        // First get the modifier groups for this product
        const { data: productModGroups, error: pmgError } = await supabase
          .from('product_modifier_groups')
          .select('modifier_group_id, sort_order')
          .eq('product_id', productId)
          .order('sort_order');

        if (pmgError) {
          console.error('Error fetching product modifier groups:', pmgError);
          return;
        }

        if (!productModGroups || productModGroups.length === 0) {
          setModifierGroups([]);
          return;
        }

        // Get the modifier groups with their modifiers
        const modifierGroupIds = productModGroups.map(pmg => pmg.modifier_group_id);
        
        const { data: modGroups, error: mgError } = await supabase
          .from('modifier_groups')
          .select(`
            id,
            name,
            description,
            min_selections,
            max_selections,
            is_required,
            display_type
          `)
          .in('id', modifierGroupIds);

        if (mgError) {
          console.error('Error fetching modifier groups:', mgError);
          return;
        }

        // Get modifiers for these groups
        const { data: modifiers, error: modError } = await supabase
          .from('modifiers')
          .select('*')
          .in('modifier_group_id', modifierGroupIds)
          .order('sort_order');

        if (modError) {
          console.error('Error fetching modifiers:', modError);
          return;
        }

        // Combine the data
        const groups = modGroups?.map(group => ({
          ...group,
          modifiers: modifiers?.filter(mod => mod.modifier_group_id === group.id) || []
        })) || [];

        setModifierGroups(groups);
      } catch (error) {
        console.error('Error fetching modifier groups:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchModifierGroups();
  }, [productId]);

  const getBasePrice = (productBasePrice: number): number => {
    let minPrice = productBasePrice;
    
    modifierGroups.forEach(group => {
      if (group.is_required && group.modifiers.length > 0) {
        const defaultModifier = group.modifiers.find(m => m.is_default);
        if (defaultModifier) {
          minPrice += defaultModifier.price_adjustment;
        } else {
          // If no default, use the cheapest option
          const cheapest = group.modifiers.reduce((min, mod) => 
            mod.price_adjustment < min.price_adjustment ? mod : min
          );
          minPrice += cheapest.price_adjustment;
        }
      }
    });

    return minPrice;
  };

  const hasVariablePricing = (): boolean => {
    return modifierGroups.some(group => 
      group.modifiers.some(modifier => modifier.price_adjustment !== 0)
    );
  };

  return {
    modifierGroups,
    loading,
    getBasePrice,
    hasVariablePricing
  };
};