import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Hashtag {
  id: string;
  name: string;
  color: string;
  background_color: string;
  emoji?: string;
}

interface ProductHashtag {
  hashtag_id: string;
  position: number;
  hashtag: Hashtag;
}

export const useHashtags = (restaurantId: string) => {
  const [hashtags, setHashtags] = useState<Map<string, Hashtag>>(new Map());
  const [productHashtags, setProductHashtags] = useState<Map<string, ProductHashtag[]>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) return;

    const fetchHashtags = async () => {
      try {
        // Fetch all hashtags for the restaurant
        const { data: hashtagsData, error: hashtagsError } = await supabase
          .from('hashtags')
          .select('*')
          .eq('restaurant_id', restaurantId);

        if (hashtagsError) throw hashtagsError;

        // Create a map for quick lookups
        const hashtagMap = new Map<string, Hashtag>();
        hashtagsData?.forEach(tag => {
          hashtagMap.set(tag.id, tag);
        });
        setHashtags(hashtagMap);

        // Fetch product hashtags
        const { data: productHashtagsData, error: productHashtagsError } = await supabase
          .from('product_hashtags')
          .select(`
            product_id,
            hashtag_id,
            position
          `)
          .in('hashtag_id', Array.from(hashtagMap.keys()));

        if (productHashtagsError) throw productHashtagsError;

        // Group by product_id
        const productHashtagMap = new Map<string, ProductHashtag[]>();
        productHashtagsData?.forEach(ph => {
          const hashtag = hashtagMap.get(ph.hashtag_id);
          if (hashtag) {
            const productId = ph.product_id;
            const existing = productHashtagMap.get(productId) || [];
            existing.push({
              hashtag_id: ph.hashtag_id,
              position: ph.position,
              hashtag
            });
            productHashtagMap.set(productId, existing);
          }
        });

        // Sort hashtags by position for each product
        productHashtagMap.forEach((tags, productId) => {
          tags.sort((a, b) => a.position - b.position);
          productHashtagMap.set(productId, tags);
        });

        setProductHashtags(productHashtagMap);
      } catch (error) {
        console.error('Error fetching hashtags:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHashtags();
  }, [restaurantId]);

  const getProductHashtags = (productId: string): Hashtag[] => {
    const tags = productHashtags.get(productId) || [];
    return tags.map(t => t.hashtag);
  };

  return {
    hashtags: Array.from(hashtags.values()),
    getProductHashtags,
    loading
  };
};