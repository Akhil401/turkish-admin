import { supabase } from "./supabaseClient";

export const auth = supabase.auth;
export const db = supabase;
export const storage = supabase.storage;
