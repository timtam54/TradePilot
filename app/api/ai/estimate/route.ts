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

const EstimateSchema = z.object({
  labour: z.array(
    z.object({
      description: z.string(),
      hours: z.number(),
      rate: z.number(),
      total: z.number(),
    })
  ),
  materials_confirmed: z.array(
    z.object({
      job_material_id: z.string(),
      name: z.string(),
      qty: z.number(),
      unit_price: z.number(),
      total: z.number(),
    })
  ),
  materials_suggested: z.array(
    z.object({
      name: z.string(),
      qty: z.number(),
      reason: z.string(),
      estimated_price: z.number(),
    })
  ),
  confidence: z.number().min(0).max(100),
  confidence_reasoning: z.string(),
  notes: z.string(),
  totals: z.object({
    labour_total: z.number(),
    materials_total: z.number(),
    subtotal: z.number(),
    tax: z.number(),
    grand_total: z.number(),
  }),
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

    // Fetch job with customer and materials
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select(`
        *,
        customers (*),
        job_materials (*),
        job_labour (*)
      `)
      .eq('id', jobId)
      .eq('user_id', profile.id)
      .single();

    if (jobError || !job) {
      console.error('Job fetch error:', jobError);
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Format existing materials for the prompt
    const existingMaterials = (job.job_materials || []).map((m: { id: string; name: string; qty: number; sell_price: number; line_total: number }) => ({
      id: m.id,
      name: m.name,
      qty: m.qty,
      unit_price: m.sell_price,
      total: m.line_total,
    }));

    const existingLabour = job.job_labour || [];

    // Build the AI prompt
    const prompt = `You are an AI estimator for a ${profile.trade || 'general'} tradesperson in Australia.

Generate a detailed cost estimate for this job:

JOB DETAILS:
- Title: ${job.title}
- Description: ${job.description || 'Not provided'}
- Address: ${job.address || 'Not provided'}
- Customer: ${job.customers?.name || 'Not specified'}
- Estimated Hours: ${job.estimated_hours || 'Not specified'}
- Labour Rate: $${job.labour_rate || profile.default_labour_rate || 85}/hr

EXISTING MATERIALS (CONFIRMED - include these exactly as-is):
${existingMaterials.length > 0 ? JSON.stringify(existingMaterials, null, 2) : 'None added yet'}

EXISTING LABOUR ENTRIES:
${existingLabour.length > 0 ? JSON.stringify(existingLabour, null, 2) : 'None added yet'}

INSTRUCTIONS:
1. For materials_confirmed: Include ALL existing materials with their exact IDs and values
2. For materials_suggested: Suggest additional materials that might be needed based on the job type, with reasons
3. For labour: Break down the work into logical tasks with realistic hours for a ${profile.trade || 'general'} trade
4. Calculate totals with 10% GST
5. Provide a confidence score (0-100) based on how complete the job information is
6. Be realistic about Australian trade pricing

Return a complete estimate following the schema.`;

    const { object: estimate } = await generateObject({
      model: openai('gpt-4o'),
      schema: EstimateSchema,
      prompt,
    });

    return NextResponse.json(estimate);
  } catch (error) {
    console.error('AI Estimate error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to generate estimate: ${errorMessage}` },
      { status: 500 }
    );
  }
}
