/**
 * Auth Callback Route
 * Handles OAuth callback and email verification redirects
 */

import { createServerAuthClient } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  if (code) {
    const supabase = await createServerAuthClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Redirect to dashboard or specified page
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
