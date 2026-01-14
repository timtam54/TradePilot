'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/lib/auth/context';
import { useToast } from '@/lib/hooks/use-toast';

interface AddMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  onSuccess: () => void;
}

const unitOptions = ['each', 'm', 'm2', 'kg', 'l', 'box', 'pack', 'roll', 'set'];

export function AddMaterialDialog({
  open,
  onOpenChange,
  jobId,
  onSuccess,
}: AddMaterialDialogProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    supplier: '',
    qty: '1',
    unit: 'each',
    buy_price: '',
    markup_pct: String(profile?.default_markup_pct || 20),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}/materials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.access_token}`,
          'X-Auth-Provider': user.provider,
        },
        body: JSON.stringify({
          name: formData.name,
          supplier: formData.supplier || null,
          qty: parseFloat(formData.qty),
          unit: formData.unit,
          buy_price: parseFloat(formData.buy_price) || 0,
          markup_pct: parseFloat(formData.markup_pct),
        }),
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Material added' });
        onOpenChange(false);
        onSuccess();
        setFormData({
          name: '',
          supplier: '',
          qty: '1',
          unit: 'each',
          buy_price: '',
          markup_pct: String(profile?.default_markup_pct || 20),
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to add material',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add material',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const buyPrice = parseFloat(formData.buy_price) || 0;
  const markupPct = parseFloat(formData.markup_pct) || 0;
  const sellPrice = buyPrice * (1 + markupPct / 100);
  const qty = parseFloat(formData.qty) || 1;
  const lineTotal = qty * sellPrice;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Material</DialogTitle>
          <DialogDescription>Add a material to this job</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Material Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., 2.5mm TPS Cable"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                placeholder="e.g., Bunnings"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="qty">Quantity</Label>
                <Input
                  id="qty"
                  name="qty"
                  type="number"
                  step="0.01"
                  value={formData.qty}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, unit: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {unitOptions.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="buy_price">Buy Price ($)</Label>
                <Input
                  id="buy_price"
                  name="buy_price"
                  type="number"
                  step="0.01"
                  value={formData.buy_price}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="markup_pct">Markup (%)</Label>
                <Input
                  id="markup_pct"
                  name="markup_pct"
                  type="number"
                  step="1"
                  value={formData.markup_pct}
                  onChange={handleChange}
                />
              </div>
            </div>

            {buyPrice > 0 && (
              <div className="rounded-lg bg-muted p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Sell Price:</span>
                  <span>${sellPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Line Total:</span>
                  <span>${lineTotal.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Material'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
