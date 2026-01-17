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
import { Sparkles, Loader2, ChevronRight, Clock } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { useToast } from '@/lib/hooks/use-toast';
import { JobLabour } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface SuggestedLabour {
  description: string;
  hours: number;
  reason: string;
}

interface AddLabourDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  labourRate: number;
  onSuccess: () => void;
  existingLabour?: JobLabour[];
}

export function AddLabourDialog({
  open,
  onOpenChange,
  jobId,
  labourRate,
  onSuccess,
  existingLabour = [],
}: AddLabourDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('add');
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedLabour[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    hours: '',
    rate: String(labourRate),
  });

  const fetchSuggestions = async () => {
    if (!user) return;

    setSuggestionsLoading(true);
    setActiveTab('suggest');

    try {
      const response = await fetch('/api/ai/suggest-labour', {
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
        setSuggestions(data.tasks || []);
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

  const selectSuggestion = (suggestion: SuggestedLabour, index: number) => {
    setFormData({
      description: suggestion.description,
      hours: String(suggestion.hours),
      rate: String(labourRate),
    });
    setSelectedSuggestionIndex(index);
    setActiveTab('add');
  };

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

  const labourTotal = existingLabour.reduce((sum, l) => sum + (l.hours * l.rate), 0);

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset state when closing
      setSuggestions([]);
      setSelectedSuggestionIndex(null);
      setActiveTab('add');
      setFormData({
        description: '',
        hours: '',
        rate: String(labourRate),
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
              <DialogTitle>Add Labour</DialogTitle>
              <DialogDescription>Add a labour entry to this job</DialogDescription>
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
              Current ({existingLabour.length})
            </TabsTrigger>
            <TabsTrigger value="suggest">
              AI Suggestions {suggestions.length > 0 && `(${suggestions.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="add" className="mt-4">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
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
              {existingLabour.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-center">Hours</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {existingLabour.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>{entry.description}</TableCell>
                          <TableCell className="text-center">{entry.hours}h</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(entry.rate)}/hr
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(entry.hours * entry.rate)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex items-center justify-between p-4 border-t mt-2">
                    <span className="font-medium">Total Labour</span>
                    <span className="text-lg font-bold">{formatCurrency(labourTotal)}</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">No labour entries yet</p>
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
                  <p className="mt-4 text-muted-foreground">Analysing job and estimating labour...</p>
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
                          <p className="font-medium">{suggestion.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {suggestion.hours}h • ~{formatCurrency(suggestion.hours * labourRate)}
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
                    Click "AI Suggest" to get labour time estimates
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
