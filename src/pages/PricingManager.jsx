import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit2, CheckCircle2, AlertCircle } from 'lucide-react';
import PricingFormDialog from '@/components/pricing/PricingFormDialog';

export default function PricingManager() {
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('Age UK Bury');
  const queryClient = useQueryClient();

  const { data: pricing = [] } = useQuery({
    queryKey: ['pricing'],
    queryFn: () => base44.entities.Pricing.list('-display_order', 100)
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const allPricing = await base44.entities.Pricing.list();
      return [...new Set(allPricing.map(p => p.product_name))];
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Pricing.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pricing'] })
  });

  const filteredPricing = pricing.filter(p => p.product_name === selectedProduct);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Pricing Management</h1>
        <p className="text-muted-foreground mt-1">Manage subscription tiers for all products</p>
      </div>

      {/* Product Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            {products.map(product => (
              <Button
                key={product}
                variant={selectedProduct === product ? 'default' : 'outline'}
                onClick={() => setSelectedProduct(product)}
              >
                {product}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Tier Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditingId(null);
            setShowForm(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Pricing Tier
        </Button>
      </div>

      {/* Pricing Tiers Table */}
      <Card>
        <CardHeader>
          <CardTitle>{selectedProduct} Pricing Tiers</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPricing.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No pricing tiers for this product.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Tier</th>
                    <th className="px-4 py-3 text-left font-semibold">Monthly</th>
                    <th className="px-4 py-3 text-left font-semibold">Annual</th>
                    <th className="px-4 py-3 text-left font-semibold">Users</th>
                    <th className="px-4 py-3 text-left font-semibold">Support</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPricing.map(tier => (
                    <tr key={tier.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-2">
                          {tier.tier_name}
                          {tier.is_popular && <Badge className="bg-primary">Popular</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3">£{tier.price_monthly.toFixed(2)}</td>
                      <td className="px-4 py-3">£{(tier.price_annually || tier.price_monthly * 12).toFixed(2)}</td>
                      <td className="px-4 py-3">{tier.max_users === -1 ? 'Unlimited' : tier.max_users || '-'}</td>
                      <td className="px-4 py-3 capitalize">{tier.support_level}</td>
                      <td className="px-4 py-3">
                        <Badge variant={tier.is_active ? 'default' : 'outline'}>
                          {tier.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(tier.id);
                            setShowForm(true);
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(tier.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      {showForm && (
        <PricingFormDialog
          pricingId={editingId}
          productName={selectedProduct}
          onClose={() => {
            setShowForm(false);
            setEditingId(null);
          }}
        />
      )}
    </div>
  );
}