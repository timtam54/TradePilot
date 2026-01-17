'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, FileText, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/lib/auth/context';
import { Invoice, InvoiceStatus } from '@/lib/types';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { useToast } from '@/lib/hooks/use-toast';

interface Quote {
  id: string;
  quote_number: string;
  xero_quote_id: string;
  title: string;
  status: string;
  customer_name: string | null;
  subtotal: number;
  tax: number;
  total: number;
  created_at: string;
}

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
];

export default function InvoicesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [quotesLoading, setQuotesLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('invoices');

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!user) return;
      try {
        const params = new URLSearchParams();
        if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);

        const response = await fetch(`/api/invoices?${params}`, {
          headers: {
            Authorization: `Bearer ${user.access_token}`,
            'X-Auth-Provider': user.provider,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setInvoices(data.invoices);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [user, statusFilter]);

  useEffect(() => {
    const fetchQuotes = async () => {
      if (!user) return;
      try {
        const response = await fetch('/api/quotes', {
          headers: {
            Authorization: `Bearer ${user.access_token}`,
            'X-Auth-Provider': user.provider,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setQuotes(data.quotes);
        }
      } catch (error) {
        console.error('Error fetching quotes:', error);
      } finally {
        setQuotesLoading(false);
      }
    };

    fetchQuotes();
  }, [user]);

  const getQuoteStatusBadge = (status: string) => {
    switch (status) {
      case 'quote':
        return <Badge variant="secondary">Quote</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-500">Scheduled</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-500">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'invoiced':
        return <Badge className="bg-purple-500">Invoiced</Badge>;
      case 'paid':
        return <Badge className="bg-emerald-500">Paid</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoices & Quotes</h1>
          <p className="text-muted-foreground">Manage your invoices and quotes</p>
        </div>
        <Button asChild>
          <Link href="/invoices/new">
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Link>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="invoices" className="gap-2">
            <FileText className="h-4 w-4" />
            Invoices
            {invoices.length > 0 && (
              <Badge variant="secondary" className="ml-1">{invoices.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="quotes" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Quotes
            {quotes.length > 0 && (
              <Badge variant="secondary" className="ml-1">{quotes.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
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
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : invoices.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">No invoices yet</p>
                  <Button asChild className="mt-4"><Link href="/invoices/new">Create Invoice</Link></Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <Link href={`/invoices/${invoice.id}`} className="font-medium hover:underline">
                            {invoice.invoice_number}
                          </Link>
                        </TableCell>
                        <TableCell>{invoice.customer_name || '-'}</TableCell>
                        <TableCell>{formatDate(invoice.created_at)}</TableCell>
                        <TableCell>{invoice.due_date ? formatDate(invoice.due_date) : '-'}</TableCell>
                        <TableCell className="text-right">{formatCurrency(invoice.total)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quotes">
          <Card>
            <CardContent className="pt-6">
              {quotesLoading ? (
                <div className="space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
              ) : quotes.length === 0 ? (
                <div className="text-center py-12">
                  <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">No quotes yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Create a quote from a job in the "quote" stage
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quote #</TableHead>
                      <TableHead>Job</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Job Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotes.map((quote) => (
                      <TableRow key={quote.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{quote.quote_number}</span>
                            <div className="h-4 w-4 rounded bg-[#13B5EA] flex items-center justify-center" title="Xero Quote">
                              <svg viewBox="0 0 24 24" className="h-3 w-3 text-white" fill="currentColor">
                                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 14.833l-1.953 1.953c-.195.195-.512.195-.707 0l-3.181-3.181-3.181 3.181c-.195.195-.512.195-.707 0l-1.953-1.953c-.195-.195-.195-.512 0-.707l3.181-3.181-3.181-3.181c-.195-.195-.195-.512 0-.707l1.953-1.953c.195-.195.512-.195.707 0l3.181 3.181 3.181-3.181c.195-.195.512-.195.707 0l1.953 1.953c.195.195.195.512 0 .707l-3.181 3.181 3.181 3.181c.195.195.195.512 0 .707z"/>
                              </svg>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link href={`/jobs/${quote.id}`} className="hover:underline">
                            {quote.title}
                          </Link>
                        </TableCell>
                        <TableCell>{quote.customer_name || 'Cash Sales'}</TableCell>
                        <TableCell>{formatDate(quote.created_at)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(quote.total)}</TableCell>
                        <TableCell>
                          {getQuoteStatusBadge(quote.status)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
