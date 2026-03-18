import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nhdmophczqlwozghjqdj.supabase.co';
const supabaseKey = '***REDACTED_SUPABASE_KEY***';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Disable Web Locks API to prevent hanging in cross-origin iframes
    lock: (name, acquireTimeout, fn) => fn(),
  }
});