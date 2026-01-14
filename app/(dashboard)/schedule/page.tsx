'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  CloudRain,
  Wind,
  Thermometer,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/lib/auth/context';
import { Job } from '@/lib/types';
import { formatTime, getStatusColor } from '@/lib/utils';
import {
  DailyWeather,
  fetchWeatherForecast,
  getUserLocation,
  getWeatherIcon,
  getWeatherDescription,
  isWeatherWarning,
} from '@/lib/weather';

export default function SchedulePage() {
  const { user, handleUnauthorized } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weatherData, setWeatherData] = useState<DailyWeather[]>([]);
  const [weatherLoading, setWeatherLoading] = useState(true);

  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    return date;
  });

  // Fetch weather data
  useEffect(() => {
    const loadWeather = async () => {
      setWeatherLoading(true);
      try {
        const location = await getUserLocation();
        const data = await fetchWeatherForecast(location.lat, location.lon);
        if (data) {
          setWeatherData(data.daily);
        }
      } catch (error) {
        console.error('Error loading weather:', error);
      } finally {
        setWeatherLoading(false);
      }
    };

    loadWeather();
  }, []);

  // Fetch jobs
  useEffect(() => {
    const fetchJobs = async () => {
      if (!user) return;
      try {
        const response = await fetch('/api/jobs', {
          headers: {
            Authorization: `Bearer ${user.access_token}`,
            'X-Auth-Provider': user.provider,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setJobs(data.jobs.filter((j: Job) => j.scheduled_start));
        } else if (response.status === 401) {
          handleUnauthorized();
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [user, handleUnauthorized]);

  const getJobsForDate = (date: Date) => {
    return jobs.filter((job) => {
      if (!job.scheduled_start) return false;
      const jobDate = new Date(job.scheduled_start);
      return (
        jobDate.getFullYear() === date.getFullYear() &&
        jobDate.getMonth() === date.getMonth() &&
        jobDate.getDate() === date.getDate()
      );
    });
  };

  const getWeatherForDate = (date: Date): DailyWeather | null => {
    const dateStr = date.toISOString().split('T')[0];
    return weatherData.find((w) => w.date === dateStr) || null;
  };

  const previousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const formatWeekRange = () => {
    const start = weekDays[0];
    const end = weekDays[6];
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('en-AU', options)} - ${end.toLocaleDateString('en-AU', options)}, ${end.getFullYear()}`;
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Schedule</h1>
            <p className="text-muted-foreground">View and manage your job schedule</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={previousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={nextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {formatWeekRange()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-7 gap-4">
                {[...Array(7)].map((_, i) => (
                  <Skeleton key={i} className="h-48" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-7">
                {weekDays.map((date) => {
                  const dayJobs = getJobsForDate(date);
                  const weather = getWeatherForDate(date);
                  const hasWeatherWarning = weather && isWeatherWarning(weather);

                  return (
                    <div
                      key={date.toISOString()}
                      className={`min-h-[200px] rounded-lg border p-3 ${
                        isToday(date) ? 'border-primary bg-primary/5' : ''
                      } ${hasWeatherWarning ? 'border-orange-500/50' : ''}`}
                    >
                      {/* Date Header */}
                      <div className="mb-2 text-center">
                        <p className="text-xs text-muted-foreground">
                          {date.toLocaleDateString('en-AU', { weekday: 'short' })}
                        </p>
                        <p className={`text-lg font-semibold ${isToday(date) ? 'text-primary' : ''}`}>
                          {date.getDate()}
                        </p>
                      </div>

                      {/* Weather Display */}
                      {weather && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={`mb-2 rounded-md p-2 text-center ${
                                hasWeatherWarning
                                  ? 'bg-orange-500/10 border border-orange-500/30'
                                  : 'bg-muted/50'
                              }`}
                            >
                              <div className="flex items-center justify-center gap-1">
                                <span className="text-lg">{getWeatherIcon(weather.weatherCode)}</span>
                                {hasWeatherWarning && (
                                  <AlertTriangle className="h-3 w-3 text-orange-500" />
                                )}
                              </div>
                              <div className="text-xs font-medium">
                                {weather.tempMax}° / {weather.tempMin}°
                              </div>
                              {weather.precipitationProbability > 0 && (
                                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                                  <CloudRain className="h-3 w-3" />
                                  {weather.precipitationProbability}%
                                </div>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[200px]">
                            <div className="space-y-1">
                              <p className="font-medium">{getWeatherDescription(weather.weatherCode)}</p>
                              <div className="flex items-center gap-2 text-xs">
                                <Thermometer className="h-3 w-3" />
                                <span>High: {weather.tempMax}°C / Low: {weather.tempMin}°C</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <CloudRain className="h-3 w-3" />
                                <span>Rain: {weather.precipitationProbability}% chance</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <Wind className="h-3 w-3" />
                                <span>Wind: {weather.windSpeed} km/h</span>
                              </div>
                              {hasWeatherWarning && (
                                <p className="text-orange-500 text-xs font-medium mt-1">
                                  Weather may affect outdoor work
                                </p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}

                      {weatherLoading && (
                        <div className="mb-2">
                          <Skeleton className="h-16 w-full" />
                        </div>
                      )}

                      {/* Jobs List */}
                      <div className="space-y-2">
                        {dayJobs.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-2">No jobs</p>
                        ) : (
                          dayJobs.map((job) => (
                            <Link
                              key={job.id}
                              href={`/jobs/${job.id}`}
                              className="block rounded-md bg-muted p-2 text-xs hover:bg-muted/80 transition-colors"
                            >
                              <p className="font-medium truncate">{job.title}</p>
                              {job.scheduled_start && (
                                <div className="flex items-center gap-1 text-muted-foreground mt-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTime(job.scheduled_start)}
                                </div>
                              )}
                              <div className="flex items-center gap-1 mt-1">
                                <Badge className={`${getStatusColor(job.status)} text-xs`}>
                                  {job.status.replace('_', ' ')}
                                </Badge>
                                {hasWeatherWarning && dayJobs.length > 0 && (
                                  <Badge variant="outline" className="text-orange-500 border-orange-500 text-xs">
                                    Weather
                                  </Badge>
                                )}
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weather Legend */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="font-medium">Weather Legend:</span>
              <div className="flex items-center gap-1">
                <span>☀️</span>
                <span className="text-muted-foreground">Clear</span>
              </div>
              <div className="flex items-center gap-1">
                <span>⛅</span>
                <span className="text-muted-foreground">Cloudy</span>
              </div>
              <div className="flex items-center gap-1">
                <span>🌧️</span>
                <span className="text-muted-foreground">Rain</span>
              </div>
              <div className="flex items-center gap-1">
                <span>⛈️</span>
                <span className="text-muted-foreground">Storm</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span className="text-muted-foreground">Weather warning</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
