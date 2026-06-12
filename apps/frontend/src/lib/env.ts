export const env = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  supabaseAuthEnabled: import.meta.env.VITE_SUPABASE_AUTH_ENABLED === undefined
    ? import.meta.env.PROD
    : import.meta.env.VITE_SUPABASE_AUTH_ENABLED === 'true',
}

if (env.supabaseAuthEnabled && (!env.supabaseUrl || !env.supabaseAnonKey)) {
  throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required when auth is enabled')
}
