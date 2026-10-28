import { createClient } from '@supabase/supabase-js';

// Bu kalit ochiq (publishable) — brauzerda bo'lishi xavfsiz. Himoya Supabase RLS va funksiyalarda.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rvrlkrlcshyfhaulltzd.supabase.co';
const key =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_p3rb7ExBYpxWtMQqWEXtBQ_RcNMYme4';

export const supabase = createClient(url, key);
