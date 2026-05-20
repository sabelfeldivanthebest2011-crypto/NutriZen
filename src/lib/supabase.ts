import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nuyzjlfavbuyvglvjdoc.supabase.co';
const supabaseKey = 'sb_publishable_FXJ9IOIaCDNY7dPuffB1ww_ZuwSxUF6';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
