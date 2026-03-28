import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Star, Gift, MapPin, Package } from 'lucide-react';
import { CREDIT_BANDS, CATEGORY_LABELS, CONDITION_LABELS } from './exchangeConstants';

export default function ExchangeStorefront({ user }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [bandFilter, setBandFilter] = useState('all');
  const [claimItem, setClaimItem] = useState(null);

  const { data: items = [] } = useQuery({
    queryKey: ['exchange-items'],
    queryFn: () => base44.entities.ExchangeItem.filter({ status: 'available' }),
  });

  const { data: wallets = [] } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => base44.entities.KindCreditsWallet.list(),
  });

  const myWallet = wallets.find(w => w.created_by === user?.email);

  const claimMutation = useMutation({
    mutationFn: async ({ item, wallet }) => {
      const cost = item.is_gift || wallet?.hardship_access ? 0 : item.credit_value;
      const newBalance = (wallet?.balance || 0) - cost;

      await base44.entities.ExchangeItem.update(item.id, {
        status: 'reserved',
        claimed_by_name: user?.full_name,
        claim_date: new Date().toISOString().split('T')[0],
      });

      if (wallet && cost > 0) {
        await base44.entities.KindCreditsWallet.update(wallet.id, {
          balance: newBalance,
          total_spent: (wallet.total_spent || 0) + cost,
        });
        await base44.entities.KindCreditsTransaction.create({
          wallet_id: wallet.id,
          client_id: wallet.client_id,
          client_name: wallet.client_name,
          type: 'spent_claim',
          amount: -cost,
          balance_after: newBalance,
          description: `Claimed: ${item.title}`,
          item_id: item.id,
          item_title: item.title,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange-items'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      setClaimItem(null);
    },
  });

  const filtered = useMemo(() => {
    return items.filter(item => {
      const matchSearch = item.title?.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === 'all' || item.category === categoryFilter;
      const matchBand = bandFilter === 'all' || item.credit_band === bandFilter;
      return matchSearch && matchCat && matchBand;
    });
  }, [items, search, categoryFilter, bandFilter]);

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={bandFilter} onValueChange={setBandFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Credits" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Credits</SelectItem>
            {Object.entries(CREDIT_BANDS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label} ({v.credits} credits)</SelectItem>
            ))}
            <SelectItem value="gift">🎁 Free Gift</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* My wallet banner */}
      {myWallet && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-amber-800">Your Kind Credits balance:</span>
          <span className="font-bold text-amber-700 text-lg">⭐ {myWallet.balance} credits</span>
        </div>
      )}

      {/* Items Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No items match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => {
            const band = CREDIT_BANDS[item.credit_band] || CREDIT_BANDS.useful;
            return (
              <Card key={item.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.title} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-purple-100 to-amber-100 flex items-center justify-center">
                    <Package className="w-12 h-12 text-primary/30" />
                  </div>
                )}
                <CardContent className="p-4 space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-foreground leading-tight">{item.title}</h3>
                      {item.is_gift ? (
                        <Badge className="bg-green-100 text-green-700 gap-1 flex-shrink-0"><Gift className="w-3 h-3" /> Free</Badge>
                      ) : (
                        <Badge className={`${band.badgeColor} flex-shrink-0`}>
                          ⭐ {item.credit_value} credits
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{CATEGORY_LABELS[item.category] || item.category}</span>
                    <span className="capitalize">{CONDITION_LABELS[item.condition] || item.condition}</span>
                  </div>
                  {item.town && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" /> {item.town}
                    </div>
                  )}
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => setClaimItem(item)}
                  >
                    {item.is_gift ? '🎁 Request for Free' : `Claim for ⭐ ${item.credit_value}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Claim confirmation dialog */}
      {claimItem && (
        <Dialog open onOpenChange={() => setClaimItem(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Claim this item?</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <p className="font-semibold">{claimItem.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{claimItem.description}</p>
              </div>
              {claimItem.is_gift || myWallet?.hardship_access ? (
                <p className="text-green-700 bg-green-50 rounded-lg p-3 text-sm">🎁 This item is <strong>free</strong> — no credits needed.</p>
              ) : (
                <div className="text-sm space-y-1">
                  <p>Cost: <strong>⭐ {claimItem.credit_value} Kind Credits</strong></p>
                  <p>Your balance: <strong>⭐ {myWallet?.balance ?? '—'}</strong></p>
                  {myWallet && myWallet.balance < claimItem.credit_value && (
                    <p className="text-red-600">⚠️ You don't have enough credits. Speak to Age UK Bury staff about help.</p>
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground">Staff will confirm collection or delivery with you shortly.</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setClaimItem(null)}>Cancel</Button>
                <Button
                  onClick={() => claimMutation.mutate({ item: claimItem, wallet: myWallet })}
                  disabled={claimMutation.isPending || (!claimItem.is_gift && !myWallet?.hardship_access && myWallet && myWallet.balance < claimItem.credit_value)}
                >
                  {claimMutation.isPending ? 'Claiming...' : 'Confirm Claim'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}