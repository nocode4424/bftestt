import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Mail, Edit2, Trash2, User, Shield, ChefHat } from 'lucide-react';

interface NotificationRecipient {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  notification_types: string[];
  phone?: string;
  created_at: string;
}

interface EmailNotificationManagerProps {
  restaurantId: string;
}

const NOTIFICATION_TYPES = [
  { value: 'new_order', label: 'New Orders', description: 'When a new order is placed' },
  { value: 'payment_success', label: 'Payment Success', description: 'When payment is confirmed' },
  { value: 'order_cancelled', label: 'Order Cancelled', description: 'When an order is cancelled' },
  { value: 'kitchen_alerts', label: 'Kitchen Alerts', description: 'Kitchen management alerts' },
  { value: 'daily_summary', label: 'Daily Summary', description: 'End-of-day summary report' }
];

const ROLES = [
  { value: 'owner', label: 'Owner', icon: Shield },
  { value: 'manager', label: 'Manager', icon: User },
  { value: 'kitchen_manager', label: 'Kitchen Manager', icon: ChefHat },
  { value: 'admin', label: 'Admin', icon: Shield }
];

export const EmailNotificationManager: React.FC<EmailNotificationManagerProps> = ({
  restaurantId
}) => {
  const [recipients, setRecipients] = useState<NotificationRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'manager',
    phone: '',
    notification_types: ['new_order', 'payment_success'] as string[]
  });

  useEffect(() => {
    loadRecipients();
  }, [restaurantId]);

  const loadRecipients = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurant_notification_recipients')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecipients(data || []);
    } catch (error) {
      console.error('Error loading recipients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        // Update existing recipient
        const { error } = await supabase
          .from('restaurant_notification_recipients')
          .update({
            email: formData.email,
            name: formData.name,
            role: formData.role,
            phone: formData.phone || null,
            notification_types: formData.notification_types,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        // Add new recipient
        const { error } = await supabase
          .from('restaurant_notification_recipients')
          .insert({
            restaurant_id: restaurantId,
            email: formData.email,
            name: formData.name,
            role: formData.role,
            phone: formData.phone || null,
            notification_types: formData.notification_types,
            is_active: true
          });

        if (error) throw error;
      }

      // Reset form and reload data
      setFormData({
        email: '',
        name: '',
        role: 'manager',
        phone: '',
        notification_types: ['new_order', 'payment_success']
      });
      setShowAddForm(false);
      setEditingId(null);
      loadRecipients();

    } catch (error) {
      console.error('Error saving recipient:', error);
      alert('Failed to save recipient. Please try again.');
    }
  };

  const handleEdit = (recipient: NotificationRecipient) => {
    setFormData({
      email: recipient.email,
      name: recipient.name,
      role: recipient.role,
      phone: recipient.phone || '',
      notification_types: recipient.notification_types
    });
    setEditingId(recipient.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this recipient?')) return;

    try {
      const { error } = await supabase
        .from('restaurant_notification_recipients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadRecipients();
    } catch (error) {
      console.error('Error deleting recipient:', error);
      alert('Failed to delete recipient. Please try again.');
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('restaurant_notification_recipients')
        .update({ 
          is_active: !isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      loadRecipients();
    } catch (error) {
      console.error('Error updating recipient status:', error);
      alert('Failed to update recipient status. Please try again.');
    }
  };

  const handleNotificationTypeChange = (type: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      notification_types: checked 
        ? [...prev.notification_types, type]
        : prev.notification_types.filter(t => t !== type)
    }));
  };

  if (loading) {
    return <div className="p-4">Loading email recipients...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email Notification Recipients
            </CardTitle>
            <p className="text-sm text-gray-600">
              Manage who receives email notifications for restaurant activities
            </p>
          </div>
          <Button 
            onClick={() => {
              setShowAddForm(!showAddForm);
              setEditingId(null);
              setFormData({
                email: '',
                name: '',
                role: 'manager',
                phone: '',
                notification_types: ['new_order', 'payment_success']
              });
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Recipient
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Add/Edit Form */}
        {showAddForm && (
          <form onSubmit={handleSubmit} className="border rounded-lg p-6 bg-gray-50">
            <h3 className="text-lg font-medium mb-4">
              {editingId ? 'Edit Recipient' : 'Add New Recipient'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@restaurant.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map(role => (
                      <SelectItem key={role.value} value={role.value}>
                        <div className="flex items-center gap-2">
                          <role.icon className="w-4 h-4" />
                          {role.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div className="mb-6">
              <Label>Notification Types</Label>
              <p className="text-sm text-gray-600 mb-3">Select which types of notifications this person should receive:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {NOTIFICATION_TYPES.map(type => (
                  <div key={type.value} className="flex items-start gap-3 p-3 border rounded-lg">
                    <Checkbox
                      id={type.value}
                      checked={formData.notification_types.includes(type.value)}
                      onCheckedChange={(checked) => handleNotificationTypeChange(type.value, checked as boolean)}
                    />
                    <div>
                      <label htmlFor={type.value} className="font-medium cursor-pointer">
                        {type.label}
                      </label>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit">
                {editingId ? 'Update Recipient' : 'Add Recipient'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowAddForm(false);
                  setEditingId(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Recipients List */}
        <div className="space-y-4">
          {recipients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Mail className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No email recipients configured yet.</p>
              <p className="text-sm">Add recipients to receive order notifications.</p>
            </div>
          ) : (
            recipients.map((recipient) => {
              const RoleIcon = ROLES.find(r => r.value === recipient.role)?.icon || User;
              
              return (
                <div key={recipient.id} className="border rounded-lg p-4 bg-white">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <RoleIcon className="w-5 h-5 text-gray-600" />
                        <h4 className="font-medium text-lg">{recipient.name}</h4>
                        <Badge variant={recipient.is_active ? "default" : "secondary"}>
                          {recipient.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline">
                          {ROLES.find(r => r.value === recipient.role)?.label || recipient.role}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>📧 {recipient.email}</p>
                        {recipient.phone && <p>📞 {recipient.phone}</p>}
                      </div>

                      <div className="mt-3">
                        <p className="text-sm font-medium mb-2">Receives notifications for:</p>
                        <div className="flex flex-wrap gap-1">
                          {recipient.notification_types.map(type => (
                            <Badge key={type} variant="outline" className="text-xs">
                              {NOTIFICATION_TYPES.find(nt => nt.value === type)?.label || type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(recipient)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleActive(recipient.id, recipient.is_active)}
                      >
                        {recipient.is_active ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(recipient.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailNotificationManager;