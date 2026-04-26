import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const TIER_NAMES = ['Free', 'Starter', 'Pro', 'Enterprise'];
const SUPPORT_LEVELS = ['email', 'priority', 'dedicated', '24/7'];

export default function PricingFormDialog({ pricingId, productName, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    product_name: productName,
    tier_name: 'Starter',
    price_monthly: 0,
    price_annually: 0,
    max_users: null,
    max_records: null,
    support_level: 'email',
    is_active: true,
    is_popular: false,
    display_order: 1,
    features: [],
    description: ''
  });
  const [error, setError] = useState(null);

  const mutation = useMutation({
    mutationFn: (data) => pricingId
      ? base44.entities.Pricing.update(pricingId, data)
      : base44.entities.Pricing.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing'] });
      onClose();
    },
    onError: (err) => setError(err?.message || 'Failed to save pricing')
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.price_monthly < 0) {
      setError('Price must be 0 or higher');
      return;
    }
    mutation.mutate(formData);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{pricingId ? 'Edit Pricing Tier' : 'Add Pricing Tier'}</DialogTitle>
          <DialogDescription>{productName}</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tier Name */}
          <div className="space-y-2">
            <Label>Tier Name</Label>
            <Select
              value={formData.tier_name}
              onValueChange={(value) => setFormData({ ...formData, tier_name: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIER_NAMES.map(name => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., 'Perfect for teams'"
            />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Monthly Price (£)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.price_monthly}
                onChange={(e) => setFormData({ ...formData, price_monthly: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Annual Price (£)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.price_annually}
                onChange={(e) => setFormData({ ...formData, price_annually: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* Limits */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Max Users (-1 for unlimited)</Label>
              <Input
                type="number"
                value={formData.max_users ?? ''}
                onChange={(e) => setFormData({ ...formData, max_users: e.target.value ? parseInt(e.target.value) : null })}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Records (-1 for unlimited)</Label>
              <Input
                type="number"
                value={formData.max_records ?? ''}
                onChange={(e) => setFormData({ ...formData, max_records: e.target.value ? parseInt(e.target.value) : null })}
              />
            </div>
          </div>

          {/* Support Level */}
          <div className="space-y-2">
            <Label>Support Level</Label>
            <Select
              value={formData.support_level}
              onValueChange={(value) => setFormData({ ...formData, support_level: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORT_LEVELS.map(level => (
                  <SelectItem key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Mark as Popular</Label>
              <Switch
                checked={formData.is_popular}
                onCheckedChange={(checked) => setFormData({ ...formData, is_popular: checked })}
              />
            </div>
          </div>

          {/* Actions */}
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save Tier'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}