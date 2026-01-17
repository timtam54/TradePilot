'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sparkles,
  Clock,
  CloudSun,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { AIJobInsights } from '@/lib/types';
import { cn } from '@/lib/utils';

interface AIInsightsPanelProps {
  jobId: string;
  className?: string;
}

export function AIInsightsPanel({ jobId, className }: AIInsightsPanelProps) {
  const { user } = useAuth();
  const [insights, setInsights] = useState<AIJobInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const fetchInsights = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.access_token}`,
          'X-Auth-Provider': user.provider,
        },
        body: JSON.stringify({ jobId }),
      });

      const data = await response.json();
      if (response.ok) {
        setInsights(data);
      } else {
        setError(data.error || `HTTP ${response.status}: Failed to load insights`);
      }
    } catch (err) {
      setError(`Connection error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [jobId, user]);

  const getWeatherRiskColor = (score: number) => {
    if (score <= 30) return 'text-green-600 bg-green-100';
    if (score <= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-blue-100 text-blue-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'high':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">{error}</p>
          <Button size="sm" variant="outline" onClick={fetchInsights}>
            <RefreshCw className="mr-2 h-3 w-3" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!insights) return null;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Insights
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={fetchInsights}>
              <RefreshCw className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Summary */}
          <p className="text-sm text-muted-foreground">{insights.summary}</p>

          {/* Best Arrival Time */}
          {insights.best_arrival_time && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-700">
                    Best arrival: {insights.best_arrival_time}
                  </p>
                  <p className="text-sm text-green-600">{insights.arrival_reasoning}</p>
                </div>
              </div>
            </div>
          )}

          {/* Estimated Hours */}
          {insights.estimated_hours && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Estimated Duration</span>
              </div>
              <div className="text-right">
                <span className="font-medium">{insights.estimated_hours}h</span>
                <p className="text-xs text-muted-foreground">{insights.hours_reasoning}</p>
              </div>
            </div>
          )}

          {/* Weather Risk */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <CloudSun className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Weather Risk</span>
            </div>
            <Badge className={getWeatherRiskColor(insights.weather_risk_score)}>
              {insights.weather_risk_score}%
            </Badge>
          </div>

          {/* Weather Factors */}
          {insights.weather_factors.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Weather Factors:</p>
              <div className="flex flex-wrap gap-1">
                {insights.weather_factors.map((factor, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {factor}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Risks */}
          {insights.risks.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Potential Risks
              </p>
              <div className="space-y-1">
                {insights.risks.map((risk, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{risk.title}</span>
                    <Badge className={cn('text-xs', getSeverityColor(risk.severity))}>
                      {risk.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {insights.suggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <Lightbulb className="h-3 w-3" />
                Suggestions
              </p>
              <ul className="space-y-1">
                {insights.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
