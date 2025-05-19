import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cliente para usar en Server Components, API Routes, Route Handlers (con acceso a cookies)
export function createSupabaseServerClient() {
  const cookieStore = cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase URL or Anon Key is missing. Check your .env.local file."
    );
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      async get(name: string) {
        const store = await cookieStore;
        return store.get(name)?.value;
      },
      async set(name: string, value: string, options: CookieOptions) {
        try {
          const store = await cookieStore;
          store.set(name, value, options);
        } catch (error) {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
      async remove(name: string, options: CookieOptions) {
        try {
          const store = await cookieStore;
          store.set(name, "", options);
        } catch (error) {
          // The `delete` method was called from a Server Component.
        }
      },
    },
  });
}

// Cliente privilegiado para usar la service_role key (usar con precaución)
// Este cliente se salta RLS. Ideal para operaciones de backend puras.
import { createClient } from "@supabase/supabase-js";

export function createSupabaseServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Supabase URL or Service Role Key is missing. Check your .env.local file."
    );
  }
  // Nota: Este cliente no maneja cookies de sesión de usuario automáticamente.
  // Es para acceso directo del backend.
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      // Deshabilitar el almacenamiento automático de sesión para este cliente de servicio
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
