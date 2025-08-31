import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Minus, Plus, X } from 'lucide-react';
import { Product, CartItem } from '@/pages/Menu';
import { supabase } from '@/integrations/supabase/client';

interface UpsellProduct {
  id: string;
  name: string;
  base_price: number;
  description: string;
  image_url: string;
}

interface ModifierGroup {
  id: string;
  name: string;
  description: string;
  min_selections: number;
  max_selections: number;
  is_required: boolean;
  modifiers: Modifier[];
}

interface Modifier {
  id: string;
  name: string;
  description: string;
  price_adjustment: number;
  is_default: boolean;
}

interface ItemCustomizationModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}

export const ItemCustomizationModal: React.FC<ItemCustomizationModalProps> = ({
  product,
  onClose,
  onAddToCart
}) => {
  console.log('ItemCustomizationModal received product:', {
    id: product.id,
    name: product.name,
    fullProduct: product
  });
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [upsellProducts, setUpsellProducts] = useState<UpsellProduct[]>([]);
  const [selectedUpsells, setSelectedUpsells] = useState<Set<string>>(new Set());
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [showSpecialInstructions, setShowSpecialInstructions] = useState(false);

  useEffect(() => {
    console.log('ItemCustomizationModal mounted for product:', product.name, product.id);
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchUpsellProducts(),
        fetchModifierGroups()
      ]);
      setLoading(false);
    };
    loadData();
  }, [product.id]);

  const fetchUpsellProducts = async () => {
    try {
      // Fetch upsell products for this item
      // This is a simplified version - in a real app you'd have proper upsell relationships
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('restaurant_id', product.restaurant_id)
        .eq('is_active', true)
        .neq('id', product.id)
        .limit(3);

      if (error) throw error;
      
      setUpsellProducts(products || []);
    } catch (error) {
      console.error('Error fetching upsell products:', error);
    }
  };

  const fetchModifierGroups = async () => {
    try {
      console.log('Fetching modifier groups for product:', product.id, product.name);
      
      // First get the modifier groups for this product
      const { data: productModGroups, error: pmgError } = await supabase
        .from('product_modifier_groups')
        .select('modifier_group_id, sort_order')
        .eq('product_id', product.id)
        .order('sort_order');

      if (pmgError) {
        console.error('Error fetching product modifier groups:', pmgError);
        throw pmgError;
      }

      console.log('Product modifier groups found:', productModGroups);

      if (!productModGroups || productModGroups.length === 0) {
        console.log('No modifier groups found for this product');
        setModifierGroups([]);
        return;
      }

      // Get the modifier groups with their modifiers
      const modifierGroupIds = productModGroups.map(pmg => pmg.modifier_group_id);
      console.log('Fetching modifier groups with IDs:', modifierGroupIds);
      
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
        throw mgError;
      }
      
      console.log('Modifier groups fetched:', modGroups);

      // Get modifiers for these groups
      const { data: modifiers, error: modError } = await supabase
        .from('modifiers')
        .select('*')
        .in('modifier_group_id', modifierGroupIds)
        .order('sort_order');

      if (modError) {
        console.error('Error fetching modifiers:', modError);
        throw modError;
      }
      
      console.log('Modifiers fetched:', modifiers);

      // Combine the data
      const groups = modGroups?.map(group => ({
        ...group,
        modifiers: modifiers?.filter(mod => mod.modifier_group_id === group.id) || []
      })) || [];

      console.log('Final modifier groups with modifiers:', groups);
      setModifierGroups(groups);

      // Set default selections
      const defaults: Record<string, string> = {};
      groups.forEach(group => {
        const defaultModifier = group.modifiers.find(mod => mod.is_default);
        if (defaultModifier) {
          defaults[group.id] = defaultModifier.id;
        }
      });
      setSelectedModifiers(defaults);
    } catch (error) {
      console.error('Error fetching modifier groups:', error);
    }
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const toggleUpsell = (productId: string) => {
    const newSelected = new Set(selectedUpsells);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedUpsells(newSelected);
  };

  const calculateTotal = () => {
    let total = product.base_price * quantity;
    
    // Add modifier costs
    Object.values(selectedModifiers).forEach(modifierId => {
      modifierGroups.forEach(group => {
        const modifier = group.modifiers.find(m => m.id === modifierId);
        if (modifier) {
          total += modifier.price_adjustment * quantity;
        }
      });
    });
    
    selectedUpsells.forEach(upsellId => {
      const upsellProduct = upsellProducts.find(p => p.id === upsellId);
      if (upsellProduct) {
        total += upsellProduct.base_price * quantity;
      }
    });
    
    return total;
  };

  // Debug logging
  useEffect(() => {
    console.log('Modal state - Loading:', loading, 'Modifier Groups:', modifierGroups);
  }, [loading, modifierGroups]);

  const handleAddToCart = () => {
    const customizations: Record<string, any> = {};
    
    // Add modifiers
    const selectedModifierDetails = Object.entries(selectedModifiers).map(([groupId, modifierId]) => {
      const group = modifierGroups.find(g => g.id === groupId);
      const modifier = group?.modifiers.find(m => m.id === modifierId);
      return modifier ? {
        id: modifier.id,
        name: modifier.name,
        price: modifier.price_adjustment,
        groupName: group.name
      } : null;
    }).filter(Boolean);
    
    if (selectedModifierDetails.length > 0) {
      customizations.modifiers = selectedModifierDetails;
    }
    
    if (selectedUpsells.size > 0) {
      const selectedUpsellProducts = upsellProducts.filter(p => selectedUpsells.has(p.id));
      customizations.upsells = selectedUpsellProducts.map(p => ({
        id: p.id,
        name: p.name,
        price: p.base_price
      }));
    }

    const cartItem: CartItem = {
      id: `${product.id}-${Date.now()}`,
      product,
      quantity,
      notes: notes.trim() || undefined,
      customizations: Object.keys(customizations).length > 0 ? customizations : undefined,
      total_price: calculateTotal()
    };

    onAddToCart(cartItem);
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-lg max-h-[90vh] overflow-y-auto mx-auto my-2 p-0">
        <DialogTitle className="sr-only">{product.name}</DialogTitle>
        <DialogDescription className="sr-only">
          Customize your {product.name} by selecting modifiers, variants, and adding special instructions.
        </DialogDescription>
        {/* Green Header */}
        <div className="bg-primary text-primary-foreground px-3 py-1">
          <h2 className="text-lg font-bold">{product.name}</h2>
          <p className="text-primary-foreground/80 mt-0.5 font-bold text-sm">Customize your item</p>
        </div>

        <div className="px-3 space-y-3">
          {/* Product Image - smaller and more compact */}
          {product.image_url && (
            <div className="aspect-video w-full max-w-xs mx-auto overflow-hidden rounded-lg">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Product Info */}
          <div>
            <div className="flex justify-between items-start mb-1">
              <span className="text-lg font-bold text-primary">
                ${product.base_price.toFixed(2)}
              </span>
            </div>
            {product.description && (
              <p className="text-muted-foreground">{product.description}</p>
            )}
          </div>

          {/* Modifiers */}
          {!loading && modifierGroups.length > 0 && (
            <div className="space-y-2">
              {modifierGroups.map((group) => (
                <div key={group.id} className="space-y-1">
                  <div>
                    <h4 className="font-semibold text-sm">{group.name}</h4>
                    {group.description && (
                      <p className="text-sm text-muted-foreground">{group.description}</p>
                    )}
                  </div>
                  
                  <RadioGroup
                    value={selectedModifiers[group.id]}
                    onValueChange={(value) => setSelectedModifiers(prev => ({
                      ...prev,
                      [group.id]: value
                    }))}
                  >
                    {group.modifiers.map((modifier) => (
                      <div key={modifier.id} className="flex items-center space-x-1">
                        <RadioGroupItem value={modifier.id} id={modifier.id} />
                        <Label htmlFor={modifier.id} className="flex-1 cursor-pointer">
                          <div className="flex justify-between items-center">
                            <span>{modifier.name}</span>
                            {modifier.price_adjustment !== 0 && (
                              <span className="ml-4 text-sm text-muted-foreground">
                                {modifier.price_adjustment > 0 ? '+' : ''}${modifier.price_adjustment.toFixed(2)}
                              </span>
                            )}
                          </div>
                          {modifier.description && (
                            <p className="text-sm text-muted-foreground">{modifier.description}</p>
                          )}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ))}
            </div>
          )}

          {/* Upsells */}
          {!loading && upsellProducts.length > 0 && (
            <div>
              <h4 className="font-semibold text-lg mb-2">Add to your order</h4>
              <div className="space-y-1">
                {upsellProducts.map((upsellProduct) => (
                  <div
                    key={upsellProduct.id}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedUpsells.has(upsellProduct.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => toggleUpsell(upsellProduct.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h5 className="font-medium">{upsellProduct.name}</h5>
                          <span className="ml-4 text-sm text-muted-foreground">+${upsellProduct.base_price.toFixed(2)}</span>
                        </div>
                        {upsellProduct.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {upsellProduct.description}
                          </p>
                        )}
                      </div>
                      <div className={`w-4 h-4 rounded border-2 transition-colors ${
                        selectedUpsells.has(upsellProduct.id)
                          ? 'bg-primary border-primary'
                          : 'border-muted-foreground'
                      }`}>
                        {selectedUpsells.has(upsellProduct.id) && (
                          <div className="w-full h-full rounded bg-primary"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {product.allow_comments && (
            <Collapsible open={showSpecialInstructions} onOpenChange={setShowSpecialInstructions}>
              <CollapsibleTrigger asChild>
                <button className="flex items-center space-x-2 text-sm font-bold hover:text-primary transition-colors">
                  <span>Special Instructions</span>
                  <Plus className="h-4 w-4" />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-1">
                <Textarea
                  id="notes"
                  placeholder="(e.g. Please include chopsticks)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  autoFocus={false}
                  className="text-sm"
                />
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>

        <div className="flex items-center border-t border-border h-14">
          {/* Left side - Quantity controls */}
          <div className="flex items-center space-x-1 p-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
              className="h-6 w-6 p-0"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-6 text-center font-bold text-sm">
              {quantity}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuantityChange(1)}
              className="h-6 w-6 p-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {/* Right side - Green Add to Cart button */}
          <div className="flex-1 bg-primary h-full flex items-center justify-center">
            <Button 
              onClick={handleAddToCart}
              className="w-full h-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm py-1 rounded-none border-0 flex items-center justify-center"
              size="lg"
            >
              Add to order ${calculateTotal().toFixed(2)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};