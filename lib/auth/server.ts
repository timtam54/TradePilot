import { headers } from 'next/headers';
import { getSupabase } from '../db';
import { Profile } from '../types';

interface TokenPayload {
  sub: string;
  email?: string;
  name?: string;
  preferred_username?: string;
  oid?: string;
}

export async function getAuthUser(): Promise<{ id: string; email: string; provider: string } | null> {
  const headersList = await headers();
  const authorization = headersList.get('authorization');
  const provider = headersList.get('x-auth-provider') as 'microsoft' | 'google' | null;

  if (!authorization || !provider) {
    return null;
  }

  const token = authorization.replace('Bearer ', '');

  try {
    if (provider === 'google') {
      // For Google, fetch user info from Google API
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json();
        return {
          id: userInfo.sub,
          email: userInfo.email || '',
          provider: 'google',
        };
      }
      return null;
    } else if (provider === 'microsoft') {
      // For Microsoft, parse the JWT
      const payload = JSON.parse(atob(token.split('.')[1])) as TokenPayload;
      return {
        id: payload.oid || payload.sub,
        email: payload.preferred_username || payload.email || '',
        provider: 'microsoft',
      };
    }

    return null;
  } catch {
    return null;
  }
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const authUser = await getAuthUser();
  if (!authUser) return null;

  const supabase = getSupabase();
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_provider', authUser.provider)
    .eq('auth_provider_id', authUser.id)
    .single();

  return profile as Profile | null;
}

export async function requireAuth(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) {
    throw new Error('Unauthorized');
  }
  return profile;
}

export async function createProfile(data: {
  email: string;
  full_name: string;
  auth_provider: string;
  auth_provider_id: string;
  trade?: string;
  company_name?: string;
}): Promise<Profile> {
  const supabase = getSupabase();

  // Check if profile already exists
  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_provider', data.auth_provider)
    .eq('auth_provider_id', data.auth_provider_id)
    .single();

  if (existing) {
    return existing as Profile;
  }

  // Create new profile
  const { data: newProfile, error } = await supabase
    .from('profiles')
    .insert({
      email: data.email,
      full_name: data.full_name,
      auth_provider: data.auth_provider,
      auth_provider_id: data.auth_provider_id,
      trade: data.trade || 'general',
      company_name: data.company_name || null,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return newProfile as Profile;
}
