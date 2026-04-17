// src/lib/google-oauth.ts
// Handles Google OAuth2 token refresh for Calendar API access

import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  process.env.NEXTAUTH_URL + '/api/auth/callback/google'
);

/**
 * Returns an authenticated OAuth2 client using a stored refresh token.
 * Call this before any Google API operation.
 */
export async function getAuthenticatedClient(refreshToken: string) {
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  // This automatically uses the refresh token to get a new access token
  return oauth2Client;
}

/**
 * Generates the Google OAuth URL with calendar scope.
 * Used if we ever need to prompt the user to re-connect.
 */
export function getCalendarAuthUrl(state?: string) {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/calendar.events'],
    state,
  });
}
