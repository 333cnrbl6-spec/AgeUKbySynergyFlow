import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Info } from 'lucide-react';
import { CREDIT_BANDS, CATEGORY_LABELS, CONDITION_LABELS, SUGGESTED_ITEMS } from './exchangeConstants';

export default function ExchangeListItem({ user }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: '', description: '', category: 'daily_living',
    condition: 'good', credit_band: 'useful', is_gift: false,
    collection_method: 'collection', town: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const { data: wallets = [] } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => base44.entities.KindCreditsWallet.list(),
  });

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      const band = CREDIT_BANDS[data.credit_band];
      const creditValue = data.is_gift ? 0 : band.credits;

      const item = await base44.entities.ExchangeItem.create({
        ...data,
        credit_value: creditValue,
        listed_by_name: user?.full_name,
        status: 'pending_review',
      });

      // Award Kind Credits to the donor
      if (!data.is_gift) {
        const earnAmount = Math.round(creditValue * 0.5); // earn half the value for donating
        const wallet = wallets.find(w => w.created_by === user?.email);
        if (wallet) {
          const newBalance = (wallet.balance || 0) + earnAmount;
          await base44.entities.KindCreditsWallet.update(wallet.id, {
            balance: newBalance,
            total_earned: (wallet.total_earned || 0) + earnAmount,
          });
          await base44.entities.KindCreditsTransaction.create({
            wallet_id: wallet.id,
            client_id: wallet.client_id,
            client_name: wallet.client_name,
            type: 'earned_listing',
            amount: earnAmount,
            balance_after: newBalance,
            description: `Donated: ${data.title}`,
            item_id: item.id,
            item_title: data.title,
          });
        }
      }
      return item;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange-items'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      setSubmitted(true);
    },
  });

  const selectedBand = CREDIT_BANDS[form.credit_band];
  const suggestions = SUGGESTED_ITEMS[form.category] || [];
  const earnAmount = form.is_gift ? 0 : Math.round((selectedBand?.credits || 0) * 0.5);

  if (submitted) {
    return (
      <Card className="max-w-xl mx-auto">
        <CardContent className="py-12 text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold">Thank you!</h2>
          <p className="text-muted-foreground">Your item has been submitted for review by our team. Once approved it will appear in the store.</p>
          {earnAmount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-amber-800 font-medium">⭐ You'll earn <strong>{earnAmount} Kind Credits</strong> once approved!</p>
            </div>
          )}
          <Button onClick={() => { setSubmitted(false); setForm({ title: '', description: '', category: 'daily_living', condition: 'good', credit_band: 'useful', is_gift: false, collection_method: 'collection', town: '' }); }}>
            List Another Item
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Donate an Item to the Community</CardTitle>
          <p className="text-sm text-muted-foreground">Share something you no longer need. Your generosity earns you Kind Credits!</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category */}
          <div>
            <Label>Category *</Label>
            <Select value={form.category} onValueChange={v => set('category', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            {suggestions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {suggestions.slice(0, 5).map(s => (
                  <button key={s} onClick={() => set('title', s)} className="text-xs bg-muted hover:bg-primary hover:text-white px-2 py-1 rounded-full transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <Label>Item Name *</Label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Bath seat with arms" required />
          </div>

          {/* Description */}
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} placeholder="Any details about the item, size, brand, etc." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Condition</Label>
              <Select value={form.condition} onValueChange={v => set('condition', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CONDITION_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Your Town</Label>
              <Input value={form.town} onChange={e => set('town', e.target.value)} placeholder="e.g. Bury, Prestwich" />
            </div>
          </div>

          {/* Gift toggle */}
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <input
              type="checkbox"
              id="is_gift"
              checked={form.is_gift}
              onChange={e => set('is_gift', e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="is_gift" className="text-sm text-green-800 font-medium cursor-pointer">
              🎁 Offer this as a Free Gift (no credits needed to claim)
            </label>
          </div>

          {/* Credit Band */}
          {!form.is_gift && (
            <div>
              <Label>Item Value Band</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {Object.entries(CREDIT_BANDS).filter(([k]) => k !== 'gift').map(([k, v]) => (
                  <button
                    key={k}
                    onClick={() => set('credit_band', k)}
                    className={`p-3 rounded-lg border text-left text-sm transition-all ${form.credit_band === k ? 'border-primary bg-accent' : 'border-border hover:border-primary/50'}`}
                  >
                    <div className="font-medium">{v.label}</div>
                    <div className="text-xs text-muted-foreground">{v.credits} credits · {v.description}</div>
                  </button>
                ))}
              </div>
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <p className="text-xs text-amber-800">You'll earn <strong>⭐ {earnAmount} Kind Credits</strong> when your item is approved and listed.</p>
              </div>
            </div>
          )}

          <div>
            <Label>Collection Method</Label>
            <Select value={form.collection_method} onValueChange={v => set('collection_method', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="collection">Collection only</SelectItem>
                <SelectItem value="delivery">I can deliver locally</SelectItem>
                <SelectItem value="either">Either works for me</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            className="w-full"
            disabled={!form.title || !form.category || submitMutation.isPending}
            onClick={() => submitMutation.mutate(form)}
          >
            {submitMutation.isPending ? 'Submitting...' : 'Submit for Review'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}