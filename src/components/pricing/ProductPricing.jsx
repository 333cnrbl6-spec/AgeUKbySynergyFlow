import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Toggle } from '@/components/ui/toggle';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import PricingCard from './PricingCard';

export default function ProductPricing({ productName, showBillingToggle = true, onSelectTier }) {
  const [isAnnual, setIsAnnual] = useState(false);

  const { data: pricing = [], isLoading, error } = useQuery({
    queryKey: ['pricing', productName],
    queryFn: () => base44.entities.Pricing.filter({
      product_name: productName,
      is_active: true
    }, 'display_order')
  });

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>Failed to load pricing. Please try again.</AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-96 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (pricing.length === 0) {
    return (
      <Alert>
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>No pricing tiers available for {productName}.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      {/* Billing Toggle */}
      {showBillingToggle && (
        <div className="flex items-center justify-center gap-4">
          <span className={`text-sm font-medium ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
            Monthly
          </span>
          <Toggle
            pressed={isAnnual}
            onPressedChange={setIsAnnual}
            className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            Annual (Save 15%)
          </Toggle>
          <span className={`text-sm font-medium ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
            Yearly
          </span>
        </div>
      )}

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pricing.map((tier) => (
          <PricingCard
            key={tier.id}
            tier={tier}
            isPopular={tier.is_popular}
            isAnnual={isAnnual}
            currency={tier.currency}
            onSelectTier={onSelectTier}
          />
        ))}
      </div>
    </div>
  );
}