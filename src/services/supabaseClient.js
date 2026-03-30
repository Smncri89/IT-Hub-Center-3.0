import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase env vars mancanti! Controlla .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Disable Web Locks API to prevent hanging in cross-origin iframes
    lock: (name, acquireTimeout, fn) => fn(),
  },
});