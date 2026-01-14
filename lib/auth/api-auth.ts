import { NextRequest } from 'next/server';
import { getSupabase } from '@/lib/db';
import { Profile } from '@/lib/types';

export async function getAuthInfo(request: NextRequest): Promise<{ provider: string; providerId: string } | null> {
  const authHeader = request.headers.get('authorization');
  const provider = request.headers.get('x-auth-provider');

  if (!authHeader || !provider) return null;

  const token = authHeader.replace('Bearer ', '');

  if (provider === 'google') {
    // For Google, we'll fetch user info to get the sub
    try {
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json();
        return { provider, providerId: userInfo.sub };
      }
    } catch {
      // Token might be expired or invalid
    }
    return null;
  }

  // For Microsoft, parse the JWT
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const providerId = payload.oid || payload.sub;
    return { provider, providerId };
  } catch {
    return null;
  }
}

export async function getProfile(request: NextRequest): Promise<Profile | null> {
  const authInfo = await getAuthInfo(request);
  if (!authInfo) return null;

  const supabase = getSupabase();
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_provider', authInfo.provider)
    .eq('auth_provider_id', authInfo.providerId)
    .single();

  return profile as Profile | null;
}
