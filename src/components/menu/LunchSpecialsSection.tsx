import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface LunchSpecialsSectionProps {
  onAddToCart: (item: any) => void;
}

const hibachiOptions = [
  { id: 'hibachi-chicken', name: 'Chicken', price: 12.99 },
  { id: 'hibachi-steak', name: 'Steak', price: 14.99 },
  { id: 'hibachi-shrimp', name: 'Shrimp', price: 13.99 },
  { id: 'hibachi-salmon', name: 'Salmon', price: 13.99 },
];

const tempuraOptions = [
  { id: 'tempura-chicken', name: 'Chicken', price: 11.99 },
  { id: 'tempura-shrimp', name: 'Shrimp', price: 12.99 },
  { id: 'tempura-veggie', name: 'Vegetable', price: 10.99 },
  { id: 'tempura-combo', name: 'Combo', price: 13.99 },
];

const teriyakiOptions = [
  { id: 'teriyaki-chicken', name: 'Chicken', price: 11.99 },
  { id: 'teriyaki-beef', name: 'Beef', price: 13.99 },
  { id: 'teriyaki-salmon', name: 'Salmon', price: 13.99 },
  { id: 'teriyaki-tofu', name: 'Tofu', price: 10.99 },
];

const sushiLunchOptions = [
  { id: 'sushi-6pc', name: '6pc Sushi & CA Roll', price: 13.99 },
  { id: 'sashimi-lunch', name: '10pc Sashimi', price: 14.99 },
  { id: 'l-12-combo', name: 'L-12 Combo', price: 16.99 },
];

const rawRolls = [
  'California Roll',
  'Spicy Tuna Roll',
  'Spicy Salmon Roll',
  'Philadelphia Roll',
  'Salmon Avocado Roll',
  'Tuna Avocado Roll',
  'Yellowtail Scallion Roll',
  'Alaska Roll',
  'Boston Roll',
  'Shrimp Roll', // Exception: actually cooked but listed here
];

const cookedRolls = [
  'Shrimp Tempura Roll',
  'Chicken Tempura Roll',
  'Sweet Potato Roll',
  'Avocado Roll',
  'Cucumber Roll',
  'Veggie Roll',
  'Eel Avocado Roll',
  'Eel Cucumber Roll',
  'Spicy Mango Shrimp Roll', // Exception: moved from raw
  'Crab Stick Roll',
];

