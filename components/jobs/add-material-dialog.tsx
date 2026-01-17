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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Loader2, ChevronRight, Package } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { useToast } from '@/lib/hooks/use-toast';
import { JobMaterial } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface SuggestedMaterial {
  name: string;
  qty: number;
  unit: string;
  estimated_buy_price: number;
  reason: string;
  supplier_hint?: string;
}

interface AddMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  onSuccess: () => void;
  existingMaterials?: JobMaterial[];
}

const unitOptions = ['each', 'm', 'm2', 'kg', 'l', 'box', 'pack', 'roll', 'set'];

export function AddMaterialDialog({
  open,
  onOpenChange,
  jobId,
  onSuccess,
  existingMaterials = [],
}: AddMaterialDialogProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('add');
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedMaterial[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    supplier: '',
    qty: '1',
    unit: 'each',
    buy_price: '',
    markup_pct: String(profile?.default_markup_pct || 20),
  });

  const fetchSuggestions = async () => {
    if (!user) return;

    setSuggestionsLoading(true);
    setActiveTab('suggest');

    try {
      const response = await fetch('/api/ai/suggest-materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.access_token}`,
          'X-Auth-Provider': user.provider,
        },
        body: JSON.stringify({ jobId }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuggestions(data.materials || []);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to get suggestions',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to get AI suggestions',
        variant: 'destructive',
      });
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number | null>(null);

  const selectSuggestion = (suggestion: SuggestedMaterial, index: number) => {
    setFormData({
      name: suggestion.name,
      supplier: suggestion.supplier_hint || '',
      qty: String(suggestion.qty),
      unit: suggestion.unit,
      buy_price: String(suggestion.estimated_buy_price),
      markup_pct: String(profile?.default_markup_pct || 20),
    });
    setSelectedSuggestionIndex(index);
    setActiveTab('add');
  };

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
        onSuccess();

        // Remove the added suggestion from the list if it came from suggestions
        if (selectedSuggestionIndex !== null) {
          setSuggestions(prev => prev.filter((_, i) => i !== selectedSuggestionIndex));
          setSelectedSuggestionIndex(null);
          // Go back to suggestions if there are more
          if (suggestions.length > 1) {
            setActiveTab('suggest');
          }
        }

        // Reset form for next entry
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

  const materialsTotal = existingMaterials.reduce((sum, m) => sum + (m.line_total || 0), 0);

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset state when closing
      setSuggestions([]);
      setSelectedSuggestionIndex(null);
      setActiveTab('add');
      setFormData({
        name: '',
        supplier: '',
        qty: '1',
        unit: 'each',
        buy_price: '',
        markup_pct: String(profile?.default_markup_pct || 20),
      });
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Add Material</DialogTitle>
              <DialogDescription>Add a material to this job</DialogDescription>
            </div>
            <Button
              type="button"
              variant={activeTab === 'suggest' ? 'default' : 'outline'}
              size="sm"
              onClick={fetchSuggestions}
              disabled={suggestionsLoading}
            >
              {suggestionsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI Suggest
                </>
              )}
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="add">Add New</TabsTrigger>
            <TabsTrigger value="existing">
              Current ({existingMaterials.length})
            </TabsTrigger>
            <TabsTrigger value="suggest">
              AI Suggestions {suggestions.length > 0 && `(${suggestions.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="add" className="mt-4">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
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
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                  Done
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Adding...' : 'Add & Continue'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="existing" className="mt-4">
            <ScrollArea className="h-[400px]">
              {existingMaterials.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">Unit</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {existingMaterials.map((material) => (
                        <TableRow key={material.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{material.name}</p>
                              {material.supplier && (
                                <p className="text-xs text-muted-foreground">
                                  {material.supplier}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {material.qty}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(material.sell_price)}/{material.unit}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(material.line_total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex items-center justify-between p-4 border-t mt-2">
                    <span className="font-medium">Total Materials</span>
                    <span className="text-lg font-bold">{formatCurrency(materialsTotal)}</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">No materials added yet</p>
                  <p className="text-sm text-muted-foreground">
                    Use AI Suggest or add manually
                  </p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="suggest" className="mt-4">
            <ScrollArea className="h-[400px]">
              {suggestionsLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="mt-4 text-muted-foreground">Analysing job and suggesting materials...</p>
                </div>
              ) : suggestions.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground mb-4">
                    Click a suggestion to pre-fill the form
                  </p>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      className="w-full text-left p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      onClick={() => selectSuggestion(suggestion, index)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{suggestion.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {suggestion.qty} {suggestion.unit} • ~{formatCurrency(suggestion.estimated_buy_price)}
                            {suggestion.supplier_hint && ` • ${suggestion.supplier_hint}`}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {suggestion.reason}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground ml-4 flex-shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">No suggestions yet</p>
                  <p className="text-sm text-muted-foreground">
                    Click "AI Suggest" to get material recommendations
                  </p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
