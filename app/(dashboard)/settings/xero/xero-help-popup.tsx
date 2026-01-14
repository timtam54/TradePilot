'use client';

import { X, ExternalLink, Copy, CheckCircle, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface XeroHelpPopupProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientSecret: string;
  onSave: (clientId: string, clientSecret: string) => Promise<string>;
  onConnect: (clientId: string | null) => void;
  appUrl: string;
}

export default function XeroHelpPopup({
  isOpen,
  onClose,
  clientId: initialClientId,
  clientSecret: initialClientSecret,
  onSave,
  onConnect,
  appUrl,
}: XeroHelpPopupProps) {
  const [copiedStep, setCopiedStep] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string>(initialClientId);
  const [clientSecret, setClientSecret] = useState<string>(initialClientSecret);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const redirectUri = `${appUrl}/api/xero/callback`;

  const copyToClipboard = async (text: string, stepId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStep(stepId);
      setTimeout(() => setCopiedStep(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleSave = async () => {
    if (clientId && clientSecret) {
      setIsSaving(true);
      try {
        const message = await onSave(clientId, clientSecret);
        setSaveMessage(message);
      } catch {
        setSaveMessage('Error saving credentials');
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="bg-gradient-to-r from-blue-900 via-blue-700 to-blue-900 -m-6 mb-0 p-6 rounded-t-lg">
          <DialogTitle className="text-2xl font-bold text-white">
            Integrate with Xero
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Step 1 */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold">Go to Xero Developer Portal</h3>
            </div>
            <div className="ml-11 space-y-3">
              <p className="text-muted-foreground">
                Navigate to the Xero Developer portal and sign in with your Xero account.
              </p>
              <div className="bg-background p-3 rounded-md border flex items-center gap-2">
                <code className="flex-1 text-sm">https://developer.xero.com/</code>
                <a
                  href="https://developer.xero.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-muted rounded"
                >
                  <ExternalLink className="h-4 w-4 text-blue-600" />
                </a>
                <button
                  onClick={() => copyToClipboard('https://developer.xero.com/', 'step1-url')}
                  className="p-2 hover:bg-muted rounded"
                >
                  {copiedStep === 'step1-url' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold">Create a New App</h3>
            </div>
            <div className="ml-11 space-y-3">
              <p className="text-muted-foreground">
                Click &quot;Add New App&quot; and fill in the following details:
              </p>

              <div className="bg-background p-4 rounded-md border space-y-4">
                <div>
                  <label className="text-sm font-medium">App name</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input value="TradePilot" readOnly className="flex-1" />
                    <button
                      onClick={() => copyToClipboard('TradePilot', 'app-name')}
                      className="p-2 hover:bg-muted rounded"
                    >
                      {copiedStep === 'app-name' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Integration type</label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select <strong>&quot;Web app&quot;</strong>
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">Company or application URL</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input value={appUrl} readOnly className="flex-1" />
                    <button
                      onClick={() => copyToClipboard(appUrl, 'app-url')}
                      className="p-2 hover:bg-muted rounded"
                    >
                      {copiedStep === 'app-url' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Redirect URI</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input value={redirectUri} readOnly className="flex-1" />
                    <button
                      onClick={() => copyToClipboard(redirectUri, 'redirect-uri')}
                      className="p-2 hover:bg-muted rounded"
                    >
                      {copiedStep === 'redirect-uri' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Accept the Xero Developer Terms & Conditions</li>
                <li>Click &quot;Create app&quot;</li>
              </ul>
            </div>
          </div>

          {/* Step 3 */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold">Get Your Credentials</h3>
            </div>
            <div className="ml-11 space-y-3">
              <p className="text-muted-foreground">
                Go to the &quot;Configuration&quot; tab in your Xero app to get your credentials.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Client ID</label>
                  <Input
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="Paste your Client ID here"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Client Secret</label>
                  <p className="text-xs text-muted-foreground mb-1">
                    Click &quot;Generate a secret&quot; in Xero, then paste it here immediately
                  </p>
                  <div className="relative">
                    <Input
                      type={showSecret ? 'text' : 'password'}
                      value={clientSecret}
                      onChange={(e) => setClientSecret(e.target.value)}
                      placeholder="Paste your Client Secret here"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
                    >
                      {showSecret ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handleSave}
                  disabled={!clientId || !clientSecret || isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Credentials'}
                </Button>

                {saveMessage && (
                  <div
                    className={`p-2 rounded text-sm ${
                      saveMessage.toLowerCase().includes('success')
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                  >
                    {saveMessage}
                  </div>
                )}
              </div>

              <div className="bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded p-3">
                <p className="text-orange-800 dark:text-orange-400 text-sm">
                  <strong>Important:</strong> Copy your Client Secret immediately after generating
                  it. You won&apos;t be able to view it again.
                </p>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full font-bold">
                4
              </div>
              <h3 className="text-lg font-semibold">Connect to Xero</h3>
            </div>
            <div className="ml-11 space-y-3">
              <p className="text-muted-foreground">
                After saving your credentials, click the button below to authorize TradePilot with
                your Xero account.
              </p>

              <Button
                onClick={() => onConnect(clientId)}
                disabled={!clientId || !clientSecret}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Connect to Xero
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>

              {(!clientId || !clientSecret) && (
                <p className="text-sm text-orange-600 dark:text-orange-400">
                  Please save your Client ID and Client Secret first
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>Got it, thanks!</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
