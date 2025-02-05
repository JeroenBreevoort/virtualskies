import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://liezhahfavooiqmsfcvn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpZXpoYWhmYXZvb2lxbXNmY3ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg2ODIwOTksImV4cCI6MjA1NDI1ODA5OX0.jy42IRDZH5Q4FIJY_X6pC0zhDiZTLQz2bfvxigKVZ88';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // We don't need auth persistence
  }
}); 