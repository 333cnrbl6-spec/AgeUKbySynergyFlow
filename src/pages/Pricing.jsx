import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProductPricing from '@/components/pricing/ProductPricing';
import { AlertCircle } from 'lucide-react';

const PRODUCTS = [
  { id: 'age-uk-bury', name: 'Age UK Bury', description: 'Community care management' },
  { id: 'health-services', name: 'HealthServices', description: 'Health service coordination' },
  { id: 'community-exchange', name: 'CommunityExchange', description: 'Kind Credits marketplace' }
];

export default function PricingPage() {
  const [selectedProduct, setSelectedProduct] = useState('Age UK Bury');

  const handleSelectTier = (tier) => {
    alert(`Selected: ${tier.tier_name} tier for ${selectedProduct}\n\nIn a real app, this would redirect to checkout.`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-heading font-bold">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the right plan for your organization. All plans include core features, with flexible scaling.
          </p>
        </div>

        {/* Product Tabs */}
        <Card>
          <CardContent className="pt-6">
            <Tabs value={selectedProduct} onValueChange={setSelectedProduct}>
              <TabsList className="grid w-full grid-cols-3 mb-8">
                {PRODUCTS.map(product => (
                  <TabsTrigger key={product.id} value={product.name}>
                    {product.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Pricing for each product */}
              {PRODUCTS.map(product => (
                <TabsContent key={product.id} value={product.name} className="space-y-4">
                  <p className="text-muted-foreground text-sm">{product.description}</p>
                  <ProductPricing
                    productName={product.name}
                    onSelectTier={handleSelectTier}
                    showBillingToggle={true}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold mb-2">Can I switch plans anytime?</h4>
              <p className="text-muted-foreground">Yes, upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Do you offer annual discounts?</h4>
              <p className="text-muted-foreground">Yes! Annual plans save up to 15% compared to monthly billing.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">What about custom enterprise plans?</h4>
              <p className="text-muted-foreground">Contact our sales team for custom pricing tailored to your organization's needs.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}