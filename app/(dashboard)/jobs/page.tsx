'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, MoreHorizontal, Calendar, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/lib/auth/context';
import { Job, JobStatus } from '@/lib/types';
import { formatDate, getStatusColor } from '@/lib/utils';
import { useToast } from '@/lib/hooks/use-toast';

const statusOptions: { value: JobStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'quote', label: 'Quote' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'invoiced', label: 'Invoiced' },
  { value: 'paid', label: 'Paid' },
];

export default function JobsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchJobs = async () => {
    if (!user) return;

    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);

      const response = await fetch(`/api/jobs?${params}`, {
        headers: {
          Authorization: `Bearer ${user.access_token}`,
          'X-Auth-Provider': user.provider,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load jobs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [user, search, statusFilter]);

  const deleteJob = async (jobId: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to delete this job?')) return;

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user.access_token}`,
          'X-Auth-Provider': user.provider,
        },
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Job deleted' });
        fetchJobs();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete job',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Jobs</h1>
          <p className="text-muted-foreground">Manage your jobs and work orders</p>
        </div>
        <Button asChild>
          <Link href="/jobs/new">
            <Plus className="mr-2 h-4 w-4" />
            New Job
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search jobs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
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
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No jobs found</p>
              <Button asChild className="mt-4">
                <Link href="/jobs/new">Create your first job</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-start justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="font-medium hover:underline"
                      >
                        {job.title}
                      </Link>
                      <Badge className={getStatusColor(job.status)}>
                        {job.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    {job.customer && (
                      <p className="text-sm text-muted-foreground">
                        {job.customer.name}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {job.scheduled_start && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(job.scheduled_start)}
                        </div>
                      )}
                      {job.address && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {job.address}
                        </div>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/jobs/${job.id}`}>View</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/jobs/${job.id}/edit`}>Edit</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => deleteJob(job.id)}
                        className="text-destructive"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
