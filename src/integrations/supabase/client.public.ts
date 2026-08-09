// Shared server-side Supabase client using the PUBLIC/anon key.
// Mirrors the fetch fix already present in the auto-generated client.ts /
// client.server.ts files: newer Supabase API keys (sb_publishable_..., sb_secret_...)
// are opaque strings, not JWTs, so the default `Authorization: Bearer <key>`
// header the supabase-js client sets is invalid and causes every request to
// fail auth silently. We strip it and rely on the `apikey` header instead.
//
// Use this instead of hand-rolling `createClient(process.env.SUPABASE_URL!, ...)`
// in individual *.functions.ts files — that pattern is missing this fix and
// will 401 on projects using the new key format.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith('sb_publishable_') || value.startsWith('sb_secret_');
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    if (isNewSupabaseApiKey(supabaseKey) && headers.get('Authorization') === `Bearer ${supabaseKey}`) {
      headers.delete('Authorization');
    }

    headers.set('apikey', supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

export function createPublicClient() {
  // On Lovable, SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY are injected into the
  // server runtime. On other hosts (Vercel, Netlify, self-hosted) they may not
  // be, which would make every public read throw and render empty sections.
  // Fall back to the build-time inlined VITE_ values — they hold the exact same
  // public project URL + publishable (anon) key, so this leaks nothing new.
  const SUPABASE_URL = process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY =
    process.env.SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    const missing = [
      ...(!SUPABASE_URL ? ['SUPABASE_URL'] : []),
      ...(!SUPABASE_PUBLISHABLE_KEY ? ['SUPABASE_PUBLISHABLE_KEY'] : []),
    ];
    const message = `Missing Supabase environment variable(s): ${missing.join(', ')}. Connect Supabase in Lovable Cloud.`;
    console.error(`[Supabase] ${message}`);
    throw new Error(message);
  }


  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: {
      fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY),
    },
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
