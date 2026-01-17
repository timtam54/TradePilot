import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const InsightsSchema = z.object({
  summary: z.string(),
  estimated_hours: z.number().nullable(),
  hours_reasoning: z.string(),
  best_arrival_time: z.string().nullable(),
  arrival_reasoning: z.string(),
  weather_risk_score: z.number().min(0).max(100),
  weather_factors: z.array(z.string()),
  risks: z.array(
    z.object({
      title: z.string(),
      severity: z.enum(['low', 'medium', 'high']),
    })
  ),
  suggestions: z.array(z.string()),
});

async function getProfileFromAuth(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const provider = request.headers.get('X-Auth-Provider');

  if (!authHeader || !provider) return null;

  const token = authHeader.replace('Bearer ', '');
  let email: string | null = null;

  if (provider === 'google') {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      const data = await response.json();
      email = data.email;
    }
  } else if (provider === 'microsoft') {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      const data = await response.json();
      email = data.mail || data.userPrincipalName;
    }
  }

  if (!email) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single();

  return profile;
}

export async function POST(request: NextRequest) {
  try {
    const profile = await getProfileFromAuth(request);
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = await request.json();
    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
    }

    // Fetch job with customer
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select(`
        *,
        customers (*)
      `)
      .eq('id', jobId)
      .eq('user_id', profile.id)
      .single();

    if (jobError || !job) {
      console.error('Job fetch error:', jobError);
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Get weather data if we have coordinates and a scheduled date
    let weatherInfo = 'Weather data not available';
    if (job.latitude && job.longitude && job.scheduled_start) {
      try {
        const scheduledDate = new Date(job.scheduled_start);
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${job.latitude}&longitude=${job.longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&timezone=Australia%2FSydney`
        );
        if (weatherRes.ok) {
          const weatherData = await weatherRes.json();
          const dateStr = scheduledDate.toISOString().split('T')[0];
          const dayIndex = weatherData.daily.time.indexOf(dateStr);
          if (dayIndex >= 0) {
            weatherInfo = `
              Date: ${dateStr}
              Weather Code: ${weatherData.daily.weather_code[dayIndex]}
              Max Temp: ${weatherData.daily.temperature_2m_max[dayIndex]}°C
              Min Temp: ${weatherData.daily.temperature_2m_min[dayIndex]}°C
              Rain Probability: ${weatherData.daily.precipitation_probability_max[dayIndex]}%
              Max Wind: ${weatherData.daily.wind_speed_10m_max[dayIndex]} km/h
            `;
          }
        }
      } catch {
        // Weather fetch failed, continue without it
      }
    }

    // Get similar completed jobs for duration estimation
    const { data: similarJobs } = await supabase
      .from('jobs')
      .select('title, estimated_hours, actual_start, actual_end')
      .eq('user_id', profile.id)
      .eq('status', 'completed')
      .limit(5);

    const prompt = `You are TradePilot AI, an intelligent assistant for ${profile.trade || 'general'} tradespeople in Australia.

Analyse this job and provide insights:

JOB DETAILS:
- Title: ${job.title}
- Description: ${job.description || 'Not provided'}
- Address: ${job.address || 'Not provided'}
- Customer: ${job.customers?.name || 'Not specified'}
- Scheduled: ${job.scheduled_start ? new Date(job.scheduled_start).toLocaleString('en-AU') : 'Not scheduled'}
- Estimated Hours: ${job.estimated_hours || 'Not specified'}
- Status: ${job.status}

WEATHER FORECAST FOR JOB DATE:
${weatherInfo}

SIMILAR COMPLETED JOBS (for reference):
${similarJobs && similarJobs.length > 0 ? JSON.stringify(similarJobs, null, 2) : 'No similar jobs found'}

PROVIDE:
1. A brief summary of the job (1-2 sentences)
2. Estimated hours if not specified (based on similar jobs and job type)
3. Best arrival time recommendation (consider traffic, job type, weather)
4. Weather risk score (0-100, higher = more risk)
5. Weather factors that might affect the job
6. Potential risks (equipment, access, complexity, etc.)
7. Suggestions to make the job more efficient

For arrival time, consider:
- Outdoor work: avoid midday heat in summer, start early
- Indoor work: standard business hours usually fine
- Traffic: avoid peak hours (7-9am, 4-6pm)
- Customer availability

Be specific and practical for Australian conditions.`;

    const { object: insights } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: InsightsSchema,
      prompt,
    });

    return NextResponse.json(insights);
  } catch (error) {
    console.error('AI Insights error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to generate insights: ${errorMessage}` },
      { status: 500 }
    );
  }
}
