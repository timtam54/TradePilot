'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Save,
  Edit3,
  AlertCircle,
  CheckCircle,
  Loader2,
  Plus,
  ExternalLink,
  HelpCircle,
  Eye,
  EyeOff,
  Trash2,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth/context';
import { useToast } from '@/lib/hooks/use-toast';
import { XeroToken, DEFAULT_XERO_SCOPE } from '@/lib/types/xero';
import XeroHelpPopup from './xero-help-popup';

export default function XeroSettingsPage() {
  const { user, profile, handleUnauthorized } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [token, setToken] = useState<XeroToken | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isNewToken, setIsNewToken] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [formData, setFormData] = useState({
    client_id: '',
    client_secret: '',
  });

  const appUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Check for success/error from OAuth callback
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'true') {
      toast({ title: 'Success', description: 'Connected to Xero successfully!' });
      fetchToken();
    } else if (error) {
      const errorMessages: Record<string, string> = {
        missing_params: 'Missing OAuth parameters',
        invalid_state: 'Invalid OAuth state',
        token_not_found: 'Xero configuration not found',
        token_exchange_failed: 'Failed to exchange token with Xero',
        update_failed: 'Failed to save Xero connection',
        unknown: 'An unknown error occurred',
      };
      toast({
        title: 'Error',
        description: errorMessages[error] || error,
        variant: 'destructive',
      });
    }
  }, [searchParams, toast]);

  useEffect(() => {
    if (user && profile) {
      fetchToken();
    }
  }, [user, profile]);

  const fetchToken = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/xero/token', {
        headers: {
          Authorization: `Bearer ${user.access_token}`,
          'X-Auth-Provider': user.provider,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          setToken(data.token);
          setFormData({
            client_id: data.token.client_id || '',
            client_secret: data.token.client_secret || '',
          });
          setIsNewToken(false);
        } else {
          createNewToken();
        }
      } else if (response.status === 401) {
        handleUnauthorized();
      } else {
        createNewToken();
      }
    } catch (error) {
      console.error('Error fetching token:', error);
      createNewToken();
    } finally {
      setIsLoading(false);
    }
  };

  const createNewToken = () => {
    if (!profile) return;

    const newToken: XeroToken = {
      user_id: profile.id,
      client_id: null,
      client_secret: null,
      access_token: null,
      refresh_token: null,
      scope: DEFAULT_XERO_SCOPE,
      expires_at: null,
      tenant_id: null,
      tenant_name: null,
      tenant_type: null,
    };
    setToken(newToken);
    setFormData({ client_id: '', client_secret: '' });
    setIsNewToken(true);
    setIsEditing(true);
    setIsHelpOpen(true);
  };

  const handleSave = async () => {
    if (!token || !user) return;

    setIsSaving(true);
    try {
      const method = isNewToken ? 'POST' : 'PUT';
      const response = await fetch('/api/xero/token', {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.access_token}`,
          'X-Auth-Provider': user.provider,
        },
        body: JSON.stringify({
          client_id: formData.client_id.trim() || null,
          client_secret: formData.client_secret.trim() || null,
          scope: token.scope,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        toast({
          title: 'Success',
          description: isNewToken ? 'Xero credentials created' : 'Xero credentials updated',
        });
        setIsEditing(false);
        setIsNewToken(false);
      } else if (response.status === 401) {
        handleUnauthorized();
      } else {
        toast({ title: 'Error', description: 'Failed to save credentials', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save credentials', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;

    if (!confirm('Are you sure you want to delete this Xero integration? This will disconnect your Xero account.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('/api/xero/token', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user.access_token}`,
          'X-Auth-Provider': user.provider,
        },
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Xero integration deleted' });
        setToken(null);
        setFormData({ client_id: '', client_secret: '' });
        setIsNewToken(true);
        setIsEditing(true);
      } else if (response.status === 401) {
        handleUnauthorized();
      } else {
        toast({ title: 'Error', description: 'Failed to delete integration', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete integration', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleXeroConnect = (clientId: string | null) => {
    if (!profile) return;

    const cid = clientId || token?.client_id;
    const scopes = token?.scope || DEFAULT_XERO_SCOPE;

    if (!cid) {
      toast({
        title: 'Error',
        description: 'Please enter a Client ID before connecting to Xero',
        variant: 'destructive',
      });
      return;
    }

    const redirectUri = `${appUrl}/api/xero/callback`;

    // Encode user info in the state parameter
    const stateData = JSON.stringify({
      userId: profile.id,
      provider: user?.provider,
      providerId: user?.id,
    });
    const encodedState = btoa(stateData);

    const authUrl = `https://login.xero.com/identity/connect/authorize?client_id=${cid}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${encodeURIComponent(encodedState)}&scope=${encodeURIComponent(scopes)}`;

    window.open(authUrl, '_blank', 'width=600,height=700,scrollbars=yes,resizable=yes');
  };

  const saveCredentials = async (clientId: string, clientSecret: string): Promise<string> => {
    if (!user || !token) return 'Error: Not authenticated';

    try {
      setFormData({ client_id: clientId, client_secret: clientSecret });

      const method = isNewToken ? 'POST' : 'PUT';
      const response = await fetch('/api/xero/token', {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.access_token}`,
          'X-Auth-Provider': user.provider,
        },
        body: JSON.stringify({
          client_id: clientId.trim(),
          client_secret: clientSecret.trim(),
          scope: token.scope,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        setIsNewToken(false);
        return 'Xero credentials saved successfully!';
      } else {
        return 'Failed to save credentials';
      }
    } catch (error) {
      return `Error saving credentials: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Xero Integration</h1>
          <p className="text-muted-foreground">Connect TradePilot to your Xero account</p>
        </div>
        {!token?.client_id && (
          <Button onClick={createNewToken}>
            <Plus className="h-4 w-4 mr-2" />
            Set up Xero
          </Button>
        )}
      </div>

      <div className="max-w-2xl">
        {token ? (
          <div className="space-y-6">
            {/* Connection Status */}
            {token.access_token ? (
              <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-400">Connected to Xero</p>
                      <p className="text-sm text-green-700 dark:text-green-500">
                        {token.tenant_name || 'Organisation connected'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : token.client_id ? (
              <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-6 w-6 text-orange-600" />
                    <div>
                      <p className="font-medium text-orange-800 dark:text-orange-400">Action Required</p>
                      <p className="text-sm text-orange-700 dark:text-orange-500">
                        Click &quot;Connect to Xero&quot; to complete the integration
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* Tenant Info */}
            {token.tenant_id && (
              <Card>
                <CardHeader>
                  <CardTitle>Connected Organisation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Organisation</Label>
                      <p className="font-medium">{token.tenant_name || 'Not set'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Type</Label>
                      <p className="font-medium capitalize">{token.tenant_type || 'Not set'}</p>
                    </div>
                  </div>
                  {token.expires_at && (
                    <div>
                      <Label className="text-muted-foreground">Token Expires</Label>
                      <p className="font-medium">{new Date(token.expires_at).toLocaleString()}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Client Credentials */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle>Client Credentials</CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => setIsHelpOpen(true)}>
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </div>
                  {!isEditing && !isNewToken && token.client_id && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
                <CardDescription>Your Xero API credentials</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Client ID</Label>
                  {isEditing || isNewToken ? (
                    <Input
                      value={formData.client_id}
                      onChange={(e) => setFormData((p) => ({ ...p, client_id: e.target.value }))}
                      placeholder="Enter your Client ID"
                    />
                  ) : (
                    <p className="text-sm bg-muted p-2 rounded">{token.client_id || 'Not set'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Client Secret</Label>
                  {isEditing || isNewToken ? (
                    <div className="relative">
                      <Input
                        type={showSecret ? 'text' : 'password'}
                        value={formData.client_secret}
                        onChange={(e) => setFormData((p) => ({ ...p, client_secret: e.target.value }))}
                        placeholder="Enter your Client Secret"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
                      >
                        {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm bg-muted p-2 rounded">
                      {token.client_secret
                        ? `${token.client_secret.substring(0, 4)}${'*'.repeat(20)}${token.client_secret.slice(-4)}`
                        : 'Not set'}
                    </p>
                  )}
                </div>

                {(isEditing || isNewToken) && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleSave}
                      disabled={isSaving || !formData.client_id.trim() || !formData.client_secret.trim()}
                    >
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      Save
                    </Button>
                    {!isNewToken && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({
                            client_id: token.client_id || '',
                            client_secret: token.client_secret || '',
                          });
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Connect Button */}
            {token.client_secret && (
              <Card>
                <CardHeader>
                  <CardTitle>Xero Authorisation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => handleXeroConnect(formData.client_id.trim())}
                      disabled={!formData.client_id.trim() && !token.client_id}
                      className={token.access_token ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      {token.access_token ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Reconnect to Xero
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Connect to Xero
                        </>
                      )}
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>

                    <Button variant="outline" asChild>
                      <a
                        href="https://apps.xero.com/connections"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Manage Connections
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No Xero integration configured</p>
              <Button onClick={createNewToken}>
                <Plus className="h-4 w-4 mr-2" />
                Set up Xero Integration
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Help Popup */}
      <XeroHelpPopup
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        clientId={formData.client_id}
        clientSecret={formData.client_secret}
        onSave={saveCredentials}
        onConnect={handleXeroConnect}
        appUrl={appUrl}
      />
    </div>
  );
}
