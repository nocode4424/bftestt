import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ItemIndicator {
  id: string;
  product_id: string;
  indicator_type: string;
}

export const useItemIndicators = (restaurantId: string) => {
  const [indicators, setIndicators] = useState<ItemIndicator[]>([]);

  useEffect(() => {
    const fetchIndicators = async () => {
      try {
        const { data, error } = await supabase
          .from('item_indicators')
          .select(`
            id,
            product_id,
            indicator_type,
            products!inner(restaurant_id)
          `)
          .eq('products.restaurant_id', restaurantId);

        if (error) {
          console.error('Error fetching item indicators:', error);
          return;
        }

        setIndicators(data || []);
      } catch (error) {
        console.error('Error fetching item indicators:', error);
      }
    };

    if (restaurantId) {
      fetchIndicators();
    }
  }, [restaurantId]);

  const hasIndicator = (productId: string, indicatorType: string) => {
    return indicators.some(
      indicator => 
        indicator.product_id === productId && 
        indicator.indicator_type === indicatorType
    );
  };

  return { indicators, hasIndicator };
};