'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { useToast } from '@/lib/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

interface CreateQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  jobTitle: string;
  materialsTotal: number;
  labourTotal: number;
}

type SyncStatus = 'idle' | 'syncing' | 'creating' | 'success' | 'error';

export function CreateQuoteDialog({
  open,
  onOpenChange,
  jobId,
  jobTitle,
  materialsTotal,
  labourTotal,
}: CreateQuoteDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [xeroConnected, setXeroConnected] = useState<boolean | null>(null);
  const [quoteNumber, setQuoteNumber] = useState<string | null>(null);

  const subtotal = materialsTotal + labourTotal;
  const gst = subtotal * 0.1;
  const total = subtotal + gst;

  useEffect(() => {
    if (open) {
      checkXeroConnection();
    }
  }, [open]);

  const checkXeroConnection = async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/xero/token', {
        headers: {
          Authorization: `Bearer ${user.access_token}`,
          'X-Auth-Provider': user.provider,
        },
      });

      const data = await response.json();
      setXeroConnected(!!data.token?.access_token);
    } catch {
      setXeroConnected(false);
    }
  };

  const syncXeroData = async () => {
    if (!user) return false;

    setStatus('syncing');
    setErrorMessage('');

    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch('/api/xero/sync', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.access_token}`,
          'X-Auth-Provider': user.provider,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Sync failed with status ${response.status}`);
      }

      console.log('Xero sync result:', data);
      return true;
    } catch (error) {
      let message = 'Failed to sync';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          message = 'Request timed out. Please check your Xero connection.';
        } else {
          message = error.message;
        }
      }
      setErrorMessage(message);
      setStatus('error');
      return false;
    }
  };

  const createQuote = async () => {
    if (!user) return;

    // First sync Xero data to ensure we have the default contact and items
    const synced = await syncXeroData();
    if (!synced) return;

    setStatus('creating');

    try {
      // Add timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch('/api/xero/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.access_token}`,
          'X-Auth-Provider': user.provider,
        },
        body: JSON.stringify({ jobId }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to create quote (${response.status})`);
      }

      setQuoteNumber(data.quote_number);
      setStatus('success');

      toast({
        title: 'Quote Created',
        description: `Quote ${data.quote_number} created in Xero`,
      });
    } catch (error) {
      let message = 'Failed to create quote';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          message = 'Request timed out. Please try again.';
        } else {
          message = error.message;
        }
      }
      setErrorMessage(message);
      setStatus('error');
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    setStatus('idle');
    setErrorMessage('');
    setQuoteNumber(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Xero Quote</DialogTitle>
          <DialogDescription>
            Create a quote in Xero for "{jobTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Quote Summary */}
          <div className="rounded-lg border p-4 space-y-2">
            <h4 className="font-medium">Quote Summary</h4>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Materials</span>
                <span>{formatCurrency(materialsTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Labour</span>
                <span>{formatCurrency(labourTotal)}</span>
              </div>
              <div className="flex justify-between border-t pt-1 mt-1">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">GST (10%)</span>
                <span>{formatCurrency(gst)}</span>
              </div>
              <div className="flex justify-between font-medium text-base border-t pt-1 mt-1">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {xeroConnected === false && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="font-medium">Xero not connected</p>
                <p className="text-sm">Please connect Xero in Settings first.</p>
              </div>
            </div>
          )}

          {status === 'syncing' && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Syncing Xero contacts and items...</span>
            </div>
          )}

          {status === 'creating' && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Creating quote in Xero...</span>
            </div>
          )}

          {status === 'success' && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
              <CheckCircle className="h-5 w-5" />
              <div>
                <p className="font-medium">Quote created successfully!</p>
                <p className="text-sm">Quote number: {quoteNumber}</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium">Error</p>
                <p className="text-sm break-words whitespace-pre-wrap">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Info about what will happen */}
          {status === 'idle' && xeroConnected && (
            <div className="text-sm text-muted-foreground">
              <p>This will:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Sync contacts and items from Xero</li>
                <li>Use "Cash Sales" as the customer (created if missing)</li>
                <li>Use "Building Labour" for labour charges</li>
                <li>Use "Building Materials" for materials</li>
                <li>Create the quote in Xero</li>
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {status === 'success' ? 'Close' : 'Cancel'}
          </Button>
          {status !== 'success' && (
            <Button
              onClick={createQuote}
              disabled={status === 'syncing' || status === 'creating' || xeroConnected === false}
            >
              {status === 'syncing' || status === 'creating' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {status === 'syncing' ? 'Syncing...' : 'Creating...'}
                </>
              ) : status === 'error' ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </>
              ) : (
                'Create Quote'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
