'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth/context';
import { useToast } from '@/lib/hooks/use-toast';

interface AddLabourDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  labourRate: number;
  onSuccess: () => void;
}

export function AddLabourDialog({
  open,
  onOpenChange,
  jobId,
  labourRate,
  onSuccess,
}: AddLabourDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    hours: '',
    rate: String(labourRate),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}/labour`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.access_token}`,
          'X-Auth-Provider': user.provider,
        },
        body: JSON.stringify({
          description: formData.description,
          hours: parseFloat(formData.hours),
          rate: parseFloat(formData.rate),
        }),
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Labour entry added' });
        onOpenChange(false);
        onSuccess();
        setFormData({
          description: '',
          hours: '',
          rate: String(labourRate),
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to add labour',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add labour',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const hours = parseFloat(formData.hours) || 0;
  const rate = parseFloat(formData.rate) || 0;
  const total = hours * rate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Labour</DialogTitle>
          <DialogDescription>Add a labour entry to this job</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="e.g., Switchboard installation"
                rows={2}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hours">Hours *</Label>
                <Input
                  id="hours"
                  name="hours"
                  type="number"
                  step="0.25"
                  value={formData.hours}
                  onChange={handleChange}
                  placeholder="0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rate">Rate ($/hr)</Label>
                <Input
                  id="rate"
                  name="rate"
                  type="number"
                  step="0.01"
                  value={formData.rate}
                  onChange={handleChange}
                />
              </div>
            </div>

            {hours > 0 && (
              <div className="rounded-lg bg-muted p-3 text-sm">
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Labour'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
