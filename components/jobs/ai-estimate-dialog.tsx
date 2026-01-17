'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sparkles,
  Package,
  Wrench,
  Loader2,
  CheckCircle,
  Lightbulb,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { AIEstimateResponse } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface AIEstimateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  onAddLabour?: (labour: { description: string; hours: number; rate: number }) => void;
  onAddMaterial?: (material: { name: string; qty: number; estimated_price: number }) => void;
}

export function AIEstimateDialog({
  open,
  onOpenChange,
  jobId,
  onAddLabour,
  onAddMaterial,
}: AIEstimateDialogProps) {
  const { user } = useAuth();
  const [estimate, setEstimate] = useState<AIEstimateResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateEstimate = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/estimate', {
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
        setEstimate(data);
      } else {
        setError(data.error || `HTTP ${response.status}: Failed to generate estimate`);
      }
    } catch (err) {
      setError(`Connection error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-100 text-green-700';
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Job Estimate
          </DialogTitle>
          <DialogDescription>
            Generate an AI-powered estimate with confidence scoring
          </DialogDescription>
        </DialogHeader>

        {!estimate && !isLoading && !error && (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <p className="text-center text-muted-foreground max-w-sm">
              Our AI will analyze the job details and generate a detailed cost estimate
              with labour breakdown, material suggestions, and confidence scoring.
            </p>
            <Button onClick={generateEstimate} size="lg">
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Estimate
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Analysing job and generating estimate...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <div className="text-center max-w-md">
              <p className="text-destructive font-medium mb-2">Error</p>
              <p className="text-sm text-muted-foreground break-words">{error}</p>
            </div>
            <Button onClick={generateEstimate} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {estimate && (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-4">
              {/* Confidence Score */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Confidence Score</p>
                        <p className="text-sm text-muted-foreground">
                          {estimate.confidence_reasoning}
                        </p>
                      </div>
                    </div>
                    <Badge className={getConfidenceColor(estimate.confidence)}>
                      {estimate.confidence}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Labour Breakdown */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Wrench className="h-4 w-4" />
                    Labour Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {estimate.labour.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.hours}h @ {formatCurrency(item.rate)}/hr
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatCurrency(item.total)}</span>
                        {onAddLabour && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              onAddLabour({
                                description: item.description,
                                hours: item.hours,
                                rate: item.rate,
                              })
                            }
                          >
                            Add
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end pt-2">
                    <span className="font-medium">
                      Total: {formatCurrency(estimate.totals.labour_total)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Confirmed Materials */}
              {estimate.materials_confirmed.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Package className="h-4 w-4" />
                      Confirmed Materials
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {estimate.materials_confirmed.map((item) => (
                      <div
                        key={item.job_material_id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.qty} @ {formatCurrency(item.unit_price)}
                          </p>
                        </div>
                        <span className="font-medium">{formatCurrency(item.total)}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Suggested Materials */}
              {estimate.materials_suggested.length > 0 && (
                <Card className="border-warning/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Lightbulb className="h-4 w-4 text-warning" />
                      Suggested Materials
                      <span className="text-xs text-warning font-normal">(AI recommendations)</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {estimate.materials_suggested.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg bg-warning/10"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.qty} • {item.reason}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-muted-foreground">
                            ~{formatCurrency(item.estimated_price)}
                          </span>
                          {onAddMaterial && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                onAddMaterial({
                                  name: item.name,
                                  qty: item.qty,
                                  estimated_price: item.estimated_price,
                                })
                              }
                            >
                              Add
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              {estimate.notes && (
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">{estimate.notes}</p>
                  </CardContent>
                </Card>
              )}

              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Labour</span>
                  <span>{formatCurrency(estimate.totals.labour_total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Materials</span>
                  <span>{formatCurrency(estimate.totals.materials_total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(estimate.totals.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST (10%)</span>
                  <span>{formatCurrency(estimate.totals.tax)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(estimate.totals.grand_total)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEstimate(null)}>
                  Regenerate
                </Button>
                <Button onClick={() => onOpenChange(false)}>Done</Button>
              </div>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
