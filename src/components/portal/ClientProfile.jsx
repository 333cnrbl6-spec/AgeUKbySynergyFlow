import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2 } from 'lucide-react';

export default function ClientProfile({ client }) {
  const [formData, setFormData] = useState({
    phone: client.phone || '',
    email: client.email || '',
    address_line_1: client.address_line_1 || '',
    address_line_2: client.address_line_2 || '',
    town: client.town || '',
    postcode: client.postcode || '',
    notes: client.notes || ''
  });
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.update(client.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientPortalProfile'] });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your contact details and address</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name (read-only) */}
            <div>
              <label className="text-sm font-semibold block mb-2">Full Name</label>
              <Input
                value={`${client.first_name} ${client.last_name}`}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">Contact us to change your name</p>
            </div>

            {/* Phone */}
            <div>
              <label className="text-sm font-semibold block mb-2">Phone Number</label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-semibold block mb-2">Email Address</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h3 className="font-semibold">Address</h3>
              
              <div>
                <label className="text-sm font-semibold block mb-2">Street Address</label>
                <Input
                  value={formData.address_line_1}
                  onChange={(e) => setFormData({...formData, address_line_1: e.target.value})}
                />
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2">Address Line 2 (Optional)</label>
                <Input
                  value={formData.address_line_2}
                  onChange={(e) => setFormData({...formData, address_line_2: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold block mb-2">Town</label>
                  <Input
                    value={formData.town}
                    onChange={(e) => setFormData({...formData, town: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-2">Postcode</label>
                  <Input
                    value={formData.postcode}
                    onChange={(e) => setFormData({...formData, postcode: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-semibold block mb-2">Additional Information (Optional)</label>
              <Textarea
                placeholder="Any additional information you'd like us to know..."
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="min-h-20"
              />
            </div>

            <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>

            {updateMutation.isSuccess && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-800">Your profile has been updated.</p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">Privacy & Security</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-muted-foreground">
          <p>Your information is secure and only used by Age UK Bury staff to provide you with services.</p>
          <p>To change your password or manage your account security, please contact us directly.</p>
        </CardContent>
      </Card>
    </div>
  );
}