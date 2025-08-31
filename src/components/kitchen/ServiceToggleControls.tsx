import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle, Truck, Package, Clock, Power } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface ServiceStatus {
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  orders_disabled: boolean;
  orders_disabled_reason?: string;
  orders_disabled_until?: string;
}

const reasonCodes = [
  'Weather/road conditions',
  'Driver unavailable', 
  'Kitchen overwhelmed/high volume',
  'Equipment malfunction',
  'Special event/catering',
  'Staff shortage',
  'Custom reason'
];

const durationOptions = [
  { label: '30 minutes', minutes: 30 },
  { label: '1 hour', minutes: 60 },
  { label: '2 hours', minutes: 120 },
  { label: '4 hours', minutes: 240 },
  { label: 'Rest of day', minutes: 'end-of-day' },
  { label: 'Custom time', minutes: 'custom' }
];

export const ServiceToggleControls = () => {
  const [staffName, setStaffName] = useState('');
  const [hasApproval, setHasApproval] = useState(false);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>({
    delivery_enabled: true,
    pickup_enabled: true,
    orders_disabled: false
  });
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('');
  const [customDateTime, setCustomDateTime] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'delivery' | 'pickup' | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchServiceStatus();
  }, []);

  const fetchServiceStatus = async () => {
    const { data, error } = await supabase
      .from('restaurants')
      .select('delivery_enabled, online_orders_enabled, orders_disabled, orders_disabled_reason, orders_disabled_until')
      .single();

    if (error) {
      console.error('Error fetching service status:', error);
      return;
    }

    setServiceStatus({
      delivery_enabled: data.delivery_enabled,
      pickup_enabled: data.online_orders_enabled,
      orders_disabled: data.orders_disabled,
      orders_disabled_reason: data.orders_disabled_reason,
      orders_disabled_until: data.orders_disabled_until
    });
  };

  const calculateEndTime = (duration: string | number) => {
    const now = new Date();
    
    if (duration === 'end-of-day') {
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      return endOfDay.toISOString();
    } else if (duration === 'custom') {
      return customDateTime;
    } else if (typeof duration === 'number') {
      const endTime = new Date(now.getTime() + duration * 60000);
      return endTime.toISOString();
    }
    
    return null;
  };

  const handleServiceToggle = async (serviceType: 'delivery' | 'pickup') => {
    const currentStatus = serviceType === 'delivery' ? serviceStatus.delivery_enabled : serviceStatus.pickup_enabled;
    
    if (currentStatus) {
      // Service is currently enabled, show disable dialog
      setPendingAction(serviceType);
      setIsDialogOpen(true);
    } else {
      // Service is currently disabled, enable it
      await toggleService(serviceType, true, '', '');
    }
  };

  const toggleService = async (serviceType: 'delivery' | 'pickup', enable: boolean, reason: string, duration: string) => {
    const reasonText = reason === 'Custom reason' ? customReason : reason;
    const endTime = enable ? null : calculateEndTime(selectedDuration === 'custom' ? 'custom' : durationOptions.find(d => d.label === duration)?.minutes || 30);

    let updateData: any = {};
    
    if (serviceType === 'delivery') {
      updateData.delivery_enabled = enable;
    } else {
      updateData.online_orders_enabled = enable;
    }

    if (!enable) {
      // Log the disable action
      await supabase.from('ordering_disable_log').insert({
        restaurant_id: 'current-restaurant-id', // You'll need to get this from context
        disable_reason: reasonText,
        custom_reason: reason === 'Custom reason' ? customReason : null,
        disabled_by: 'kitchen-staff',
        duration_minutes: typeof selectedDuration === 'number' ? selectedDuration : null,
        auto_enabled: false
      });
    }

    const { error } = await supabase
      .from('restaurants')
      .update(updateData)
      .eq('id', 'current-restaurant-id'); // You'll need to get this from context

    if (error) {
      console.error('Error updating service status:', error);
      toast({
        title: "Error",
        description: "Failed to update service status",
        variant: "destructive"
      });
      return;
    }

    await fetchServiceStatus();
    
    toast({
      title: enable ? "Service Enabled" : "Service Disabled",
      description: enable 
        ? `${serviceType === 'delivery' ? 'Delivery' : 'Takeout'} service has been enabled`
        : `${serviceType === 'delivery' ? 'Delivery' : 'Takeout'} service has been disabled: ${reasonText}`,
    });

    // Reset form
    setSelectedReason('');
    setCustomReason('');
    setSelectedDuration('');
    setCustomDateTime('');
    setIsDialogOpen(false);
    setPendingAction(null);
  };

  const confirmDisable = async () => {
    if (!pendingAction || !selectedReason || !selectedDuration || !staffName || !hasApproval || !customReason) return;
    
    // Calculate end time based on selected duration
    const endTime = calculateEndTime(selectedDuration === 'Rest of day' ? 'end-of-day' : 
      selectedDuration === '30 minutes' ? 30 :
      selectedDuration === '1 hour' ? 60 :
      selectedDuration === '2 hours' ? 120 : 240);
    
    // Log the pause action to database
    await supabase.from('service_pause_log').insert({
      restaurant_id: '3b29861a-5ade-4800-b269-d0a03c351eb6', // Bluefin restaurant ID
      staff_name: staffName,
      has_approval: hasApproval,
      pause_reason: selectedReason,
      pause_details: customReason,
      pause_duration: selectedDuration,
      pause_start: new Date().toISOString(),
      pause_end: endTime,
      created_at: new Date().toISOString()
    });
    
    await toggleService(pendingAction, false, selectedReason, selectedDuration);
    
    // Reset form
    setStaffName('');
    setHasApproval(false);
    setSelectedReason('');
    setCustomReason('');
  };

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/New_York'
  });

  return (
    <div className="space-y-8">
      <Card className="border-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-4 text-4xl font-black">
            <Power className="h-12 w-12" />
            🚨 SERVICE CONTROLS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="text-center p-6 bg-muted rounded-lg border-2">
            <p className="text-2xl font-bold mb-4">
              Currently, we will stop taking to-go and/or delivery orders at {currentTime}.
            </p>
            <p className="text-3xl font-black text-kitchen-danger">
              Would you like to pause to-go and delivery orders?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Button
              onClick={() => {
                setSelectedDuration('30 minutes');
                setPendingAction('pickup');
                setIsDialogOpen(true);
              }}
              className="h-20 text-xl font-black border-4"
              variant="destructive"
            >
              🛑 Pause for 30 minutes
            </Button>
            <Button
              onClick={() => {
                setSelectedDuration('1 hour');
                setPendingAction('pickup');
                setIsDialogOpen(true);
              }}
              className="h-20 text-xl font-black border-4"
              variant="destructive"
            >
              🛑 Pause for 1 hour
            </Button>
            <Button
              onClick={() => {
                setSelectedDuration('2 hours');
                setPendingAction('pickup');
                setIsDialogOpen(true);
              }}
              className="h-20 text-xl font-black border-4"
              variant="destructive"
            >
              🛑 Pause for 2 hours
            </Button>
            <Button
              onClick={() => {
                setSelectedDuration('Rest of day');
                setPendingAction('pickup');
                setIsDialogOpen(true);
              }}
              className="h-20 text-xl font-black border-4"
              variant="destructive"
            >
              🛑 Pause for rest of day
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pause Service Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black">
              🚨 PAUSE ORDERS
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <label className="text-xl font-bold">Staff Name:</label>
              <input
                type="text"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                placeholder="Enter your name..."
                className="w-full p-4 border-2 rounded text-lg"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={hasApproval}
                onChange={(e) => setHasApproval(e.target.checked)}
                className="w-6 h-6"
              />
              <label className="text-lg font-bold">I have approval to pause orders</label>
            </div>

            <div>
              <label className="text-xl font-bold">Reason:</label>
              <Select value={selectedReason} onValueChange={setSelectedReason}>
                <SelectTrigger className="w-full h-16 text-lg">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="weather">Weather conditions</SelectItem>
                  <SelectItem value="staff">Staff shortage</SelectItem>
                  <SelectItem value="equipment">Equipment issues</SelectItem>
                  <SelectItem value="overwhelmed">Kitchen overwhelmed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-lg font-bold">Additional details (REQUIRED):</label>
              <Textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Provide specific details about why you're pausing orders..."
                rows={3}
                className="text-lg border-2"
                required
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1 h-16 text-lg">
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmDisable}
                disabled={!staffName || !hasApproval || !selectedReason || !customReason}
                className="flex-1 h-16 text-lg font-bold"
              >
                🛑 PAUSE ORDERS FOR {selectedDuration.toUpperCase()}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};