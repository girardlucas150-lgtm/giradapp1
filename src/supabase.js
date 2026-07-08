import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://yixsnueaggzhvvbzrpjx.supabase.co";
const supabaseKey = "TA_CLE_PUBLISHABLE"; // remplace par ta clé sb_publishable_...

export const supabase = createClient(supabaseUrl, supabaseKey);
