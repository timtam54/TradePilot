'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { useAuth } from '@/lib/auth/context';
import { MaterialCatalog } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/lib/hooks/use-toast';

export default function MaterialsPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [materials, setMaterials] = useState<MaterialCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    supplier: '',
    buy_price: '',
    markup_pct: '20',
    unit: 'each',
    category: '',
  });

  const fetchMaterials = async () => {
    if (!user) return;
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);

      const response = await fetch(`/api/materials?${params}`, {
        headers: {
          Authorization: `Bearer ${user.access_token}`,
          'X-Auth-Provider': user.provider,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMaterials(data.materials);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [user, search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const response = await fetch('/api/materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.access_token}`,
          'X-Auth-Provider': user.provider,
        },
        body: JSON.stringify({
          ...formData,
          buy_price: parseFloat(formData.buy_price) || 0,
          markup_pct: parseFloat(formData.markup_pct) || 20,
        }),
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Material added to catalog' });
        setDialogOpen(false);
        setFormData({ name: '', sku: '', supplier: '', buy_price: '', markup_pct: '20', unit: 'each', category: '' });
        fetchMaterials();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add material', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Materials Catalog</h1>
          <p className="text-muted-foreground">Manage your materials and pricing</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Material
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Material</DialogTitle>
              <DialogDescription>Add a new material to your catalog</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={formData.name} onChange={(e) => setFormData(p => ({...p, name: e.target.value}))} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SKU</Label>
                  <Input value={formData.sku} onChange={(e) => setFormData(p => ({...p, sku: e.target.value}))} />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Input value={formData.unit} onChange={(e) => setFormData(p => ({...p, unit: e.target.value}))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Input value={formData.supplier} onChange={(e) => setFormData(p => ({...p, supplier: e.target.value}))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Buy Price ($)</Label>
                  <Input type="number" step="0.01" value={formData.buy_price} onChange={(e) => setFormData(p => ({...p, buy_price: e.target.value}))} />
                </div>
                <div className="space-y-2">
                  <Label>Markup (%)</Label>
                  <Input type="number" value={formData.markup_pct} onChange={(e) => setFormData(p => ({...p, markup_pct: e.target.value}))} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Add Material</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search materials..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : materials.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No materials in catalog</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Buy Price</TableHead>
                  <TableHead className="text-right">Markup</TableHead>
                  <TableHead className="text-right">Sell Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{m.name}</p>
                        {m.sku && <p className="text-sm text-muted-foreground">{m.sku}</p>}
                      </div>
                    </TableCell>
                    <TableCell>{m.supplier || '-'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(m.buy_price)}</TableCell>
                    <TableCell className="text-right">{m.markup_pct}%</TableCell>
                    <TableCell className="text-right">{formatCurrency(m.sell_price)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
