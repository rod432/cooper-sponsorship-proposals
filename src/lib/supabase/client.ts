import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  if (browserClient) return browserClient;
  browserClient = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  return browserClient;
}

export const supabase: ReturnType<typeof createBrowserClient<Database>> =
  new Proxy({} as ReturnType<typeof createBrowserClient<Database>>, {
    get(_target, prop, receiver) {
      const client = createClient() as unknown as Record<string | symbol, unknown>;
      const value = Reflect.get(client, prop, receiver);
      return typeof value === "function" ? value.bind(client) : value;
    },
  });
