'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { PublicClientApplication, AccountInfo, AuthenticationResult } from '@azure/msal-browser';
import { msalConfig, loginRequest } from './config';
import { AuthUser, Profile } from '../types';

interface GoogleUserInfo {
  sub: string;
  email: string;
  name?: string;
  access_token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginWithMicrosoft: () => Promise<void>;
  loginWithGoogle: (userInfo: GoogleUserInfo) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  handleUnauthorized: () => void;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

let msalInstance: PublicClientApplication | null = null;

function getMsalInstance(): PublicClientApplication {
  if (!msalInstance) {
    msalInstance = new PublicClientApplication(msalConfig);
  }
  return msalInstance;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (authUser: AuthUser) => {
    try {
      const response = await fetch('/api/auth/profile', {
        headers: {
          Authorization: `Bearer ${authUser.access_token}`,
          'X-Auth-Provider': authUser.provider,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        return data.profile;
      }
      return null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user);
    }
  }, [user, fetchProfile]);

  // Initialize auth state from storage
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        // Check for stored user
        const storedUser = localStorage.getItem('tradepilot_user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser) as AuthUser;
          setUser(parsedUser);
          await fetchProfile(parsedUser);
        }

        // Initialize MSAL and check for active account
        const msal = getMsalInstance();
        await msal.initialize();

        const accounts = msal.getAllAccounts();
        if (accounts.length > 0 && !storedUser) {
          // Silently acquire token
          try {
            const response = await msal.acquireTokenSilent({
              ...loginRequest,
              account: accounts[0],
            });
            const authUser = mapMsalToAuthUser(accounts[0], response.accessToken);
            setUser(authUser);
            localStorage.setItem('tradepilot_user', JSON.stringify(authUser));
            await fetchProfile(authUser);
          } catch {
            // Silent token acquisition failed, user needs to login again
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [fetchProfile]);

  const mapMsalToAuthUser = (account: AccountInfo, accessToken: string): AuthUser => ({
    id: account.localAccountId,
    email: account.username,
    name: account.name || account.username,
    provider: 'microsoft',
    access_token: accessToken,
  });

  const loginWithMicrosoft = async () => {
    setIsLoading(true);
    try {
      const msal = getMsalInstance();
      await msal.initialize();

      const response: AuthenticationResult = await msal.loginPopup(loginRequest);

      if (response.account) {
        const authUser = mapMsalToAuthUser(response.account, response.accessToken);
        setUser(authUser);
        localStorage.setItem('tradepilot_user', JSON.stringify(authUser));

        // Create or fetch profile
        const profileData = await createOrFetchProfile(authUser);
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Microsoft login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (userInfo: { sub: string; email: string; name?: string; access_token: string }) => {
    setIsLoading(true);
    try {
      const authUser: AuthUser = {
        id: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name || userInfo.email,
        provider: 'google',
        access_token: userInfo.access_token,
      };

      setUser(authUser);
      localStorage.setItem('tradepilot_user', JSON.stringify(authUser));

      // Create or fetch profile
      const profileData = await createOrFetchProfile(authUser);
      setProfile(profileData);
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const createOrFetchProfile = async (authUser: AuthUser): Promise<Profile | null> => {
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authUser.access_token}`,
          'X-Auth-Provider': authUser.provider,
        },
        body: JSON.stringify({
          email: authUser.email,
          full_name: authUser.name,
          auth_provider: authUser.provider,
          auth_provider_id: authUser.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.profile;
      }
      return null;
    } catch (error) {
      console.error('Error creating/fetching profile:', error);
      return null;
    }
  };

  const logout = async () => {
    try {
      const msal = getMsalInstance();
      await msal.initialize();

      if (user?.provider === 'microsoft') {
        const accounts = msal.getAllAccounts();
        if (accounts.length > 0) {
          await msal.logoutPopup({
            account: accounts[0],
          });
        }
      }

      // Clear local state
      setUser(null);
      setProfile(null);
      localStorage.removeItem('tradepilot_user');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if MSAL logout fails
      setUser(null);
      setProfile(null);
      localStorage.removeItem('tradepilot_user');
    }
  };

  const refreshToken = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      if (user.provider === 'microsoft') {
        // For Microsoft, try silent token acquisition
        const msal = getMsalInstance();
        await msal.initialize();
        const accounts = msal.getAllAccounts();

        if (accounts.length > 0) {
          const response = await msal.acquireTokenSilent({
            ...loginRequest,
            account: accounts[0],
          });

          const refreshedUser = mapMsalToAuthUser(accounts[0], response.accessToken);
          setUser(refreshedUser);
          localStorage.setItem('tradepilot_user', JSON.stringify(refreshedUser));
          return true;
        }
      }
      // For Google, silent refresh is not possible without refresh tokens
      // User needs to re-authenticate
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }, [user]);

  const handleUnauthorized = useCallback(async () => {
    // Try to refresh token first
    const refreshed = await refreshToken();
    if (refreshed) {
      // Token refreshed successfully, retry the page
      window.location.reload();
      return;
    }

    // Clear the expired session
    setUser(null);
    setProfile(null);
    localStorage.removeItem('tradepilot_user');
    // Redirect to login
    window.location.href = '/auth/login';
  }, [refreshToken]);

  const value: AuthContextType = {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    loginWithMicrosoft,
    loginWithGoogle,
    logout,
    refreshProfile,
    handleUnauthorized,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
