
import { createClient } from '@supabase/supabase-js'

// TODO: Replace with your actual Supabase configurations
const supabaseUrl = 'https://mpzyucmgmobglotflrdi.supabase.co'
const supabaseKey = 'sb_publishable_4MfXaSvhj6DudFWrqoUyJQ_p4ZZuejk'

export const supabase = createClient(supabaseUrl, supabaseKey)
