'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Users,
  Clock,
  DollarSign,
  Plus,
  ArrowRight,
  CalendarDays,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth/context';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { DashboardMetrics, Job, Customer } from '@/lib/types';

export default function DashboardPage() {
  const { profile } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [todaysJobs, setTodaysJobs] = useState<Job[]>([]);
  const [followUps, setFollowUps] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for now - will be replaced with API calls
    const loadData = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));

      setMetrics({
        active_jobs: 5,
        completed_this_month: 12,
        hours_this_week: 32,
        revenue_this_month: 8450,
      });

      setRecentJobs([
        {
          id: '1',
          user_id: '1',
          title: 'Kitchen Renovation - Electrical',
          status: 'in_progress',
          customer: { id: '1', user_id: '1', name: 'John Smith', created_at: '', updated_at: '' },
          scheduled_start: new Date().toISOString(),
          labour_rate: 95,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          user_id: '1',
          title: 'Hot Water System Replacement',
          status: 'scheduled',
          customer: { id: '2', user_id: '1', name: 'Sarah Johnson', created_at: '', updated_at: '' },
          scheduled_start: new Date(Date.now() + 86400000).toISOString(),
          labour_rate: 90,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '3',
          user_id: '1',
          title: 'Switchboard Upgrade',
          status: 'quote',
          customer: { id: '3', user_id: '1', name: 'Mike Davis', created_at: '', updated_at: '' },
          labour_rate: 95,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      setTodaysJobs([
        {
          id: '1',
          user_id: '1',
          title: 'Kitchen Renovation - Electrical',
          status: 'in_progress',
          address: '123 Main St, Sydney',
          scheduled_start: new Date().toISOString(),
          labour_rate: 95,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      setFollowUps([
        {
          id: '1',
          user_id: '1',
          name: 'Robert Wilson',
          phone: '0412 345 678',
          last_contacted_at: new Date(Date.now() - 15 * 86400000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          user_id: '1',
          name: 'Emma Brown',
          email: 'emma@example.com',
          follow_up_date: new Date(Date.now() - 2 * 86400000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      setLoading(false);
    };

    loadData();
  }, []);

  const MetricCard = ({
    title,
    value,
    icon: Icon,
    description,
  }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    description?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/jobs/new">
            <Plus className="mr-2 h-4 w-4" />
            New Job
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/customers/new">
            <Users className="mr-2 h-4 w-4" />
            Add Customer
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/invoices/new">
            <DollarSign className="mr-2 h-4 w-4" />
            Create Invoice
          </Link>
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Active Jobs"
          value={metrics?.active_jobs ?? '-'}
          icon={Briefcase}
          description="Jobs in progress"
        />
        <MetricCard
          title="Completed This Month"
          value={metrics?.completed_this_month ?? '-'}
          icon={CalendarDays}
          description="Jobs finished"
        />
        <MetricCard
          title="Hours This Week"
          value={metrics?.hours_this_week ?? '-'}
          icon={Clock}
          description="Time tracked"
        />
        <MetricCard
          title="Revenue This Month"
          value={metrics ? formatCurrency(metrics.revenue_this_month) : '-'}
          icon={DollarSign}
          description="From invoices"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Today&apos;s Schedule
            </CardTitle>
            <CardDescription>
              {todaysJobs.length} job{todaysJobs.length !== 1 ? 's' : ''} scheduled
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : todaysJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No jobs scheduled for today</p>
            ) : (
              <div className="space-y-3">
                {todaysJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="block rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{job.title}</p>
                        <p className="text-sm text-muted-foreground">{job.address}</p>
                      </div>
                      <Badge className={getStatusColor(job.status)}>{job.status.replace('_', ' ')}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Jobs</CardTitle>
              <CardDescription>Your latest jobs</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/jobs">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              <div className="space-y-3">
                {recentJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="block rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{job.title}</p>
                        <p className="text-sm text-muted-foreground">{job.customer?.name}</p>
                      </div>
                      <Badge className={getStatusColor(job.status)}>{job.status.replace('_', ' ')}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Follow-ups */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Follow-ups Needed</CardTitle>
              <CardDescription>Customers to contact</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/customers">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : followUps.length === 0 ? (
              <p className="text-sm text-muted-foreground">No follow-ups needed</p>
            ) : (
              <div className="space-y-3">
                {followUps.map((customer) => (
                  <Link
                    key={customer.id}
                    href={`/customers/${customer.id}`}
                    className="block rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {customer.phone || customer.email}
                        </p>
                      </div>
                      <Badge variant="warning">Follow up</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Insights
            </CardTitle>
            <CardDescription>Personalized tips for your business</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-sm">
                    Based on your recent jobs, consider reaching out to customers who had
                    electrical work done in the last 6 months for switchboard safety checks.
                  </p>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/chat">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Chat with AI Assistant
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
