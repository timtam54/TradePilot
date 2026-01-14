'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/lib/auth/context';
import { Trade } from '@/lib/types';
import { tradeOptions, getDefaultLabourRate } from '@/lib/utils/trades';
import { useToast } from '@/lib/hooks/use-toast';

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    trade: 'general' as Trade,
    company_name: '',
    phone: '',
    default_labour_rate: '',
    default_markup_pct: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        trade: profile.trade || 'general',
        company_name: profile.company_name || '',
        phone: profile.phone || '',
        default_labour_rate: String(profile.default_labour_rate || ''),
        default_markup_pct: String(profile.default_markup_pct || ''),
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.access_token}`,
          'X-Auth-Provider': user.provider,
        },
        body: JSON.stringify({
          ...formData,
          default_labour_rate: parseFloat(formData.default_labour_rate) || null,
          default_markup_pct: parseFloat(formData.default_markup_pct) || null,
        }),
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Settings saved' });
        refreshProfile();
      } else {
        toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleTradeChange = (trade: Trade) => {
    setFormData((prev) => ({
      ...prev,
      trade,
      default_labour_rate: String(getDefaultLabourRate(trade)),
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your personal and business information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData((p) => ({ ...p, full_name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={profile?.email || ''} disabled />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Trade</Label>
                  <Select value={formData.trade} onValueChange={handleTradeChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tradeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input
                    value={formData.company_name}
                    onChange={(e) => setFormData((p) => ({ ...p, company_name: e.target.value }))}
                    placeholder="Your business name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="0412 345 678"
                />
              </div>

              <Separator className="my-4" />

              <h4 className="font-medium">Default Rates</h4>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Labour Rate ($/hr)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.default_labour_rate}
                    onChange={(e) => setFormData((p) => ({ ...p, default_labour_rate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Default Markup (%)</Label>
                  <Input
                    type="number"
                    step="1"
                    value={formData.default_markup_pct}
                    onChange={(e) => setFormData((p) => ({ ...p, default_markup_pct: e.target.value }))}
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Account information and authentication</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Signed in with</p>
                <p className="text-sm text-muted-foreground capitalize">{user?.provider || 'Unknown'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
            <CardDescription>Connect to third-party services</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/settings/xero"
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-[#13B5EA] flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 14.833l-1.953 1.953c-.195.195-.512.195-.707 0l-3.181-3.181-3.181 3.181c-.195.195-.512.195-.707 0l-1.953-1.953c-.195-.195-.195-.512 0-.707l3.181-3.181-3.181-3.181c-.195-.195-.195-.512 0-.707l1.953-1.953c.195-.195.512-.195.707 0l3.181 3.181 3.181-3.181c.195-.195.512-.195.707 0l1.953 1.953c.195.195.195.512 0 .707l-3.181 3.181 3.181 3.181c.195.195.195.512 0 .707z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Xero</p>
                  <p className="text-sm text-muted-foreground">Sync invoices and contacts with Xero</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
