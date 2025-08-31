import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ItemIndicator {
  id: string;
  product_id: string;
  indicator_type: string;
}

export const useItemIndicators = (restaurantId: string) => {
  const [indicators, setIndicators] = useState<ItemIndicator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIndicators = async () => {
      if (!restaurantId) return;

      try {
        const { data: products } = await supabase
          .from('products')
          .select('id')
          .eq('restaurant_id', restaurantId);

        if (!products) return;

        const productIds = products.map(p => p.id);
        
        if (productIds.length === 0) return;

        const { data, error } = await supabase
          .from('item_indicators')
          .select('*')
          .in('product_id', productIds);

        if (error) {
          console.error('Error fetching item indicators:', error);
          return;
        }

        setIndicators(data || []);
      } catch (error) {
        console.error('Error fetching item indicators:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIndicators();
  }, [restaurantId]);

  const getIndicatorsForProduct = (productId: string) => {
    return indicators.filter(indicator => indicator.product_id === productId);
  };

  const hasIndicator = (productId: string, indicatorType: string) => {
    return indicators.some(
      indicator => indicator.product_id === productId && indicator.indicator_type === indicatorType
    );
  };

  return {
    indicators,
    loading,
    getIndicatorsForProduct,
    hasIndicator
  };
};