import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PricingCard({ 
  tier, 
  isPopular = false, 
  onSelectTier,
  isAnnual = false,
  currency = 'GBP'
}) {
  const displayPrice = isAnnual ? tier.price_annually || tier.price_monthly * 12 : tier.price_monthly;
  const billingPeriod = isAnnual ? 'year' : 'month';

  return (
    <Card className={cn(
      "flex flex-col h-full transition-all duration-300",
      isPopular ? "border-primary shadow-lg scale-105 md:scale-100" : "hover:shadow-md"
    )}>
      {/* Header */}
      <CardHeader>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <CardTitle className="text-lg">{tier.tier_name}</CardTitle>
            {tier.description && (
              <CardDescription className="mt-1">{tier.description}</CardDescription>
            )}
          </div>
          {isPopular && (
            <Badge className="whitespace-nowrap bg-primary text-primary-foreground">
              Popular
            </Badge>
          )}
        </div>
      </CardHeader>

      {/* Price */}
      <CardContent className="space-y-6 flex-1 flex flex-col">
        <div className="pb-4 border-b">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold">{currency === 'GBP' ? '£' : '$'}</span>
            <span className="text-4xl font-bold">{displayPrice.toFixed(0)}</span>
            <span className="text-muted-foreground">/{billingPeriod}</span>
          </div>
          {isAnnual && tier.price_annually && (
            <p className="text-xs text-green-600 mt-1">
              Save {Math.round((1 - tier.price_annually / (tier.price_monthly * 12)) * 100)}% annually
            </p>
          )}
        </div>

        {/* Limits */}
        {(tier.max_users || tier.max_records) && (
          <div className="space-y-1 text-sm">
            {tier.max_users && (
              <p className="text-muted-foreground">
                <strong>Users:</strong> {tier.max_users === -1 ? 'Unlimited' : tier.max_users}
              </p>
            )}
            {tier.max_records && (
              <p className="text-muted-foreground">
                <strong>Records:</strong> {tier.max_records === -1 ? 'Unlimited' : `${tier.max_records.toLocaleString()}`}
              </p>
            )}
            {tier.support_level && (
              <p className="text-muted-foreground">
                <strong>Support:</strong> {tier.support_level.charAt(0).toUpperCase() + tier.support_level.slice(1)}
              </p>
            )}
          </div>
        )}

        {/* Features */}
        <div className="space-y-2 flex-1">
          <p className="text-sm font-semibold">Features included:</p>
          <ul className="space-y-2">
            {tier.features?.slice(0, 6).map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                {feature.included ? (
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <X className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                )}
                <span className={feature.included ? '' : 'text-muted-foreground'}>
                  {feature.name}
                  {feature.limit && <span className="text-xs text-muted-foreground"> ({feature.limit})</span>}
                </span>
              </li>
            ))}
          </ul>
          {tier.features?.length > 6 && (
            <p className="text-xs text-muted-foreground pt-1">+ {tier.features.length - 6} more features</p>
          )}
        </div>

        {/* CTA */}
        <Button
          onClick={() => onSelectTier?.(tier)}
          variant={isPopular ? 'default' : 'outline'}
          className="w-full mt-6"
        >
          Get Started
        </Button>
      </CardContent>
    </Card>
  );
}