export const LunchSpecialsSection: React.FC<LunchSpecialsSectionProps> = ({ onAddToCart }) => {
  const [showMakiModal, setShowMakiModal] = useState(false);
  const [makiOption, setMakiOption] = useState<'2-rolls' | '3-rolls' | null>(null);
  const [selectedRolls, setSelectedRolls] = useState<string[]>([]);

  const handleMakiLunchClick = () => {
    setShowMakiModal(true);
  };

  const handleRollSelection = (roll: string) => {
    const maxRolls = makiOption === '2-rolls' ? 2 : 3;
    
    if (selectedRolls.includes(roll)) {
      setSelectedRolls(selectedRolls.filter(r => r !== roll));
    } else if (selectedRolls.length < maxRolls) {
      setSelectedRolls([...selectedRolls, roll]);
    }
  };

  const canAddMakiToCart = () => {
    const requiredRolls = makiOption === '2-rolls' ? 2 : 3;
    return selectedRolls.length === requiredRolls;
  };

  const handleAddMakiToCart = () => {
    const price = makiOption === '2-rolls' ? 10.00 : 13.00;
    const item = {
      id: `maki-lunch-${makiOption}`,
      product: {
        id: `maki-lunch-${makiOption}`,
        name: `Maki Lunch Special (${makiOption === '2-rolls' ? '2 Rolls' : '3 Rolls'})`,
        description: `${selectedRolls.join(', ')} • Includes soup and salad`,
        base_price: price,
        category_id: 'lunch-specials'
      },
      quantity: 1,
      total_price: price,
      customizations: { selectedRolls }
    };
    
    onAddToCart(item);
    setShowMakiModal(false);
    setMakiOption(null);
    setSelectedRolls([]);
  };

  const handleRegularLunchAdd = (option: any, type: 'hibachi' | 'sushi') => {
    const item = {
      id: option.id,
      product: {
        id: option.id,
        name: option.name,
        description: `${option.description || ''} • Includes soup and salad`,
        base_price: option.price,
        category_id: 'lunch-specials'
      },
      quantity: 1,
      total_price: option.price
    };
    
    onAddToCart(item);
  };

  return (
    <div className="mb-4 -mt-4">
      {/* Section Header */}
      <div className="text-center mb-3">
        <h2 className="section-title text-2xl mb-1">🍱 LUNCH SPECIALS</h2>
        <div className="bg-green-600 text-white px-3 py-1 rounded-lg inline-block mb-1">
          <p className="text-sm font-semibold">Available Now - Until 3:00 PM</p>
        </div>
      </div>

      <div className="space-y-2">

        {/* Maki Lunch Special */}
        <div>
          <h3 className="text-2xl font-bold text-white mb-1 uppercase text-center">🍣 Maki Lunch Special</h3>
          <div className="menu-card p-2">
            <div className="text-center mb-1">
              <h4 className="text-2xl font-bold text-gray-900">Choose 2 Rolls for $10 or 3 Rolls for $13</h4>
              <p className="text-lg font-semibold text-gray-700">
                Comes with soup and salad
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-1 mb-1">
              <div>
                <h5 className="text-xl font-bold text-center text-gray-800 underline">Raw Rolls</h5>
                <div className="text-lg font-semibold text-gray-700 text-center">
                  {rawRolls.slice(0, 5).map(roll => (
                    <div key={roll}>{roll}</div>
                  ))}
                  <div className="font-bold">+ 5 more options</div>
                </div>
              </div>
              <div>
                <h5 className="text-xl font-bold text-center text-gray-800 underline">Cooked Rolls</h5>
                <div className="text-lg font-semibold text-gray-700 text-center">
                  {cookedRolls.slice(0, 5).map(roll => (
                    <div key={roll}>{roll}</div>
                  ))}
                  <div className="font-bold">+ 5 more options</div>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <Button
                onClick={handleMakiLunchClick}
                className="btn-primary px-6 py-1 text-lg font-bold"
              >
                Customize Your Maki Lunch
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Maki Customization Modal */}
      <Dialog open={showMakiModal} onOpenChange={setShowMakiModal}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Customize Your Maki Lunch</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Choose 2-roll or 3-roll option */}
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold mb-3">Choose Your Option:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Button
                  onClick={() => setMakiOption('2-rolls')}
                  className={`h-16 flex flex-col justify-center text-lg font-bold ${
                    makiOption === '2-rolls' ? 'btn-accent' : 'btn-primary'
                  }`}
                >
                  <span className="text-xl">2-Roll Special</span>
                  <span className="text-base">$10.00 • Comes with soup and salad</span>
                </Button>
                <Button
                  onClick={() => setMakiOption('3-rolls')}
                  className={`h-16 flex flex-col justify-center text-lg font-bold ${
                    makiOption === '3-rolls' ? 'btn-accent' : 'btn-primary'
                  }`}
                >
                  <span className="text-xl">3-Roll Special</span>
                  <span className="text-base">$13.00 • Comes with soup and salad</span>
                </Button>
              </div>
            </div>

            {makiOption && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-xl font-bold">
                    Choose {makiOption === '2-rolls' ? '2' : '3'} rolls (${makiOption === '2-rolls' ? '10.00' : '13.00'})
                  </h3>
                  <p className="text-lg font-semibold text-gray-600">
                    Selected: {selectedRolls.length}/{makiOption === '2-rolls' ? '2' : '3'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Raw Rolls */}
                  <div>
                    <h4 className="text-xl font-bold mb-3 text-center">Raw Rolls</h4>
                    <div className="space-y-2">
                      {rawRolls.map((roll) => (
                        <div key={roll} className="flex items-center space-x-2">
                          <Checkbox
                            checked={selectedRolls.includes(roll)}
                            onCheckedChange={() => handleRollSelection(roll)}
                            disabled={!selectedRolls.includes(roll) && selectedRolls.length >= (makiOption === '2-rolls' ? 2 : 3)}
                          />
                          <label className="text-lg font-semibold cursor-pointer flex-1" onClick={() => handleRollSelection(roll)}>
                            {roll}
                            {roll === 'Shrimp Roll' && (
                              <span className="text-sm text-gray-500 ml-1">(actually cooked)</span>
                            )}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cooked Rolls */}
                  <div>
                    <h4 className="text-xl font-bold mb-3 text-center">Cooked Rolls</h4>
                    <div className="space-y-2">
                      {cookedRolls.map((roll) => (
                        <div key={roll} className="flex items-center space-x-2">
                          <Checkbox
                            checked={selectedRolls.includes(roll)}
                            onCheckedChange={() => handleRollSelection(roll)}
                          disabled={!selectedRolls.includes(roll) && selectedRolls.length >= (makiOption === '2-rolls' ? 2 : 3)}
                          />
                          <label className="text-lg font-semibold cursor-pointer flex-1" onClick={() => handleRollSelection(roll)}>
                            {roll}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMakiOption(null);
                      setSelectedRolls([]);
                    }}
                    className="text-lg"
                  >
                    Reset
                  </Button>
                  <Button
                    onClick={handleAddMakiToCart}
                    disabled={!canAddMakiToCart()}
                    className="btn-accent flex-1 text-lg font-bold"
                  >
                    Add to Cart - ${makiOption === '2-rolls' ? '10.00' : '13.00'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};