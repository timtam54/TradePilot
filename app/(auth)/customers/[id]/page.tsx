'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Briefcase,
  UserCheck,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/lib/auth/context';
import { Customer, Job } from '@/lib/types';
import { formatCurrency, formatDate, daysSince } from '@/lib/utils';
import { useToast } from '@/lib/hooks/use-toast';

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, handleUnauthorized } = useAuth();
  const { toast } = useToast();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!user) return;

      try {
        const response = await fetch(`/api/customers/${id}`, {
          headers: {
            Authorization: `Bearer ${user.access_token}`,
            'X-Auth-Provider': user.provider,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCustomer(data.customer);
        } else if (response.status === 401) {
          handleUnauthorized();
        } else {
          toast({
            title: 'Error',
            description: 'Customer not found',
            variant: 'destructive',
          });
          router.push('/customers');
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load customer',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [id, user, router, toast]);

  const markAsContacted = async () => {
    if (!user || !customer) return;

    try {
      const response = await fetch(`/api/customers/${id}/mark-contacted`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.access_token}`,
          'X-Auth-Provider': user.provider,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCustomer(data.customer);
        toast({
          title: 'Success',
          description: 'Customer marked as contacted',
        });
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

  const deleteCustomer = async () => {
    if (!user || !customer) return;

    if (!confirm('Are you sure you want to delete this customer? This cannot be undone.')) return;

    try {
      const response = await fetch(`/api/customers/${id}`, {
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
        router.push('/customers');
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

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!customer) return null;

  const needsFollowUp =
    !customer.last_contacted_at ||
    (customer.follow_up_date && new Date(customer.follow_up_date) <= new Date()) ||
    daysSince(customer.last_contacted_at) > 30;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/customers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{customer.name}</h1>
            {needsFollowUp && <Badge variant="warning">Follow up needed</Badge>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={markAsContacted}>
            <UserCheck className="mr-2 h-4 w-4" />
            Mark Contacted
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/customers/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button variant="destructive" onClick={deleteCustomer}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {customer.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <a href={`tel:${customer.phone}`} className="hover:underline">
                  {customer.phone}
                </a>
              </div>
            )}
            {customer.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <a href={`mailto:${customer.email}`} className="hover:underline">
                  {customer.email}
                </a>
              </div>
            )}
            {customer.address && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <span>{customer.address}</span>
              </div>
            )}

            {customer.notes && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Notes</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">{customer.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  <span>Total Jobs</span>
                </div>
                <span className="font-semibold">{customer.jobs_count || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>Total Revenue</span>
                </div>
                <span className="font-semibold">{formatCurrency(customer.total_revenue || 0)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Last Contact</span>
                </div>
                <span className="text-sm">
                  {customer.last_contacted_at
                    ? formatDate(customer.last_contacted_at)
                    : 'Never'}
                </span>
              </div>
              {customer.follow_up_date && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Follow-up</span>
                  <span className="text-sm">{formatDate(customer.follow_up_date)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" asChild>
                <Link href={`/jobs/new?customer=${id}`}>Create Job</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/invoices/new?customer=${id}`}>Create Invoice</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
