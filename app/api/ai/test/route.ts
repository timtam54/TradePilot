import { NextResponse } from 'next/server';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      status: 'error',
      message: 'OPENAI_API_KEY not found in environment variables'
    });
  }

  // Show first/last few chars of key for verification
  const keyPreview = `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`;

  try {
    const openai = createOpenAI({ apiKey });

    // Simple test call
    const result = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: 'Say "API key is valid" in exactly 4 words.',
    });

    return NextResponse.json({
      status: 'success',
      keyPreview,
      response: result.text,
      message: 'OpenAI API key is valid and working'
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorString = String(error);

    // Try to extract more details
    let details = {};
    if (error && typeof error === 'object' && 'cause' in error) {
      details = { cause: String(error.cause) };
    }

    return NextResponse.json({
      status: 'error',
      keyPreview,
      message: errorMessage,
      fullError: errorString,
      details,
      hint: errorMessage.includes('401') || errorMessage.includes('Unauthorized') ? 'Invalid API key or key not authorised for this project' :
            errorMessage.includes('429') ? 'Rate limited or out of credits' :
            errorMessage.includes('quota') ? 'Out of credits/quota exceeded' :
            errorMessage.includes('project') ? 'Project API key may need specific project access' :
            'Check the error message above'
    });
  }
}
