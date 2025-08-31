import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Search } from 'lucide-react';
import { Restaurant, Category, Product } from '@/pages/Menu';
import { useItemIndicators } from '@/hooks/useItemIndicators';
import { ProductCard } from './ProductCard';
import { LunchSpecialsSection } from './LunchSpecialsSection';
import { checkLunchSpecialsVisibility, checkItemTimeAvailability } from '@/utils/menuTiming';
import { GoogleAuth } from '@/components/auth/GoogleAuth';

interface MenuDisplayProps {
  restaurant: Restaurant;
  categories: Category[];
  products: Product[];
  onItemClick: (product: Product) => void;
  cartItemCount: number;
  onCartClick: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onAddToCart?: (item: any) => void;
}

export const MenuDisplay: React.FC<MenuDisplayProps> = ({
  restaurant,
  categories,
  products,
  onItemClick,
  cartItemCount,
  onCartClick,
  searchQuery = '',
  onSearchChange,
  onAddToCart
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [isLunchTime, setIsLunchTime] = useState(false);
  const { hasIndicator } = useItemIndicators(restaurant.id);

  useEffect(() => {
    checkLunchTime();
    // Set initial active category
    if (categories.length > 0) {
      setActiveCategory(categories[0].id);
    }
  }, [categories]);

  useEffect(() => {
    const handleScroll = () => {
      const displayCategories = getFilteredCategories();
      const categoryElements = displayCategories.map(cat => 
        document.getElementById(`category-${cat.id}`)
      ).filter(Boolean);

      let currentCategory = '';
      for (const element of categoryElements) {
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 200) {
            currentCategory = element.id.replace('category-', '');
          }
        }
      }
      
      if (currentCategory && currentCategory !== activeCategory) {
        setActiveCategory(currentCategory);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeCategory]);

  const checkLunchTime = () => {
    const lunchVisibility = checkLunchSpecialsVisibility();
    setIsLunchTime(lunchVisibility.isVisible);
  };

  const getFilteredCategories = () => {
    let filteredCategories = categories.filter(category => {
      const isLunchCategory = category.name.toLowerCase().includes('lunch special');
      
      // Only show lunch special category during lunch hours (Mon-Sat until 3PM ET)
      if (isLunchCategory) {
        return isLunchTime;
      }
      
      // Show all other categories
      return true;
    });

    // Check if we should add a "Best Sellers" category
    const bestSellerProducts = products.filter(product => 
      hasIndicator(product.id, 'best_seller')
    );

    if (bestSellerProducts.length > 0) {
      const bestSellerCategory = {
        id: 'best-sellers',
        name: 'Best Sellers',
        description: 'Our most popular items',
        restaurant_id: restaurant.id,
        is_active: true,
        sort_order: -1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        available_times: { always: true },
        available_days: [0, 1, 2, 3, 4, 5, 6]
      };
      filteredCategories = [bestSellerCategory, ...filteredCategories];
    }

    // If it's lunch time, prioritize lunch special category
    if (isLunchTime) {
      const lunchCategory = filteredCategories.find(cat => 
        cat.name.toLowerCase().includes('lunch special')
      );
      if (lunchCategory) {
        filteredCategories = [lunchCategory, ...filteredCategories.filter(cat => cat.id !== lunchCategory.id)];
      }
    }

    return filteredCategories;
  };

  const getProductsForCategory = (categoryId: string) => {
    // Handle Best Sellers virtual category
    if (categoryId === 'best-sellers') {
      return products.filter(product => 
        hasIndicator(product.id, 'best_seller')
      );
    }

    const filteredProducts = products.filter(product => {
      // Check category match first
      if (product.category_id !== categoryId) return false;
      
      // Check if product is available for current menu type
      const availableMenus = Array.isArray(product.available_menus) 
        ? product.available_menus 
        : [];
      
      // If no available_menus specified, always show
      if (!availableMenus || availableMenus.length === 0) {
        return true;
      }
      
      // Always show regular menu items
      // During lunch time (Mon-Sat until 3PM), also show lunch-only items
      if (isLunchTime) {
        return availableMenus.includes('lunch') || availableMenus.includes('regular');
      } else {
        // Outside lunch time, show regular items and hide lunch-only items
        const category = categories.find(cat => cat.id === categoryId);
        const isLunchCategory = category?.name.toLowerCase().includes('lunch special');
        
        if (isLunchCategory) {
          // Hide entire lunch category outside lunch hours
          return false;
        }
        
        return availableMenus.includes('regular');
      }
    });

    return filteredProducts;
  };

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      const headerHeight = 120; // Account for sticky headers
      const elementPosition = element.offsetTop - headerHeight;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  };

  const displayCategories = getFilteredCategories();

  return (
    <div className="min-h-screen menu-gradient-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#2671BC] border-b border-[#1a4d8a]">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div>
                <h1 className="text-xl md:text-2xl font-black uppercase tracking-wide text-white inline-block" style={{fontFamily: 'Fredoka One, cursive', fontWeight: '900', textShadow: '3px 3px 6px rgba(0,0,0,0.8)'}}>{restaurant.name}</h1>
                <p className="text-xs md:text-sm text-white mt-1">Premium Sushi & Japanese Cuisine</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Google Auth Button */}
              <GoogleAuth />
              
              {/* Cart Button */}
              <Button
                onClick={onCartClick}
                className="relative px-4 py-2 btn-primary"
                size="lg"
              >
                <ShoppingCart className="h-5 w-5 md:mr-2" />
                <span className="hidden md:inline font-semibold">Cart</span>
                {cartItemCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 flex items-center justify-center text-xs bg-[#E97700] text-white border-2 border-white rounded-full font-bold"
                  >
                    {cartItemCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Search Bar - Between header and categories */}
      <div className="bg-[#2671BC]/80 backdrop-blur border-b border-[#1a4d8a] py-2">
        <div className="container mx-auto px-4">
          <div className="relative w-full max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search menu..."
              value={searchQuery || ''}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="pl-10 pr-4 h-10 w-full border border-white/30 focus:border-[#E97700] bg-white/95 backdrop-blur text-gray-900 text-sm font-medium rounded-lg placeholder:text-gray-500 placeholder:font-medium"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Category Sidebar - Desktop */}
          <aside className="hidden lg:block lg:w-56 shrink-0">
            <div className="sticky top-24 space-y-2">
              <h3 className="section-title mb-4 px-2">CATEGORIES</h3>
              {displayCategories.map((category) => (
                <Button
                  key={category.id}
                  variant={activeCategory === category.id ? 'default' : 'ghost'}
                  className={`w-full justify-start text-left h-auto p-3 transition-all ${
                    activeCategory === category.id 
                      ? 'btn-accent' 
                      : 'card-glass text-white hover:bg-white/20'
                  }`}
                  onClick={() => handleCategoryClick(category.id)}
                >
                  <div className="text-left">
                    <div className="font-semibold text-sm uppercase">{category.name}</div>
                    {category.name.toLowerCase().includes('lunch special') && isLunchTime && (
                      <Badge className="mt-1 text-xs special-badge">Available Now</Badge>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </aside>
          
          {/* Category Tabs - Mobile */}
          <div className="lg:hidden fixed top-20 left-0 right-0 bg-[#2671BC]/95 backdrop-blur py-2 z-20 border-b border-[#1a4d8a]">
            <div className="flex overflow-x-auto space-x-2 px-4 scrollbar-hide">
              {displayCategories.map((category) => (
                <Button
                  key={category.id}
                  variant="outline"
                  size="sm"
                  className={`whitespace-nowrap shrink-0 transition-all font-semibold uppercase text-xs ${
                    activeCategory === category.id 
                      ? 'btn-accent' 
                      : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                  }`}
                  onClick={() => handleCategoryClick(category.id)}
                >
                  {category.name}
                  {category.name.toLowerCase().includes('lunch special') && isLunchTime && (
                    <Badge className="ml-1 text-xs special-badge">Now</Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Menu Items */}
          <main className="flex-1 lg:mt-0 mt-14">
            {/* Lunch Specials Section */}
            {isLunchTime && onAddToCart && (
              <LunchSpecialsSection onAddToCart={onAddToCart} />
            )}
            
            {displayCategories.map((category) => {
              const categoryProducts = getProductsForCategory(category.id);
              
              if (categoryProducts.length === 0) {
                return null;
              }

              return (
                <section 
                  key={category.id} 
                  id={`category-${category.id}`}
                  className="mb-8"
                >
                  <div className="mb-6">
                    <h2 className="section-title">{category.name}</h2>
                    {category.description && (
                      <p className="text-white/80 mt-2 text-sm">{category.description}</p>
                    )}
                    {category.name.toLowerCase().includes('lunch special') && isLunchTime && (
                      <Badge className="mt-3 special-badge">Available Now - Until 3:00 PM</Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categoryProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onClick={() => onItemClick(product)}
                        hasIndicator={hasIndicator}
                        restaurantId={restaurant.id}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </main>
        </div>
      </div>
    </div>
  );
};