import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  error?: string | null;
  retryCount?: number;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  isConnected, 
  error = null, 
  retryCount = 0 
}) => {
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg border-2" style={{ backgroundColor: 'white', borderColor: isConnected ? '#10b981' : error ? '#f59e0b' : '#ef4444' }}>
      {isConnected ? (
        <>
          <Wifi className="h-10 w-10" style={{ color: '#10b981' }} />
          <div className="flex flex-col">
            <Badge className="text-xl px-4 py-2 font-black" style={{ backgroundColor: '#10b981', color: 'white' }}>
              📡 LIVE
            </Badge>
            <span className="text-sm font-bold" style={{ color: '#10b981' }}>
              Real-time Active
            </span>
          </div>
        </>
      ) : error ? (
        <>
          <AlertTriangle className="h-10 w-10" style={{ color: '#f59e0b' }} />
          <div className="flex flex-col">
            <Badge className="text-xl px-4 py-2 font-black" style={{ backgroundColor: '#f59e0b', color: 'white' }}>
              ⚠️ ERROR
            </Badge>
            <span className="text-sm font-bold" style={{ color: '#f59e0b' }}>
              {error}{retryCount > 0 && ` (Retry ${retryCount})`}
            </span>
          </div>
        </>
      ) : (
        <>
          <WifiOff className="h-10 w-10 animate-pulse" style={{ color: '#ef4444' }} />
          <div className="flex flex-col">
            <Badge className="text-xl px-4 py-2 font-black animate-pulse" style={{ backgroundColor: '#ef4444', color: 'white' }}>
              🔌 CONNECTING
            </Badge>
            <span className="text-sm font-bold" style={{ color: '#ef4444' }}>
              {retryCount > 0 ? `Retry attempt ${retryCount}` : 'Establishing connection'}
            </span>
          </div>
        </>
      )}
    </div>
  );
};