'use client';

import { useState, useEffect } from 'react';
import { Plus, Phone, Globe, MapPin, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth/context';
import { Supplier } from '@/lib/types';
import { useToast } from '@/lib/hooks/use-toast';

export default function SuppliersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    phone: '',
    website: '',
    address_line1: '',
    suburb: '',
    state: '',
    postcode: '',
    notes: '',
  });

  const fetchSuppliers = async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/suppliers', {
        headers: {
          Authorization: `Bearer ${user.access_token}`,
          'X-Auth-Provider': user.provider,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data.suppliers);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.access_token}`,
          'X-Auth-Provider': user.provider,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Supplier added' });
        setDialogOpen(false);
        setFormData({ name: '', category: '', phone: '', website: '', address_line1: '', suburb: '', state: '', postcode: '', notes: '' });
        fetchSuppliers();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add supplier', variant: 'destructive' });
    }
  };

  const syncFromXero = async () => {
    if (!user) return;

    setSyncing(true);
    try {
      const response = await fetch('/api/suppliers/sync-xero', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.access_token}`,
          'X-Auth-Provider': user.provider,
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Sync Complete',
          description: `${data.created} created, ${data.updated} updated from Xero`,
        });
        fetchSuppliers();
      } else {
        toast({
          title: 'Sync Failed',
          description: data.error || 'Failed to sync from Xero',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sync from Xero',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Suppliers</h1>
          <p className="text-muted-foreground">Manage your supplier contacts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={syncFromXero} disabled={syncing}>
            {syncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {syncing ? 'Syncing...' : 'Sync from Xero'}
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Add Supplier</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Supplier</DialogTitle>
                <DialogDescription>Add a new supplier</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input value={formData.name} onChange={(e) => setFormData(p => ({...p, name: e.target.value}))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Input value={formData.category} onChange={(e) => setFormData(p => ({...p, category: e.target.value}))} placeholder="e.g., Electrical Wholesaler" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={formData.phone} onChange={(e) => setFormData(p => ({...p, phone: e.target.value}))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Website</Label>
                    <Input value={formData.website} onChange={(e) => setFormData(p => ({...p, website: e.target.value}))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input value={formData.address_line1} onChange={(e) => setFormData(p => ({...p, address_line1: e.target.value}))} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Input placeholder="Suburb" value={formData.suburb} onChange={(e) => setFormData(p => ({...p, suburb: e.target.value}))} />
                  <Input placeholder="State" value={formData.state} onChange={(e) => setFormData(p => ({...p, state: e.target.value}))} />
                  <Input placeholder="Postcode" value={formData.postcode} onChange={(e) => setFormData(p => ({...p, postcode: e.target.value}))} />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea value={formData.notes} onChange={(e) => setFormData(p => ({...p, notes: e.target.value}))} />
                </div>
                <DialogFooter><Button type="submit">Add Supplier</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : suppliers.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No suppliers yet</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((supplier) => (
            <Card key={supplier.id}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{supplier.name}</CardTitle>
                  {supplier.xero_contact_id && (
                    <div className="h-4 w-4 rounded bg-[#13B5EA] flex items-center justify-center flex-shrink-0" title="Synced from Xero">
                      <svg viewBox="0 0 24 24" className="h-3 w-3 text-white" fill="currentColor">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 14.833l-1.953 1.953c-.195.195-.512.195-.707 0l-3.181-3.181-3.181 3.181c-.195.195-.512.195-.707 0l-1.953-1.953c-.195-.195-.195-.512 0-.707l3.181-3.181-3.181-3.181c-.195-.195-.195-.512 0-.707l1.953-1.953c.195-.195.512-.195.707 0l3.181 3.181 3.181-3.181c.195-.195.512-.195.707 0l1.953 1.953c.195.195.195.512 0 .707l-3.181 3.181 3.181 3.181c.195.195.195.512 0 .707z"/>
                      </svg>
                    </div>
                  )}
                </div>
                {supplier.category && <p className="text-sm text-muted-foreground">{supplier.category}</p>}
              </CardHeader>
              <CardContent className="space-y-2">
                {supplier.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${supplier.phone}`} className="hover:underline">{supplier.phone}</a>
                  </div>
                )}
                {supplier.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">{supplier.website}</a>
                  </div>
                )}
                {supplier.address_line1 && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{supplier.address_line1}{supplier.suburb ? `, ${supplier.suburb}` : ''} {supplier.state} {supplier.postcode}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
