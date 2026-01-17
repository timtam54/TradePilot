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

const SuggestedLabourSchema = z.object({
  tasks: z.array(
    z.object({
      description: z.string(),
      hours: z.number(),
      reason: z.string(),
    })
  ),
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
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const profile = await getProfileFromAuth(request);
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized - please sign in again' }, { status: 401 });
    }

    const body = await request.json();
    const { jobId } = body;
    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
    }

    // Fetch job with existing labour entries
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select(`
        *,
        customers (*),
        job_labour (*),
        job_materials (*)
      `)
      .eq('id', jobId)
      .eq('user_id', profile.id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const existingLabour = (job.job_labour || []).map((l: { description: string; hours: number }) =>
      `${l.description} (${l.hours}h)`
    ).join(', ');

    const existingMaterials = (job.job_materials || []).map((m: { name: string; qty: number; unit: string }) =>
      `${m.name} (${m.qty} ${m.unit})`
    ).join(', ');

    const prompt = `You are an AI assistant for a ${profile.trade || 'general'} tradesperson in Australia.

Based on the job details, suggest labour tasks with realistic time estimates. Break down the work into logical, billable tasks.

JOB DETAILS:
- Title: ${job.title}
- Description: ${job.description || 'Not provided'}
- Address: ${job.address || 'Not provided'}
- Trade: ${profile.trade || 'general'}
- Estimated Total Hours: ${job.estimated_hours || 'Not specified'}

MATERIALS BEING USED:
${existingMaterials || 'None specified yet'}

EXISTING LABOUR ENTRIES ALREADY ADDED:
${existingLabour || 'None yet'}

INSTRUCTIONS:
1. Suggest 3-6 labour tasks that would be needed for this job
2. Don't suggest tasks already in the existing labour list
3. Use realistic time estimates for a qualified ${profile.trade || 'general'} tradesperson
4. Consider setup/pack up time, travel if relevant, and any testing/commissioning
5. Break complex work into logical phases (e.g., "Remove existing fixtures", "Install new wiring", "Test and commission")
6. Provide brief reasons explaining why each task takes the estimated time

Return task suggestions that are specific to the job type and trade.`;

    const { object: result } = await generateObject({
      model: openai('gpt-4o'),
      schema: SuggestedLabourSchema,
      prompt,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI Suggest Labour error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to suggest labour: ${errorMessage}` },
      { status: 500 }
    );
  }
}
