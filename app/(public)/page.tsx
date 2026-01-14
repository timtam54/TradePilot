'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Wrench,
  Calendar,
  FileText,
  Users,
  Package,
  Cloud,
  Smartphone,
  Zap,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Clock,
  DollarSign,
} from 'lucide-react';

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is logged in without initializing full auth
    const storedUser = localStorage.getItem('tradepilot_user');
    setIsAuthenticated(!!storedUser);
  }, []);

  const features = [
    {
      icon: Wrench,
      title: 'Job Management',
      description: 'Track jobs from quote to completion. Manage materials, labour, and customer details in one place.',
    },
    {
      icon: Calendar,
      title: 'Smart Scheduling',
      description: 'Visual calendar with weather forecasts. Plan your work around the weather and never miss a job.',
    },
    {
      icon: FileText,
      title: 'Quotes & Invoices',
      description: 'Create professional quotes and invoices in seconds. Send directly to customers via email.',
    },
    {
      icon: Users,
      title: 'Customer Management',
      description: 'Keep track of all your customers, their job history, and follow-up reminders.',
    },
    {
      icon: Package,
      title: 'Materials Tracking',
      description: 'Track materials used on each job. Know your costs and maintain supplier relationships.',
    },
    {
      icon: Cloud,
      title: 'Xero Integration',
      description: 'Sync invoices and contacts with Xero. Keep your accounting up to date automatically.',
    },
  ];

  const benefits = [
    { icon: Clock, text: 'Save 5+ hours per week on admin' },
    { icon: DollarSign, text: 'Never miss billing for materials' },
    { icon: BarChart3, text: 'Track profitability per job' },
    { icon: Smartphone, text: 'Access from any device' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Wrench className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">TradePilot</span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Button asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/login">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            Built for Australian Tradies
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Job Management
            <br />
            <span className="text-primary">Made Simple</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            The all-in-one platform for electricians, plumbers, builders, and trades professionals.
            Manage jobs, create quotes, track materials, and get paid faster.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/auth/login">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#features">See Features</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Bar */}
      <section className="border-y bg-muted/30 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 justify-center">
                <benefit.icon className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{benefit.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From the first customer call to the final invoice, TradePilot has you covered.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-xl border bg-card hover:shadow-lg transition-shadow"
              >
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trades Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for Every Trade</h2>
            <p className="text-lg text-muted-foreground">
              Pre-configured rates and settings for your specific trade
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              'Electricians',
              'Plumbers',
              'Builders',
              'Carpenters',
              'HVAC Technicians',
              'Painters',
              'Roofers',
              'Landscapers',
              'Tilers',
              'Concreters',
            ].map((trade) => (
              <div
                key={trade}
                className="px-4 py-2 rounded-full bg-background border text-sm font-medium"
              >
                {trade}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-primary rounded-2xl p-8 md:p-12 text-center text-primary-foreground">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Streamline Your Business?
            </h2>
            <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
              Join thousands of tradies who are saving time and making more money with TradePilot.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/auth/login">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
            <div className="flex items-center justify-center gap-6 mt-8 text-sm opacity-90">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                14-day free trial
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Wrench className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold">TradePilot</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} TradePilot. Built for Australian Tradies.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
