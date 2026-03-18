import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nhdmophczqlwozghjqdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oZG1vcGhjenFsd296Z2hqcWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNDg2NjIsImV4cCI6MjA3NzgyNDY2Mn0.KmQYraUNHt5QRKPsxDL0faD_rul2sKLzPBcnBS63OdA';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Disable Web Locks API to prevent hanging in cross-origin iframes
    lock: (name, acquireTimeout, fn) => fn(),
  }
});