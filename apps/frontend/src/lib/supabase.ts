import { createClient } from '@supabase/supabase-js'
import { env } from './env'

export const supabase = env.supabaseAuthEnabled
  ? createClient(env.supabaseUrl!, env.supabaseAnonKey!)
  : null
