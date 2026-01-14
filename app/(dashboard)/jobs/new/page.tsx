'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/lib/auth/context';
import { Customer, JobStatus } from '@/lib/types';
import { useToast } from '@/lib/hooks/use-toast';

const statusOptions: { value: JobStatus; label: string }[] = [
  { value: 'quote', label: 'Quote' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
];

export default function NewJobPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [formData, setFormData] = useState({
    customer_id: searchParams.get('customer') || '',
    title: '',
    description: '',
    status: 'quote' as JobStatus,
    address: '',
    scheduled_start: '',
    scheduled_end: '',
    estimated_hours: '',
    labour_rate: '',
    notes: '',
  });

  useEffect(() => {
    const fetchCustomers = async () => {
      if (!user) return;

      try {
        const response = await fetch('/api/customers', {
          headers: {
            Authorization: `Bearer ${user.access_token}`,
            'X-Auth-Provider': user.provider,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCustomers(data.customers);
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    };

    fetchCustomers();
  }, [user]);

  useEffect(() => {
    if (profile?.default_labour_rate && !formData.labour_rate) {
      setFormData((prev) => ({ ...prev, labour_rate: String(profile.default_labour_rate) }));
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.access_token}`,
          'X-Auth-Provider': user.provider,
        },
        body: JSON.stringify({
          ...formData,
          customer_id: formData.customer_id || null,
          estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
          labour_rate: formData.labour_rate ? parseFloat(formData.labour_rate) : null,
          scheduled_start: formData.scheduled_start || null,
          scheduled_end: formData.scheduled_end || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Success',
          description: 'Job created successfully',
        });
        router.push(`/jobs/${data.job.id}`);
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to create job',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create job',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/jobs">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New Job</h1>
          <p className="text-muted-foreground">Create a new job or quote</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
          <CardDescription>Enter the job information below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Kitchen Renovation - Electrical"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer_id">Customer</Label>
                <Select
                  value={formData.customer_id || '__none__'}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, customer_id: value === '__none__' ? '' : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No customer</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: JobStatus) =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Job description and scope of work..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Job Address</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="123 Main St, Sydney NSW 2000"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="scheduled_start">Scheduled Start</Label>
                <Input
                  id="scheduled_start"
                  name="scheduled_start"
                  type="datetime-local"
                  value={formData.scheduled_start}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduled_end">Scheduled End</Label>
                <Input
                  id="scheduled_end"
                  name="scheduled_end"
                  type="datetime-local"
                  value={formData.scheduled_end}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="estimated_hours">Estimated Hours</Label>
                <Input
                  id="estimated_hours"
                  name="estimated_hours"
                  type="number"
                  step="0.5"
                  value={formData.estimated_hours}
                  onChange={handleChange}
                  placeholder="e.g., 4"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="labour_rate">Labour Rate ($/hr)</Label>
                <Input
                  id="labour_rate"
                  name="labour_rate"
                  type="number"
                  step="0.01"
                  value={formData.labour_rate}
                  onChange={handleChange}
                  placeholder={`Default: $${profile?.default_labour_rate || 75}`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Internal notes about this job..."
                rows={3}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Job'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
