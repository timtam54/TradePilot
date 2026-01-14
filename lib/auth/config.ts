import { Configuration, LogLevel } from '@azure/msal-browser';

// MSAL configuration for Microsoft authentication
export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_AD_TENANT_ID || 'common'}`,
    redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '',
    postLogoutRedirectUri: typeof window !== 'undefined' ? window.location.origin : '',
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: true,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            break;
          case LogLevel.Warning:
            console.warn(message);
            break;
          case LogLevel.Info:
            console.info(message);
            break;
          case LogLevel.Verbose:
            console.debug(message);
            break;
        }
      },
      logLevel: LogLevel.Warning,
    },
  },
};

// Scopes for Microsoft Graph API
export const loginRequest = {
  scopes: ['User.Read', 'email', 'profile', 'openid'],
};

// Google OAuth configuration
export const googleConfig = {
  clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
  scope: 'email profile openid',
};
