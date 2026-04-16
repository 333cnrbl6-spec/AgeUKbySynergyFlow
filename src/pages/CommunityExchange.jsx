import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ExchangeStorefront from '@/components/exchange/ExchangeStorefront';
import ExchangeListItem from '@/components/exchange/ExchangeListItem';
import ExchangeWallet from '@/components/exchange/ExchangeWallet';
import ExchangeAdmin from '@/components/exchange/ExchangeAdmin';
import { Heart, ShoppingBag, Wallet, Shield } from 'lucide-react';

export default function CommunityExchange() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-purple-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-primary to-purple-700 text-white px-6 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Heart className="w-5 h-5 text-secondary" />
            </div>
            <span className="text-white/70 text-sm font-medium uppercase tracking-wider">Age UK Bolton</span>
          </div>
          <h1 className="text-4xl font-bold font-heading mb-2">Community Exchange</h1>
          <p className="text-white/80 text-lg max-w-2xl">
            Share what you no longer need. Find what might help you. Powered by <strong>Kind Credits</strong> — our community currency where generosity is rewarded.
          </p>
          <p className="text-white/60 text-sm max-w-2xl mt-2">
            This is a community-run exchange and is not operated by Age UK Bolton. Please seek professional advice before using any mobility or daily living equipment.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <Tabs defaultValue="browse">
          <TabsList className="mb-6">
            <TabsTrigger value="browse" className="gap-2">
              <ShoppingBag className="w-4 h-4" /> Browse Items
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <Heart className="w-4 h-4" /> Donate an Item
            </TabsTrigger>
            <TabsTrigger value="wallet" className="gap-2">
              <Wallet className="w-4 h-4" /> My Kind Credits
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="admin" className="gap-2">
                <Shield className="w-4 h-4" /> Moderate
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="browse">
            <ExchangeStorefront user={user} />
          </TabsContent>

          <TabsContent value="list">
            <ExchangeListItem user={user} />
          </TabsContent>

          <TabsContent value="wallet">
            <ExchangeWallet user={user} />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin">
              <ExchangeAdmin user={user} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}