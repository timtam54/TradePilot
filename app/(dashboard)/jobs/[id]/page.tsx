'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  Package,
  Wrench,
  Trash2,
  Plus,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/lib/auth/context';
import { Job, JobStatus, JobMaterial, JobLabour } from '@/lib/types';
import { formatCurrency, formatDate, formatDateTime, getStatusColor, formatDuration } from '@/lib/utils';
import { useToast } from '@/lib/hooks/use-toast';
import { AddMaterialDialog } from '@/components/jobs/add-material-dialog';
import { AddLabourDialog } from '@/components/jobs/add-labour-dialog';

const statusOptions: { value: JobStatus; label: string }[] = [
  { value: 'quote', label: 'Quote' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'invoiced', label: 'Invoiced' },
  { value: 'paid', label: 'Paid' },
];

interface JobWithTotals extends Job {
  totals?: {
    materials: number;
    labour: number;
    total: number;
  };
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [job, setJob] = useState<JobWithTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [labourDialogOpen, setLabourDialogOpen] = useState(false);

  const fetchJob = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/jobs/${id}`, {
        headers: {
          Authorization: `Bearer ${user.access_token}`,
          'X-Auth-Provider': user.provider,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setJob(data.job);
      } else {
        toast({
          title: 'Error',
          description: 'Job not found',
          variant: 'destructive',
        });
        router.push('/jobs');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load job',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
  }, [id, user]);

  const updateStatus = async (status: JobStatus) => {
    if (!user || !job) return;

    try {
      const response = await fetch(`/api/jobs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.access_token}`,
          'X-Auth-Provider': user.provider,
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setJob((prev) => prev ? { ...prev, status } : null);
        toast({ title: 'Success', description: 'Status updated' });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const deleteJob = async () => {
    if (!user || !job) return;
    if (!confirm('Are you sure you want to delete this job? This cannot be undone.')) return;

    try {
      const response = await fetch(`/api/jobs/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user.access_token}`,
          'X-Auth-Provider': user.provider,
        },
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Job deleted' });
        router.push('/jobs');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete job',
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

  if (!job) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/jobs">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{job.title}</h1>
            {job.customer && (
              <Link
                href={`/customers/${job.customer.id}`}
                className="text-muted-foreground hover:underline"
              >
                {job.customer.name}
              </Link>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={job.status} onValueChange={updateStatus}>
            <SelectTrigger className="w-[140px]">
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
          <Button variant="outline" asChild>
            <Link href={`/jobs/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button variant="destructive" onClick={deleteJob}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Job Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Job Details</CardTitle>
                <Badge className={getStatusColor(job.status)}>
                  {job.status.replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {job.description && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                  <p className="mt-1">{job.description}</p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                {job.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm font-medium">Address</p>
                      <p className="text-sm text-muted-foreground">{job.address}</p>
                    </div>
                  </div>
                )}

                {job.scheduled_start && (
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm font-medium">Scheduled</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(job.scheduled_start)}
                      </p>
                    </div>
                  </div>
                )}

                {job.estimated_hours && (
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm font-medium">Estimated Time</p>
                      <p className="text-sm text-muted-foreground">
                        {job.estimated_hours} hours
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm font-medium">Labour Rate</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(job.labour_rate)}/hr
                    </p>
                  </div>
                </div>
              </div>

              {job.notes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Notes</h4>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{job.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Materials & Labour Tabs */}
          <Card>
            <Tabs defaultValue="materials">
              <CardHeader>
                <TabsList>
                  <TabsTrigger value="materials">
                    <Package className="mr-2 h-4 w-4" />
                    Materials
                  </TabsTrigger>
                  <TabsTrigger value="labour">
                    <Wrench className="mr-2 h-4 w-4" />
                    Labour
                  </TabsTrigger>
                  <TabsTrigger value="time">
                    <Clock className="mr-2 h-4 w-4" />
                    Time
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent>
                <TabsContent value="materials" className="mt-0">
                  <div className="flex justify-end mb-4">
                    <Button size="sm" onClick={() => setMaterialDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Material
                    </Button>
                  </div>
                  {job.materials && job.materials.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Material</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {job.materials.map((material) => (
                          <TableRow key={material.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{material.name}</p>
                                {material.supplier && (
                                  <p className="text-sm text-muted-foreground">
                                    {material.supplier}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {material.qty} {material.unit}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(material.sell_price)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(material.line_total)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">
                      No materials added yet
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="labour" className="mt-0">
                  <div className="flex justify-end mb-4">
                    <Button size="sm" onClick={() => setLabourDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Labour
                    </Button>
                  </div>
                  {job.labour && job.labour.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead>Hours</TableHead>
                          <TableHead className="text-right">Rate</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {job.labour.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell>{entry.description}</TableCell>
                            <TableCell>{entry.hours}h</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(entry.rate)}/hr
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(entry.total)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">
                      No labour entries yet
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="time" className="mt-0">
                  {job.time_entries && job.time_entries.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Start</TableHead>
                          <TableHead>End</TableHead>
                          <TableHead className="text-right">Duration</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {job.time_entries.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell>
                              <Badge variant="outline">{entry.type}</Badge>
                            </TableCell>
                            <TableCell>{formatDateTime(entry.start_time)}</TableCell>
                            <TableCell>
                              {entry.end_time ? formatDateTime(entry.end_time) : 'In progress'}
                            </TableCell>
                            <TableCell className="text-right">
                              {entry.duration_minutes
                                ? formatDuration(entry.duration_minutes)
                                : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">
                      No time entries yet
                    </p>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Totals Card */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Materials</span>
                <span className="font-medium">
                  {formatCurrency(job.totals?.materials || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Labour</span>
                <span className="font-medium">
                  {formatCurrency(job.totals?.labour || 0)}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="font-medium">Total</span>
                <span className="text-xl font-bold">
                  {formatCurrency(job.totals?.total || 0)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" asChild>
                <Link href={`/invoices/new?job=${id}`}>Create Invoice</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/chat">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Get AI Insights
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <AddMaterialDialog
        open={materialDialogOpen}
        onOpenChange={setMaterialDialogOpen}
        jobId={id}
        onSuccess={fetchJob}
      />

      <AddLabourDialog
        open={labourDialogOpen}
        onOpenChange={setLabourDialogOpen}
        jobId={id}
        labourRate={job.labour_rate}
        onSuccess={fetchJob}
      />
    </div>
  );
}
