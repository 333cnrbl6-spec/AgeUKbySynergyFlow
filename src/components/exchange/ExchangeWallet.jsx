import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Star, Gift, Info } from 'lucide-react';
import { format } from 'date-fns';

const txTypeConfig = {
  earned_listing: { label: 'Donated item', icon: TrendingUp, color: 'text-green-600' },
  earned_bonus: { label: 'Bonus credits', icon: Star, color: 'text-amber-600' },
  spent_claim: { label: 'Claimed item', icon: TrendingDown, color: 'text-purple-600' },
  spent_reserve: { label: 'Reserved item', icon: TrendingDown, color: 'text-purple-500' },
  refunded: { label: 'Refund', icon: TrendingUp, color: 'text-blue-600' },
  admin_adjustment: { label: 'Staff adjustment', icon: Star, color: 'text-gray-600' },
};

export default function ExchangeWallet({ user }) {
  const { data: wallets = [] } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => base44.entities.KindCreditsWallet.list(),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.KindCreditsTransaction.list('-created_date', 50),
  });

  const myWallet = wallets.find(w => w.created_by === user?.email);
  const myTransactions = transactions.filter(t => t.created_by === user?.email);

  if (!myWallet) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="py-12 text-center space-y-3">
          <Star className="w-12 h-12 text-amber-400 mx-auto" />
          <h2 className="font-bold text-lg">No wallet yet</h2>
          <p className="text-muted-foreground text-sm">Your Kind Credits wallet will be created automatically when you donate your first item or speak to Age UK Bury staff.</p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
            <p><strong>New members receive 10 starter credits</strong> to help them get going in the exchange!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-primary to-purple-700 text-white overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/70 text-sm">Kind Credits Balance</p>
              <p className="text-5xl font-bold mt-1">⭐ {myWallet.balance}</p>
              <p className="text-white/60 text-sm mt-2">{myWallet.client_name}</p>
            </div>
            <div className="text-right space-y-2">
              <div className="bg-white/10 rounded-lg px-3 py-2">
                <p className="text-xs text-white/60">Total Earned</p>
                <p className="font-bold">+{myWallet.total_earned || 0}</p>
              </div>
              <div className="bg-white/10 rounded-lg px-3 py-2">
                <p className="text-xs text-white/60">Total Spent</p>
                <p className="font-bold">-{myWallet.total_spent || 0}</p>
              </div>
            </div>
          </div>
          {myWallet.hardship_access && (
            <div className="mt-4 bg-green-500/20 border border-green-400/30 rounded-lg px-3 py-2">
              <p className="text-sm text-green-100">🌟 Free Access — You can claim any item at no cost</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* How to earn */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" /> How to earn Kind Credits
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-0">
          {[
            { icon: '📦', title: 'Donate an item', desc: 'Earn half the item\'s credit value when it\'s listed' },
            { icon: '🤝', title: 'Volunteer', desc: 'Staff can award bonus credits for volunteering' },
            { icon: '🎁', title: 'New member', desc: 'Everyone starts with 10 starter credits' },
          ].map(tip => (
            <div key={tip.title} className="bg-muted rounded-lg p-3 text-center">
              <div className="text-2xl mb-1">{tip.icon}</div>
              <p className="font-medium text-sm">{tip.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{tip.desc}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Transaction history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {myTransactions.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">No transactions yet.</p>
          ) : (
            <div className="space-y-2">
              {myTransactions.map(tx => {
                const cfg = txTypeConfig[tx.type] || txTypeConfig.earned_bonus;
                const Icon = cfg.icon;
                return (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                      <div>
                        <p className="text-sm font-medium">{tx.description || cfg.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {tx.created_date ? format(new Date(tx.created_date), 'd MMM yyyy') : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${tx.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {tx.amount >= 0 ? '+' : ''}{tx.amount} ⭐
                      </p>
                      <p className="text-xs text-muted-foreground">Balance: {tx.balance_after}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}