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

const SuggestedMaterialsSchema = z.object({
  materials: z.array(
    z.object({
      name: z.string(),
      qty: z.number(),
      unit: z.string(),
      estimated_buy_price: z.number(),
      reason: z.string(),
      supplier_hint: z.string().nullable(),
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
    // Check API key first
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

    // Fetch job with existing materials
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select(`
        *,
        customers (*),
        job_materials (*)
      `)
      .eq('id', jobId)
      .eq('user_id', profile.id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const existingMaterials = (job.job_materials || []).map((m: { name: string; qty: number; unit: string }) =>
      `${m.name} (${m.qty} ${m.unit})`
    ).join(', ');

    const prompt = `You are an AI assistant for a ${profile.trade || 'general'} tradesperson in Australia.

Based on the job details, suggest materials that would typically be needed. Focus on commonly forgotten or essential items.

JOB DETAILS:
- Title: ${job.title}
- Description: ${job.description || 'Not provided'}
- Trade: ${profile.trade || 'general'}

EXISTING MATERIALS ALREADY ADDED:
${existingMaterials || 'None yet'}

INSTRUCTIONS:
1. Suggest 3-6 materials that would likely be needed for this job
2. Don't suggest materials already in the existing list
3. Use realistic Australian trade pricing (buy price before markup)
4. Use appropriate units (each, m, m2, kg, l, box, pack, roll, set)
5. Provide brief reasons why each material is needed
6. Optionally suggest common suppliers (Bunnings, Electrical Wholesaler, etc.)

Return suggestions that are specific to the job type and trade.`;

    const { object: result } = await generateObject({
      model: openai('gpt-4o'),
      schema: SuggestedMaterialsSchema,
      prompt,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI Suggest Materials error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to suggest materials: ${errorMessage}` },
      { status: 500 }
    );
  }
}
