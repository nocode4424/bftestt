import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useModifierGroups } from '@/hooks/useModifierGroups';
import { useHashtags } from '@/hooks/useHashtags';
import { Product } from '@/pages/Menu';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
  hasIndicator: (productId: string, indicatorType: string) => boolean;
  restaurantId: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onClick,
  hasIndicator,
  restaurantId
}) => {
  const { getBasePrice, hasVariablePricing } = useModifierGroups(product.id);
  const { getProductHashtags } = useHashtags(restaurantId);
  const isBestSeller = hasIndicator(product.id, 'best_seller');
  const isSpicy = hasIndicator(product.id, 'spicy');
  const hashtags = getProductHashtags(product.id);
  
  const basePrice = getBasePrice(product.base_price);
  const showFromPricing = hasVariablePricing();

  return (
    <div
      onClick={onClick}
      className="menu-card group cursor-pointer relative"
    >
      {/* Price in top right corner with more padding */}
      <div className="absolute top-2 right-2 z-10">
        <span className="price-tag text-base font-bold px-3 py-1">
          {showFromPricing && <span className="text-xs opacity-90">from </span>}
          ${basePrice.toFixed(2)}
        </span>
      </div>

      {/* Special Badge - moved to top left */}
      {isBestSeller && (
        <div className="absolute top-2 left-2 z-10">
          <span className="special-badge">Special</span>
        </div>
      )}
      
      <div className="flex items-stretch h-[100px] md:h-[110px] relative">
        {/* Product Image - smaller and centered */}
        {(product.thumbnail_url || product.image_url) && (
          <div className="w-24 md:w-28 h-20 md:h-24 flex-shrink-0 overflow-hidden ml-2 my-2">
            <img
              src={product.thumbnail_url || product.image_url}
              alt={product.name}
              className="w-full h-full object-cover object-center rounded-md"
            />
          </div>
        )}

        {/* Product Info */}
        <div className="flex-1 p-3 md:p-4 flex flex-col justify-between pr-2">
          <div>
            <h3 className="font-bold text-gray-900 text-base md:text-lg mb-1 pr-16 md:pr-28">
              {product.name}
            </h3>
            
            {product.description && (
              <p className="text-gray-600 text-xs md:text-sm line-clamp-2 mb-2 pr-16 md:pr-28">
                {product.description}
              </p>
            )}

            {/* Hashtags - smaller on mobile */}
            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1 md:gap-2 mb-2">
                {hashtags.map((hashtag) => (
                  <span
                    key={hashtag.id}
                    className="hashtag-badge text-xs"
                    style={{
                      color: hashtag.color,
                      backgroundColor: hashtag.background_color
                    }}
                  >
                    {hashtag.emoji && <span>{hashtag.emoji}</span>}
                    <span className="font-semibold">{hashtag.name}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Indicators */}
            <div className="flex items-center gap-2">
              {isSpicy && (
                <Badge variant="outline" className="text-xs border border-[#D1470B] text-[#D1470B] bg-[#D1470B]/5 px-1 md:px-2 py-0.5 md:py-1 font-semibold">
                  🌶️ Spicy
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Add to Cart button - bottom right corner */}
        <div className="absolute bottom-2 right-2">
          <Button size="sm" className="btn-primary text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2 font-semibold">
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
};
