import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const SUPABASE_URL = 'https://llchtzsqknxskvxevakg.supabase.co'; // TODO: Replace with your Supabase project URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsY2h0enNxa254c2t2eGV2YWtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MTYxODAsImV4cCI6MjA2NzI5MjE4MH0.kWjrbmY4v5qmVw22_Trl-VFfe2Ro1af12dGv6iYGw90'; // TODO: Replace with your Supabase anon key

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);