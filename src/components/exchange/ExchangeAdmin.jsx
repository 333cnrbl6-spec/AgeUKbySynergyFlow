import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, XCircle, Star, Package, AlertTriangle } from 'lucide-react';
import { CREDIT_BANDS, CATEGORY_LABELS } from './exchangeConstants';
import { format } from 'date-fns';

export default function ExchangeAdmin({ user }) {
  const queryClient = useQueryClient();
  const [bonusClientId, setBonusClientId] = useState('');
  const [bonusAmount, setBonusAmount] = useState(5);
  const [bonusReason, setBonusReason] = useState('');

  const { data: pendingItems = [] } = useQuery({
    queryKey: ['exchange-pending'],
    queryFn: () => base44.entities.ExchangeItem.filter({ status: 'pending_review' }),
  });

  const { data: allItems = [] } = useQuery({
    queryKey: ['exchange-all'],
    queryFn: () => base44.entities.ExchangeItem.list('-created_date', 100),
  });

  const { data: wallets = [] } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => base44.entities.KindCreditsWallet.list(),
  });

  const approveMutation = useMutation({
    mutationFn: async (item) => {
      await base44.entities.ExchangeItem.update(item.id, {
        status: 'available',
        approved_by: user?.full_name,
      });
      // Award listing credits to donor
      const band = CREDIT_BANDS[item.credit_band];
      if (band && band.credits > 0 && item.created_by) {
        const wallet = wallets.find(w => w.created_by === item.created_by);
        if (wallet) {
          const earn = Math.round(band.credits * 0.5);
          const newBal = (wallet.balance || 0) + earn;
          await base44.entities.KindCreditsWallet.update(wallet.id, {
            balance: newBal,
            total_earned: (wallet.total_earned || 0) + earn,
          });
          await base44.entities.KindCreditsTransaction.create({
            wallet_id: wallet.id,
            client_id: wallet.client_id,
            client_name: wallet.client_name,
            type: 'earned_listing',
            amount: earn,
            balance_after: newBal,
            description: `Approved listing: ${item.title}`,
            item_id: item.id,
            item_title: item.title,
            performed_by: user?.full_name,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange-pending'] });
      queryClient.invalidateQueries({ queryKey: ['exchange-all'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => base44.entities.ExchangeItem.update(id, { status: 'removed' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exchange-pending'] }),
  });

  const toggleHardship = useMutation({
    mutationFn: ({ wallet }) => base44.entities.KindCreditsWallet.update(wallet.id, { hardship_access: !wallet.hardship_access }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wallets'] }),
  });

  const awardBonus = useMutation({
    mutationFn: async () => {
      const wallet = wallets.find(w => w.client_id === bonusClientId || w.client_name.toLowerCase().includes(bonusClientId.toLowerCase()));
      if (!wallet) throw new Error('Wallet not found');
      const newBal = (wallet.balance || 0) + bonusAmount;
      await base44.entities.KindCreditsWallet.update(wallet.id, {
        balance: newBal,
        total_earned: (wallet.total_earned || 0) + bonusAmount,
      });
      await base44.entities.KindCreditsTransaction.create({
        wallet_id: wallet.id,
        client_id: wallet.client_id,
        client_name: wallet.client_name,
        type: 'earned_bonus',
        amount: bonusAmount,
        balance_after: newBal,
        description: bonusReason || 'Staff bonus award',
        performed_by: user?.full_name,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      setBonusClientId('');
      setBonusReason('');
    },
  });

  const statusCounts = allItems.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pending Review', value: statusCounts.pending_review || 0, color: 'text-amber-600' },
          { label: 'Available', value: statusCounts.available || 0, color: 'text-green-600' },
          { label: 'Reserved', value: statusCounts.reserved || 0, color: 'text-purple-600' },
          { label: 'Claimed', value: statusCounts.claimed || 0, color: 'text-blue-600' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pending Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Items Awaiting Approval ({pendingItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingItems.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">All caught up — no items pending review.</p>
          ) : (
            <div className="space-y-3">
              {pendingItems.map(item => {
                const band = CREDIT_BANDS[item.credit_band];
                return (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{item.title}</p>
                        <Badge className={band?.badgeColor || ''}>
                          {item.is_gift ? '🎁 Free' : `⭐ ${item.credit_value} credits`}
                        </Badge>
                        <Badge variant="outline">{CATEGORY_LABELS[item.category]}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        By: {item.listed_by_name} · {item.condition} condition
                        {item.town && ` · ${item.town}`}
                        {item.created_date && ` · ${format(new Date(item.created_date), 'd MMM')}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => rejectMutation.mutate(item.id)} className="gap-1 text-red-600 border-red-200 hover:bg-red-50">
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </Button>
                      <Button size="sm" onClick={() => approveMutation.mutate(item)} className="gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Award Bonus Credits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" /> Award Bonus Kind Credits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Award extra credits to volunteers, participants in need, or for special contributions.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Client name or ID..."
              value={bonusClientId}
              onChange={e => setBonusClientId(e.target.value)}
              className="flex-1"
            />
            <Input
              type="number"
              min={1}
              max={100}
              value={bonusAmount}
              onChange={e => setBonusAmount(Number(e.target.value))}
              className="w-24"
            />
            <Input
              placeholder="Reason (e.g. volunteering)"
              value={bonusReason}
              onChange={e => setBonusReason(e.target.value)}
              className="flex-1"
            />
            <Button onClick={() => awardBonus.mutate()} disabled={!bonusClientId || awardBonus.isPending}>
              Award ⭐
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Hardship Access — wallets list */}
      <Card>
        <CardHeader>
          <CardTitle>Hardship Free Access</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">Toggle free access for people in hardship — they can claim any item at no credit cost.</p>
          <div className="space-y-2">
            {wallets.map(wallet => (
              <div key={wallet.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-sm">{wallet.client_name}</p>
                  <p className="text-xs text-muted-foreground">⭐ {wallet.balance} credits</p>
                </div>
                <div className="flex items-center gap-3">
                  {wallet.hardship_access && (
                    <Badge className="bg-green-100 text-green-700">Free Access</Badge>
                  )}
                  <Button
                    size="sm"
                    variant={wallet.hardship_access ? 'destructive' : 'outline'}
                    onClick={() => toggleHardship.mutate({ wallet })}
                  >
                    {wallet.hardship_access ? 'Remove' : 'Grant Free Access'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}