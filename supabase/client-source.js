import {createClient} from '@supabase/supabase-js';
const config = window.ECONOVA_CONFIG;
if (config?.supabaseUrl && config?.supabasePublishableKey) {
  window.econovaDb = createClient(config.supabaseUrl, config.supabasePublishableKey, {
    auth: {persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storage: window.sessionStorage, storageKey: 'econovalabs-admin-session'},
  });
}
