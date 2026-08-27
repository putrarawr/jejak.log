import { createBrowserClient } from "@supabase/ssr";

const DEFAULT_SUPABASE_URL = "https://tmwfxdrpocaqdljsbnlv.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtd2Z4ZHJwb2NhcWRsanNibmx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3MjU1OTAsImV4cCI6MjEwMzMwMTU5MH0.P19L5NSvqdAlIaxnXH2lD_yRGfHIIUDGqiTzWQKe7aA";

export function createClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://example.supabase.co"
      ? process.env.NEXT_PUBLIC_SUPABASE_URL
      : DEFAULT_SUPABASE_URL;

  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== "dummy-anon-key"
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      : DEFAULT_SUPABASE_ANON_KEY;

  return createBrowserClient(url, key);
}
