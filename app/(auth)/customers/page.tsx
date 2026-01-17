'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Phone, Mail, MapPin, MoreHorizontal, UserCheck, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/lib/auth/context';
import { Customer } from '@/lib/types';
import { formatCurrency, formatDate, daysSince } from '@/lib/utils';
import { useToast } from '@/lib/hooks/use-toast';

export default function CustomersPage() {
  const { user, handleUnauthorized } = useAuth();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [syncing, setSyncing] = useState(false);

  const fetchCustomers = async () => {
    if (!user) return;

    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);

      const response = await fetch(`/api/customers?${params}`, {
        headers: {
          Authorization: `Bearer ${user.access_token}`,
          'X-Auth-Provider': user.provider,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers);
      } else if (response.status === 401) {
        handleUnauthorized();
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load customers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [user, search]);

  const markAsContacted = async (customerId: string) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/customers/${customerId}/mark-contacted`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.access_token}`,
          'X-Auth-Provider': user.provider,
        },
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Customer marked as contacted',
        });
        fetchCustomers();
      } else if (response.status === 401) {
        handleUnauthorized();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update customer',
        variant: 'destructive',
      });
    }
  };

  const deleteCustomer = async (customerId: string) => {
    if (!user) return;

    if (!confirm('Are you sure you want to delete this customer?')) return;

    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user.access_token}`,
          'X-Auth-Provider': user.provider,
        },
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Customer deleted',
        });
        fetchCustomers();
      } else if (response.status === 401) {
        handleUnauthorized();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete customer',
        variant: 'destructive',
      });
    }
  };

  const syncFromXero = async () => {
    if (!user) return;

    setSyncing(true);
    try {
      const response = await fetch('/api/customers/sync-xero', {
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
        fetchCustomers();
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

  const needsFollowUp = (customer: Customer) => {
    if (!customer.last_contacted_at) return true;
    if (customer.follow_up_date && new Date(customer.follow_up_date) <= new Date()) return true;
    return daysSince(customer.last_contacted_at) > 30;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-muted-foreground">Manage your customer database</p>
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
          <Button asChild>
            <Link href="/customers/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No customers found</p>
              <Button asChild className="mt-4">
                <Link href="/customers/new">Add your first customer</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Jobs</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Last Contact</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/customers/${customer.id}`}
                            className="font-medium hover:underline"
                          >
                            {customer.name}
                          </Link>
                          {customer.xero_contact_id && (
                            <div className="h-4 w-4 rounded bg-[#13B5EA] flex items-center justify-center" title="Synced from Xero">
                              <svg viewBox="0 0 24 24" className="h-3 w-3 text-white" fill="currentColor">
                                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 14.833l-1.953 1.953c-.195.195-.512.195-.707 0l-3.181-3.181-3.181 3.181c-.195.195-.512.195-.707 0l-1.953-1.953c-.195-.195-.195-.512 0-.707l3.181-3.181-3.181-3.181c-.195-.195-.195-.512 0-.707l1.953-1.953c.195-.195.512-.195.707 0l3.181 3.181 3.181-3.181c.195-.195.512-.195.707 0l1.953 1.953c.195.195.195.512 0 .707l-3.181 3.181 3.181 3.181c.195.195.195.512 0 .707z"/>
                              </svg>
                            </div>
                          )}
                          {needsFollowUp(customer) && (
                            <Badge variant="warning">
                              Follow up
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {customer.phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              {customer.phone}
                            </div>
                          )}
                          {customer.email && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {customer.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{customer.jobs_count || 0}</TableCell>
                      <TableCell>{formatCurrency(customer.total_revenue || 0)}</TableCell>
                      <TableCell>
                        {customer.last_contacted_at
                          ? formatDate(customer.last_contacted_at)
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/customers/${customer.id}`}>View</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/customers/${customer.id}/edit`}>Edit</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => markAsContacted(customer.id)}>
                              <UserCheck className="mr-2 h-4 w-4" />
                              Mark Contacted
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => deleteCustomer(customer.id)}
                              className="text-destructive"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
