import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar } from 'lucide-react';
import { checkLunchSpecialsVisibility, getLunchSpecialDescription, type TimeBasedVisibility } from '@/utils/menuTiming';

interface LunchSpecialBannerProps {
  className?: string;
}

export const LunchSpecialBanner: React.FC<LunchSpecialBannerProps> = ({ 
  className = "" 
}) => {
  const [visibility, setVisibility] = useState<TimeBasedVisibility>({ isVisible: false });
  
  useEffect(() => {
    const checkVisibility = () => {
      const newVisibility = checkLunchSpecialsVisibility();
      setVisibility(newVisibility);
    };
    
    // Check immediately
    checkVisibility();
    
    // Check every minute to update the banner
    const interval = setInterval(checkVisibility, 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (!visibility.isVisible) {
    return null;
  }

  return (
    <Card className={`border-4 border-[#D1470B] bg-gradient-to-r from-white to-[#FFB703]/10 shadow-lg ${className}`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#D1470B] animate-pulse"></div>
              <Badge variant="outline" className="border-2 border-[#D1470B] text-[#D1470B] bg-[#FFB703]/20 px-3 py-1 font-bold">
                🍱 LUNCH SPECIALS
              </Badge>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#2671BC]">
              <Calendar className="h-3 w-3" />
              <span className="font-semibold">{getLunchSpecialDescription()}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-[#D1470B]" />
            <span className="text-xs font-bold text-[#D1470B]">
              Ends 3:00 PM Today
            </span>
          </div>
        </div>
        
        <div className="sm:hidden mt-2">
          <div className="flex items-center gap-2 text-xs text-[#2671BC]">
            <Calendar className="h-3 w-3" />
            <span className="font-semibold">{getLunchSpecialDescription()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};